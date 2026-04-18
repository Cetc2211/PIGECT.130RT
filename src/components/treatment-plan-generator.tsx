'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from './ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TreatmentPlan } from '@/lib/store';
import PIEIValidation from './PIEIValidation';
import {
    Bot,
    ShieldCheck,
    KeyRound,
    RefreshCw,
    BookOpen,
    FileText,
    FileUp,
    Trash2,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    Plus,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { assembleClinicalContext, checkDataAvailability, type DataAvailability } from '@/lib/clinical-context-assembler';
import { generateClinicalPlan, hasUserGeminiApiKey, type PdfFileReference } from '@/lib/ai-service';
import { getBuiltInBibliographySummary } from '@/lib/built-in-bibliography';
import {
    getReferenceDocuments,
    getAllReferenceText,
    getPdfDocumentsForGeneration,
    processAndUploadFile,
    deleteReferenceDocument,
    saveReferenceDocument,
    type ReferenceDocument,
} from '@/lib/reference-documents-service';

import type { ClinicalAssessment } from '@/lib/store';
import type { FunctionalAnalysis } from '@/lib/store';
import type { Expediente } from '@/lib/expediente-service';

// ─── PROPS ─────────────────────────────────────────────────────────────────

interface TreatmentPlanGeneratorProps {
    studentId: string;
    studentName: string;
    clinicalAssessment?: ClinicalAssessment | undefined;
    functionalAnalysis?: FunctionalAnalysis | undefined;
    expediente?: Expediente | undefined;
    initialData?: TreatmentPlan;
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export default function TreatmentPlanGenerator({
    studentId,
    studentName,
    clinicalAssessment,
    functionalAnalysis,
    expediente,
    initialData,
}: TreatmentPlanGeneratorProps) {
    const [plan, setPlan] = useState(initialData?.plan_narrativo_final || '');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isPieiModalOpen, setIsPieiModalOpen] = useState(false);
    const [bibliographyDialogOpen, setBibliographyDialogOpen] = useState(false);
    const [referenceDocs, setReferenceDocs] = useState<ReferenceDocument[]>([]);
    const [dataAvailability, setDataAvailability] = useState<DataAvailability | null>(null);
    const [clinicalContextPreview, setClinicalContextPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialData?.plan_narrativo_final) {
            setPlan(initialData.plan_narrativo_final);
        }
    }, [initialData]);

    // Load data availability and reference documents on mount
    useEffect(() => {
        const loadMeta = async () => {
            try {
                const docs = await getReferenceDocuments();
                setReferenceDocs(docs);
                const availability = checkDataAvailability(studentId, docs.length);
                setDataAvailability(availability);
            } catch (err) {
                console.error('Error loading metadata:', err);
            }
        };
        loadMeta();
    }, [studentId]);

    const handleGeneratePlan = useCallback(async () => {
        if (!hasUserGeminiApiKey()) {
            setError('Configura tu API Key de Google Gemini en Ajustes para activar la generación con IA.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setLoadingStage('Recopilando datos clínicos...');

        try {
            // Assemble all clinical data
            const clinicalContext = assembleClinicalContext(studentId, studentName);
            setClinicalContextPreview(clinicalContext);

            // Get text-based reference documents
            const referenceText = await getAllReferenceText();

            // Get PDF documents for Gemini File API references
            setLoadingStage('Procesando documentos PDF...');
            const pdfDocs = await getPdfDocumentsForGeneration();
            const pdfFiles: PdfFileReference[] = pdfDocs
                .filter((doc) => doc.geminiUri && doc.geminiFileName)
                .map((doc) => ({
                    mimeType: doc.mimeType || 'application/pdf',
                    fileUri: doc.geminiUri!,
                    title: doc.title,
                }));

            // Generate plan with AI (including PDF file references)
            setLoadingStage('Generando plan de tratamiento con IA...');
            const generatedPlan = await generateClinicalPlan(clinicalContext, referenceText, {
                pdfFiles: pdfFiles.length > 0 ? pdfFiles : undefined,
            });
            setPlan(generatedPlan);

            // Update data availability
            const docs = await getReferenceDocuments();
            const availability = checkDataAvailability(studentId, docs.length);
            setDataAvailability(availability);
        } catch (err: any) {
            const message = err?.message || 'Error desconocido al generar el plan.';
            setError(message);
        } finally {
            setIsLoading(false);
            setLoadingStage('');
        }
    }, [studentId, studentName]);

    const handleTriggerSave = () => {
        setIsPieiModalOpen(true);
    };

    const handleSavePlan = () => {
        const planData: TreatmentPlan = {
            studentId,
            plan_narrativo_final: plan,
            fecha_aprobacion: new Date().toISOString(),
        };

        console.log("Guardando plan de tratamiento:", planData);
        alert("Plan de Tratamiento guardado con éxito en el expediente del estudiante.");
        setIsPieiModalOpen(false);
    };

    // ─── Bibliography Management ───────────────────────────────────────

    const refreshDocs = useCallback(async () => {
        const docs = await getReferenceDocuments();
        setReferenceDocs(docs);
        const availability = checkDataAvailability(studentId, docs.length);
        setDataAvailability(availability);
    }, [studentId]);

    const [uploadProgress, setUploadProgress] = useState<{[id: string]: number}>({});
    const [uploadStage, setUploadStage] = useState<{[id: string]: string}>({});
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [manualText, setManualText] = useState('');
    const [manualTitle, setManualTitle] = useState('');
    const [savingManual, setSavingManual] = useState(false);

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploadError(null);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const tempId = `upload-${Date.now()}-${i}`;
            setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));
            setUploadStage((prev) => ({ ...prev, [tempId]: 'Iniciando...' }));

            try {
                await processAndUploadFile(file, {
                    onProgress: (pct, stage) => {
                        setUploadProgress((prev) => ({ ...prev, [tempId]: pct }));
                        setUploadStage((prev) => ({ ...prev, [tempId]: stage }));
                    },
                });
            } catch (err: any) {
                const msg = err?.message || 'Error desconocido';
                setUploadError(`Error al procesar "${file.name}": ${msg}`);
                console.error(`Error procesando ${file.name}:`, err);
            } finally {
                setUploadProgress((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
                setUploadStage((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
            }
        }

        await refreshDocs();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveManualText = async () => {
        if (!manualText.trim()) return;
        setSavingManual(true);
        try {
            const doc: ReferenceDocument = {
                id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                title: manualTitle.trim() || 'Referencia manual',
                author: 'No especificado',
                uploadedAt: new Date().toISOString(),
                contentText: manualText.trim(),
                fileName: '',
                fileSize: manualText.length,
                mimeType: 'text/plain',
                tags: [],
            };
            await saveReferenceDocument(doc);
            setManualText('');
            setManualTitle('');
            await refreshDocs();
        } catch (err) {
            console.error('Error guardando texto manual:', err);
            setUploadError('Error al guardar el texto de referencia.');
        } finally {
            setSavingManual(false);
        }
    };

    const handleDeleteDoc = async (id: string) => {
        try {
            await deleteReferenceDocument(id);
            await refreshDocs();
        } catch (err) {
            console.error('Error deleting document:', err);
        }
    };

    // ─── Render Helpers ────────────────────────────────────────────────

    const hasApiKey = hasUserGeminiApiKey();

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const totalChars = referenceDocs.reduce((sum, d) => sum + d.contentText.length, 0);

    return (
        <>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Módulo 3: Generador de Plan de Tratamiento
                    </CardTitle>
                    <CardDescription>
                        Generar y refinar el plan de intervención basado en la formulación del caso, utilizando IA con datos clínicos reales.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* API Key Warning */}
                    {!hasApiKey && (
                        <Alert variant="destructive">
                            <KeyRound className="h-4 w-4" />
                            <AlertTitle>API Key no configurada</AlertTitle>
                            <AlertDescription>
                                Para generar planes de tratamiento con IA, debes configurar tu API Key de Google Gemini en{' '}
                                <strong>Ajustes</strong>. Sin la clave, la funcionalidad de IA no estará disponible.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Data Availability Summary */}
                    {dataAvailability && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Datos disponibles para la generación
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <DataIndicator
                                    available={dataAvailability.hasClinicalAssessment}
                                    label="Evaluación Clínica (BDI-II, BAI, etc.)"
                                />
                                <DataIndicator
                                    available={dataAvailability.hasFunctionalAnalysis}
                                    label="Análisis Funcional de la Conducta"
                                />
                                <DataIndicator
                                    available={dataAvailability.testResultCount > 0}
                                    label={`Instrumentos de Evaluación (${dataAvailability.testResultCount} disponibles)`}
                                    partial={dataAvailability.testResultCount > 0 && dataAvailability.testResultCount < 3}
                                />
                                <DataIndicator
                                    available={dataAvailability.hasProgressTracking}
                                    label={`Seguimiento de Progreso (${dataAvailability.progressRecordCount} registros)`}
                                />
                                <DataIndicator
                                    available={dataAvailability.hasEducationalAssessment}
                                    label="Evaluación Educativa (CHTE)"
                                />
                                <DataIndicator
                                    available={true}
                                    label={`Biblioteca Clínica Integrada (${getBuiltInBibliographySummary().length} fuentes)`}
                                    isLibrary
                                />
                                <DataIndicator
                                    available={dataAvailability.hasReferenceDocuments}
                                    label={`Bibliografía adicional (${dataAvailability.referenceDocumentCount} documentos cargados)`}
                                    isLibrary
                                />
                            </div>
                        </div>
                    )}

                    {/* Generate / Regenerate Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                            onClick={handleGeneratePlan}
                            disabled={isLoading || !hasApiKey}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold w-full sm:w-auto"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando Plan...
                                </>
                            ) : (
                                <>
                                    <Bot className="mr-2" />
                                    {plan ? 'Regenerar Plan de Tratamiento con IA' : 'Generar Plan de Tratamiento con IA'}
                                </>
                            )}
                        </Button>
                        {plan && !isLoading && (
                            <Button
                                onClick={handleGeneratePlan}
                                disabled={!hasApiKey}
                                variant="outline"
                                size="sm"
                                className="text-gray-600"
                            >
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Regenerar
                            </Button>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm font-medium">
                                    {loadingStage || 'Generando plan de tratamiento...'}
                                </span>
                            </div>
                            {clinicalContextPreview && (
                                <details className="text-xs text-gray-600">
                                    <summary className="cursor-pointer hover:text-gray-800 font-medium">
                                        Ver contexto clínico enviado a la IA
                                    </summary>
                                    <pre className="mt-2 p-3 bg-white rounded border max-h-64 overflow-y-auto text-[10px] leading-relaxed whitespace-pre-wrap">
                                        {clinicalContextPreview}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error al generar el plan</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Generated Plan */}
                    {(plan || isLoading) && !error && (
                        <div className="space-y-4">
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Plan Clínico Narrativo (Editable)
                                </h3>
                                <Textarea
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    disabled={isLoading}
                                    className="min-h-[300px] bg-white text-sm font-mono"
                                    placeholder="El plan generado por la IA aparecerá aquí. Puedes editarlo manualmente después de la generación..."
                                />
                            </div>

                            {/* Data Used Summary */}
                            {plan && !isLoading && dataAvailability && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        Datos utilizados para la generación: Evaluación Clínica
                                        {dataAvailability.hasClinicalAssessment ? ' ✓' : ''} | Análisis Funcional
                                        {dataAvailability.hasFunctionalAnalysis ? ' ✓' : ''} |{' '}
                                        {dataAvailability.testResultCount} instrumentos |{' '}
                                        {dataAvailability.progressRecordCount} registros de seguimiento |{' '}
                                        {dataAvailability.referenceDocumentCount} documentos de referencia
                                    </p>
                                </div>
                            )}

                            {/* Bottom Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                                <Button
                                    onClick={() => setBibliographyDialogOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-600"
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Configurar Bibliografía
                                    {referenceDocs.length > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {referenceDocs.length}
                                        </Badge>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleTriggerSave}
                                    disabled={!plan || isLoading}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                >
                                    <ShieldCheck className="mr-2" />
                                    Finalizar y Validar Plan
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Bibliography Button when no plan yet */}
                    {!plan && !isLoading && (
                        <div className="flex justify-start">
                            <Button
                                onClick={() => setBibliographyDialogOpen(true)}
                                variant="outline"
                                size="sm"
                                className="text-gray-600"
                            >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Configurar Bibliografía
                                {referenceDocs.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {referenceDocs.length}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* PIEI Validation Modal */}
            <PIEIValidation
                isOpen={isPieiModalOpen}
                onClose={() => setIsPieiModalOpen(false)}
                onConfirm={handleSavePlan}
            />

            {/* Bibliography Management Dialog */}
            <Dialog open={bibliographyDialogOpen} onOpenChange={setBibliographyDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Bibliografía de Referencia
                        </DialogTitle>
                        <DialogDescription>
                            Administra la bibliografia clinica. La biblioteca integrada se incluye automaticamente en todos los expedientes.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-6 py-2">
                        {/* Built-in Library Info */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-800 mb-1">
                                Biblioteca Clinica Integrada (siempre disponible)
                            </p>
                            <p className="text-xs text-blue-700">
                                La aplicacion incluye {getBuiltInBibliographySummary().length} fuentes clinicas que se usan automaticamente en todos los planes. No necesitas volver a cargarlas.
                            </p>
                            <div className="mt-2 space-y-1">
                                {getBuiltInBibliographySummary().map((ref, i) => (
                                    <p key={i} className="text-[10px] text-blue-600">
                                        {ref.author} - {ref.title} ({ref.model})
                                    </p>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Upload Files */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">Cargar Archivos</h4>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.md,.csv,.json,.pdf"
                                multiple
                                onChange={handleUploadFile}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={Object.keys(uploadProgress).length > 0}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileUp className="mr-2 h-4 w-4" />
                                {Object.keys(uploadProgress).length > 0
                                    ? `Procesando... (${Object.keys(uploadProgress).length})`
                                    : 'Seleccionar archivos (.txt, .md, .csv, .json, .pdf)'}
                            </Button>
                            <p className="text-xs text-gray-500">
                                Compatible con archivos de texto y PDF. Los PDFs se procesan con IA de Gemini si tienes API Key configurada.
                            </p>

                            {/* Upload Error */}
                            {uploadError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {uploadError}
                                </div>
                            )}

                            {/* Upload Progress Indicators */}
                            {Object.entries(uploadProgress).map(([id, pct]) => (
                                <div key={id} className="space-y-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-800">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-xs font-medium">
                                            {uploadStage[id] || 'Procesando...'} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                                        <div
                                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        {/* ── Section 2: Manual Text Entry ── */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">Agregar Texto de Referencia</h4>
                            <p className="text-xs text-gray-500">
                                Pega directamente el contenido de un artículo, capítulo o guía clínica.
                            </p>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Título de la referencia (ej. Beck, 2011 - Terapia Cognitiva)"
                                    value={manualTitle}
                                    onChange={(e) => setManualTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Textarea
                                    placeholder="Pega aquí el texto de la referencia bibliográfica..."
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    className="min-h-[120px] text-sm"
                                />
                                <Button
                                    type="button"
                                    onClick={handleSaveManualText}
                                    disabled={savingManual || !manualText.trim()}
                                    size="sm"
                                >
                                    {savingManual ? (
                                        <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Guardando...</>
                                    ) : (
                                        <><Plus className="mr-2 h-3 w-3" />Agregar Referencia</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Section 3: Documents List ── */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">Documentos Cargados</h4>
                            {referenceDocs.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            {referenceDocs.length} documento{referenceDocs.length !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Total: {totalChars.toLocaleString()} caracteres
                                        </span>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {referenceDocs.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border group"
                                            >
                                                <FileText className={`h-4 w-4 mt-0.5 shrink-0 ${doc.isPdf ? 'text-red-400' : 'text-gray-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {doc.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {doc.fileName && `${doc.fileName} · `}
                                                        {formatFileSize(doc.fileSize)}
                                                        {doc.isPdf && ' · PDF'}
                                                        {doc.pdfPageCount && ` · ${doc.pdfPageCount} págs.`}
                                                        {doc.textExtractionMethod === 'native' && ' · Procesado por Gemini'}
                                                        {!doc.fileName && !doc.isPdf && ` · Texto manual`}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteDoc(doc.id)}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-100 shrink-0"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hay documentos de referencia.</p>
                                    <p className="text-xs mt-1">
                                        Carga un archivo o pega texto para agregar bibliografía.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setBibliographyDialogOpen(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─── Sub-Component: Data Indicator ────────────────────────────────────────

function DataIndicator({
    available,
    label,
    partial,
    isLibrary,
}: {
    available: boolean;
    label: string;
    partial?: boolean;
    isLibrary?: boolean;
}) {
    if (isLibrary) {
        return (
            <div className="flex items-center gap-2 text-sm">
                {available ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                    <XCircle className="h-4 w-4 text-gray-300 shrink-0" />
                )}
                <span className={available ? 'text-gray-700' : 'text-gray-400'}>
                    📚 {label}
                </span>
            </div>
        );
    }

    if (partial) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                <span className="text-yellow-700">{label}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            {available ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className={available ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
        </div>
    );
}
