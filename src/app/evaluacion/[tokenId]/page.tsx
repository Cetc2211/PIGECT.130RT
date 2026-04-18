'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    ArrowRight, FileText, User, Shield, Check, AlertCircle, 
    CreditCard, Loader2, LogOut, ChevronRight, CheckCircle2
} from 'lucide-react';
import { validarMatricula, type MatriculaRegistro } from '@/lib/matricula-service';
import { encodeEvaluationPayload } from '@/lib/data-utils';
import { getEvaluationSessionById } from '@/lib/storage-local';
import FichaIdentificacionForm from '@/components/FichaIdentificacionForm';
import BdiForm from '@/components/BdiForm';
import BaiForm from '@/components/BaiForm';
import Phq9Form from '@/components/Phq9Form';
import Gad7Form from '@/components/Gad7Form';
import HadsForm from '@/components/HadsForm';
import BhsForm from '@/components/BhsForm';
import SsiForm from '@/components/SsiForm';
import ColumbiaForm from '@/components/ColumbiaForm';
import PlutchikForm from '@/components/PlutchikForm';
import IdareForm from '@/components/IdareForm';
import LiraForm from '@/components/LiraForm';
import GocaForm from '@/components/GocaForm';
import IpaForm from '@/components/IpaForm';
import CdfrForm from '@/components/CdfrForm';
import AssistForm from '@/components/AssistForm';
import EbmaForm from '@/components/EbmaForm';
import ChteForm from '@/components/ChteForm';

// Catálogo de formularios
const formComponents: Record<string, React.ComponentType<{ studentId?: string; grupoId?: string; matricula?: string; onComplete?: (result: any) => void }>> = {
    'ficha-id': FichaIdentificacionForm,
    'bdi-ii': BdiForm,
    'bai': BaiForm,
    'phq-9': Phq9Form,
    'gad-7': Gad7Form,
    'hads': HadsForm,
    'bhs': BhsForm,
    'ssi': SsiForm,
    'columbia': ColumbiaForm,
    'plutchik': PlutchikForm,
    'idare': IdareForm,
    'lira': LiraForm,
    'goca': GocaForm,
    'ipa': IpaForm,
    'cdfr': CdfrForm,
    'assist': AssistForm,
    'ebma': EbmaForm,
    'chte': ChteForm,
};

type TestFormProps = {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    sessionId?: string;
    onComplete?: (result: any) => void;
};

const formComponentsWithSession = formComponents as Record<string, React.ComponentType<TestFormProps>>;

// Nombres amigables para las pruebas
const testNames: Record<string, string> = {
    'ficha-id': 'Ficha de Identificación',
    'bdi-ii': 'BDI-II (Depresión)',
    'bai': 'BAI (Ansiedad)',
    'phq-9': 'PHQ-9 (Depresión)',
    'gad-7': 'GAD-7 (Ansiedad)',
    'hads': 'HADS (Ansiedad/Depresión)',
    'bhs': 'BHS (Desesperanza)',
    'ssi': 'SSI (Ideación Suicida)',
    'columbia': 'Columbia C-SSRS',
    'plutchik': 'Plutchik (Riesgo Suicida)',
    'idare': 'IDARE/STAI (Ansiedad)',
    'lira': 'LIRA (Riesgo Académico)',
    'goca': 'GOCA (Observación)',
    'ipa': 'IPA (Pensamientos Automáticos)',
    'cdfr': 'CDFR (Factores de Riesgo)',
    'assist': 'ASSIST (Sustancias)',
    'ebma': 'EBMA (Motivación)',
    'chte': 'CHTE (Hábitos de Estudio)',
};

interface SessionData {
    id: string;
    name: string;
    tests: string[];
    groups: string[];
    status: string;
    mode?: 'group' | 'individual';
    studentId?: string;
    studentName?: string;
    expedienteId?: string;
    expiresAt?: Date;
}

export default function EvaluacionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tokenId = params.tokenId as string;

    // Estados
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Modo: individual (sin matrícula) o grupal (con matrícula)
    const isIndividual = session?.mode === 'individual';
    
    // Identificación (solo modo grupal)
    const [step, setStep] = useState<'matricula' | 'consentimiento' | 'evaluacion' | 'completado'>('matricula');
    const [matriculaInput, setMatriculaInput] = useState('');
    const [validandoMatricula, setValidandoMatricula] = useState(false);
    const [estudiante, setEstudiante] = useState<MatriculaRegistro | null>(null);
    const [matriculaError, setMatriculaError] = useState<string | null>(null);
    
    // Consentimiento
    const [isConsented, setIsConsented] = useState(false);
    
    // Evaluación
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [completedTests, setCompletedTests] = useState<string[]>([]);
    const [expedienteId, setExpedienteId] = useState<string | null>(null);
    const [capturedResults, setCapturedResults] = useState<Record<string, any>>({});
    const [isGeneratingWhatsAppLink, setIsGeneratingWhatsAppLink] = useState(false);
    const [generatedBridgeCode, setGeneratedBridgeCode] = useState<string | null>(null);
    const [generationMessage, setGenerationMessage] = useState<string | null>(null);

    // Cargar datos de la sesión
    useEffect(() => {
        const loadSession = async () => {
            const fallbackFromQueryParams = () => {
                const testsParam = searchParams.get('tests') || '';
                const tests = testsParam
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean);

                if (tests.length === 0) {
                    setError('Sesion de evaluacion no encontrada o expirada');
                    setLoading(false);
                    return;
                }

                const modeParam = searchParams.get('mode');
                const forcedMode: 'group' | 'individual' = modeParam === 'individual' ? 'individual' : 'group';
                const studentNameFromLink = searchParams.get('studentName') || 'Consultante';
                const studentIdFromLink = searchParams.get('studentId') || searchParams.get('expedienteId') || undefined;
                const matriculaFromLink = searchParams.get('matricula') || '';

                setSession({
                    id: tokenId,
                    name: searchParams.get('sessionName') || 'Evaluacion Offline',
                    tests,
                    groups: [],
                    status: 'active',
                    mode: forcedMode,
                    studentId: studentIdFromLink,
                    studentName: studentNameFromLink,
                    expedienteId: studentIdFromLink,
                });

                if (forcedMode === 'individual') {
                    setStep('consentimiento');
                } else if (matriculaFromLink) {
                    setMatriculaInput(matriculaFromLink.toUpperCase());
                }

                setError(null);
                setLoading(false);
            };

            const hasSessionDataInLink = !!searchParams.get('tests');
            if (hasSessionDataInLink) {
                fallbackFromQueryParams();
                return;
            }

            const localSession = getEvaluationSessionById<any>(tokenId);
            if (localSession) {
                const sessionMode = localSession.mode || 'group';

                setSession({
                    id: localSession.id,
                    name: localSession.name,
                    tests: Array.isArray(localSession.tests) ? localSession.tests : [],
                    groups: Array.isArray(localSession.groups) ? localSession.groups : [],
                    status: localSession.status || 'active',
                    mode: sessionMode,
                    studentId: localSession.studentId || localSession.expedienteId,
                    studentName: localSession.studentName,
                    expedienteId: localSession.expedienteId,
                    expiresAt: localSession.expiresAt ? new Date(localSession.expiresAt) : undefined,
                });

                if (sessionMode === 'individual') {
                    setStep('consentimiento');
                } else if (searchParams.get('matricula')) {
                    setMatriculaInput((searchParams.get('matricula') || '').toUpperCase());
                }

                setError(null);
                setLoading(false);
                return;
            }

            if (!localSession) {
                fallbackFromQueryParams();
                return;
            }
        };

        loadSession();
    }, [tokenId, searchParams]);

    // Validar matrícula (solo modo grupal)
    const handleValidarMatricula = async () => {
        if (!matriculaInput.trim()) {
            setMatriculaError('Ingrese su matrícula');
            return;
        }

        setValidandoMatricula(true);
        setMatriculaError(null);

        try {
            const matriculaData = await validarMatricula(matriculaInput.trim().toUpperCase());
            
            if (matriculaData) {
                setEstudiante(matriculaData);
                setStep('consentimiento');
            } else {
                setMatriculaError('Matrícula no encontrada. Verifique e intente nuevamente.');
            }
        } catch (err) {
            console.error('Error validando matrícula:', err);
            setMatriculaError('Error al validar la matrícula');
        }
        
        setValidandoMatricula(false);
    };

    // Iniciar evaluación
    const handleIniciarEvaluacion = async () => {
        try {
            if (isIndividual) {
                // Modo individual: el expediente ya existe, usamos el expedienteId
                setExpedienteId(session?.studentId || session?.expedienteId || null);
                setStep('evaluacion');
            } else if (estudiante && session) {
                // Modo grupal: NO creamos expediente desde el cliente anónimo.
                // El expediente lo crea el personal autenticado después de recibir
                // los resultados. Solo registramos la vinculación con la matrícula.
                setExpedienteId(estudiante.grupoId || null);
                setStep('evaluacion');
            }
        } catch (err) {
            console.error('Error iniciando evaluación:', err);
            alert('Error al iniciar la evaluación. Intente nuevamente.');
        }
    };

    // Completar prueba actual y avanzar
    const handleTestComplete = (result?: any) => {
        const currentTestId = session?.tests[currentTestIndex];
        if (currentTestId) {
            setCompletedTests(prev => [...prev, currentTestId]);
            if (typeof result !== 'undefined') {
                setCapturedResults(prev => ({
                    ...prev,
                    [currentTestId]: result,
                }));
            }
        }

        if (currentTestIndex < (session?.tests.length || 0) - 1) {
            setCurrentTestIndex(prev => prev + 1);
        } else {
            setStep('completado');
        }
    };

    // Nombre del estudiante según el modo
    const displayStudentName = isIndividual
        ? session?.studentName || 'Estudiante'
        : estudiante?.nombreCompleto || '';

    const displayStudentId = isIndividual
        ? (session?.studentId || session?.expedienteId || undefined)
        : (estudiante?.grupoId || undefined);

    const handleEnviarPorWhatsApp = async () => {
        const failsafe = setTimeout(() => {
            setIsGeneratingWhatsAppLink(false);
        }, 8000);

        try {
            setIsGeneratingWhatsAppLink(true);
            setGenerationMessage(null);
            setGeneratedBridgeCode(null);

            const payload = {
                version: 'wa-bridge-v1',
                createdAt: new Date().toISOString(),
                tokenId,
                sessionId: session?.id,
                mode: isIndividual ? 'individual' : 'group',
                student: {
                    id: expedienteId || displayStudentId || null,
                    name: displayStudentName,
                    matricula: isIndividual ? null : estudiante?.matricula || null,
                    grupoId: isIndividual ? null : estudiante?.grupoId || null,
                    grupoNombre: isIndividual ? null : estudiante?.grupoNombre || null,
                },
                tests: session?.tests || [],
                completedTests,
                results: capturedResults,
            };

            const encoded = await Promise.race<string | null>([
                encodeEvaluationPayload(payload),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
            ]);

            let code = encoded;

            if (!code) {
                // Fallback defensivo para WebViews/iPad cuando una promesa de compresión se queda colgada.
                const json = JSON.stringify(payload);
                const utf8 = new TextEncoder().encode(json);
                let binary = '';
                for (let i = 0; i < utf8.length; i += 1) {
                    binary += String.fromCharCode(utf8[i]);
                }
                code = `raw.${btoa(binary)}`;
            }

            const prefixedCode = `PIGEC-WA1:${code}`;
            const message = [
                'Hola, comparto mi codigo de evaluacion PIGEC para importacion offline:',
                '',
                prefixedCode,
            ].join('\n');

            setGeneratedBridgeCode(prefixedCode);

            let copied = false;
            try {
                const copyResult = await Promise.race<boolean | null>([
                    navigator.clipboard.writeText(prefixedCode).then(() => true),
                    new Promise<null>((resolve) => setTimeout(() => resolve(null), 900)),
                ]);
                copied = copyResult === true;
            } catch {
                copied = false;
            }

            const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            const popup = window.open(waUrl, '_blank', 'noopener,noreferrer');
            if (!popup) {
                setGenerationMessage(
                    copied
                        ? 'Codigo generado y copiado. Abra el chat de WhatsApp del evaluador, pegue el codigo y envielo.'
                        : 'Codigo generado. Abra el chat de WhatsApp del evaluador, copie el codigo, peguelo y envielo.'
                );
            } else {
                setGenerationMessage(
                    copied
                        ? 'Codigo generado y copiado. Si WhatsApp no se completa solo, pegue el codigo en el chat del evaluador y envielo.'
                        : 'Codigo generado correctamente. Copie el codigo y peguelo en el chat de WhatsApp del evaluador.'
                );
            }
        } catch (error) {
            console.error('Error generando enlace de WhatsApp:', error);
            setGenerationMessage('No se pudo generar el codigo para WhatsApp.');
        } finally {
            clearTimeout(failsafe);
            setIsGeneratingWhatsAppLink(false);
        }
    };

    const handleCopiarCodigo = async () => {
        if (!generatedBridgeCode) return;
        try {
            await navigator.clipboard.writeText(generatedBridgeCode);
            setGenerationMessage('Codigo copiado al portapapeles.');
        } catch {
            setGenerationMessage('No se pudo copiar automaticamente. Seleccione y copie manualmente.');
        }
    };

    // Renderizado de estados
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando sesión de evaluación...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
                        <p className="text-red-600">{error}</p>
                        <p className="text-sm text-red-500 mt-4">
                            Contacte al personal de orientación si cree que esto es un error.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // MATRÍCULA (solo modo grupal)
    if (step === 'matricula') {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl">PIGEC-130</CardTitle>
                        <CardDescription>
                            {session?.name || 'Sistema de Evaluación Psicométrica'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="matricula">Ingrese su Matrícula</Label>
                            <Input
                                id="matricula"
                                placeholder="Ej: CBTA-2026-G1A-001"
                                value={matriculaInput}
                                onChange={(e) => setMatriculaInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleValidarMatricula()}
                                className="font-mono text-center text-lg"
                            />
                            {matriculaError && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {matriculaError}
                                </p>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Su matrícula le fue proporcionada por su tutor o el departamento de orientación
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full" 
                            onClick={handleValidarMatricula}
                            disabled={validandoMatricula}
                        >
                            {validandoMatricula ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Validando...
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // CONSENTIMIENTO
    if (step === 'consentimiento' && (estudiante || isIndividual)) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full">
                    <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Bienvenido/a</CardTitle>
                                <p className="text-lg font-semibold text-gray-700">{displayStudentName}</p>
                                {isIndividual && (
                                    <p className="text-sm text-gray-500">
                                        Evaluación individual — Expediente exclusivo
                                    </p>
                                )}
                                {!isIndividual && (
                                    <p className="text-sm text-gray-500">{estudiante?.grupoNombre}</p>
                                )}
                            </div>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-amber-700">
                            <Shield className="h-4 w-4" />
                            Consentimiento Informado Digital
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Sesión:</strong> {session?.name}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                <strong>Pruebas a realizar:</strong> {session?.tests.length || 0}
                            </p>
                            {isIndividual && (
                                <p className="text-sm text-blue-700 mt-1">
                                    <strong>Modalidad:</strong> Individual (sin matrícula)
                                </p>
                            )}
                        </div>

                        <div className="text-sm text-gray-700 space-y-3">
                            <p>
                                Usted está a punto de realizar una evaluación psicométrica como parte del 
                                programa de detección temprana y apoyo del CBTA 130.
                            </p>
                            <p>
                                <strong>Confidencialidad:</strong> Los datos recopilados serán tratados con 
                                estricta confidencialidad por el personal autorizado, conforme a la Ley Federal 
                                de Protección de Datos Personales.
                            </p>
                            <p>
                                <strong>Propósito:</strong> Los resultados se utilizarán para generar orientación 
                                y, si es necesario, canalizarlo al servicio adecuado. Esto no constituye un 
                                tratamiento psicológico.
                            </p>
                            <p>
                                <strong>Consentimiento previo:</strong> Al continuar, usted confirma que fue 
                                informado sobre estos procesos al momento de su ingreso al CBTA 130.
                            </p>
                        </div>

                        <div className="flex items-start space-x-3 pt-4 border-t">
                            <Checkbox
                                id="consent"
                                checked={isConsented}
                                onCheckedChange={(checked) => setIsConsented(!!checked)}
                            />
                            <Label htmlFor="consent" className="text-sm cursor-pointer">
                                He leído y comprendo la información anterior. Acepto participar en esta evaluación.
                            </Label>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {!isIndividual && (
                            <Button variant="outline" onClick={() => setStep('matricula')}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Usar otra matrícula
                            </Button>
                        )}
                        <Button onClick={handleIniciarEvaluacion} disabled={!isConsented} className={!isIndividual ? '' : 'w-full'}>
                            Iniciar Evaluación
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // EVALUACIÓN
    if (step === 'evaluacion' && session) {
        const currentTestId = session.tests[currentTestIndex];
        const CurrentForm = currentTestId ? formComponentsWithSession[currentTestId] : null;
        const progress = ((completedTests.length) / session.tests.length) * 100;

        return (
            <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header con progreso */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">
                                    {session.name}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {displayStudentName}
                                    {isIndividual && ' • Evaluación individual'}
                                </p>
                            </div>
                            <Badge variant="secondary">
                                {completedTests.length + 1} de {session.tests.length}
                            </Badge>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Lista de pruebas completadas/pendientes */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        {session.tests.map((testId, index) => (
                            <Badge
                                key={testId}
                                variant={completedTests.includes(testId) ? 'default' : index === currentTestIndex ? 'secondary' : 'outline'}
                                className={completedTests.includes(testId) ? 'bg-green-500' : index === currentTestIndex ? 'bg-blue-500 text-white' : ''}
                            >
                                {completedTests.includes(testId) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {testNames[testId] || testId}
                            </Badge>
                        ))}
                    </div>

                    {/* Formulario actual */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {testNames[currentTestId] || 'Evaluación'}
                            </CardTitle>
                            <CardDescription>
                                Complete todas las preguntas y presione "Finalizar" al terminar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {CurrentForm ? (
                                <CurrentForm 
                                    studentId={expedienteId || displayStudentId}
                                    grupoId={!isIndividual ? estudiante?.grupoId : undefined}
                                    matricula={!isIndividual ? estudiante?.matricula : undefined}
                                    sessionId={tokenId}
                                    onComplete={handleTestComplete}
                                />
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                                    <p>Instrumento no disponible</p>
                                    <Button className="mt-4" onClick={handleTestComplete}>
                                        Continuar
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // COMPLETADO
    if (step === 'completado') {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-700 mb-2">
                            ¡Evaluación Completada!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Gracias por completar todas las evaluaciones, {displayStudentName.split(' ')[0]}.
                        </p>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                            <p className="text-sm text-green-800">
                                Sus respuestas se codificaran en un codigo seguro para que usted lo envie por WhatsApp al evaluador que le compartio este enlace.
                            </p>
                        </div>
                        <div className="bg-sky-50 p-4 rounded-lg border border-sky-200 mb-4 text-left">
                            <p className="text-xs font-semibold text-sky-800 mb-2">Siguiente paso obligatorio</p>
                            <ol className="text-xs text-sky-700 space-y-1 list-decimal pl-4">
                                <li>De clic en "Generar Codigo de Resultados".</li>
                                <li>Copie el codigo (se intentara copiar automaticamente).</li>
                                <li>Pegue el codigo en el chat de WhatsApp del evaluador.</li>
                                <li>Envie el mensaje para que puedan registrar sus resultados.</li>
                            </ol>
                        </div>
                        <div className="text-sm text-gray-500">
                            <p><strong>Pruebas completadas:</strong> {completedTests.length}</p>
                            {completedTests.map(tId => (
                                <p key={tId} className="text-xs mt-1">✓ {testNames[tId] || tId}</p>
                            ))}
                        </div>
                        <Button
                            className="w-full mt-6"
                            onClick={handleEnviarPorWhatsApp}
                            disabled={isGeneratingWhatsAppLink}
                        >
                            {isGeneratingWhatsAppLink ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando codigo...
                                </>
                            ) : (
                                'Generar Codigo de Resultados'
                            )}
                        </Button>
                        {generationMessage && (
                            <p className="mt-3 text-xs text-slate-600">{generationMessage}</p>
                        )}
                        {generatedBridgeCode && (
                            <div className="mt-3 space-y-2 text-left">
                                <Label htmlFor="codigo-resultado" className="text-xs text-slate-600">
                                    Codigo de resultados
                                </Label>
                                <Input
                                    id="codigo-resultado"
                                    value={generatedBridgeCode}
                                    readOnly
                                    className="font-mono text-xs"
                                />
                                <Button variant="outline" className="w-full" onClick={handleCopiarCodigo}>
                                    Copiar Codigo
                                </Button>
                            </div>
                        )}
                        <p className="mt-6 text-xs text-gray-400">
                            Ya puede cerrar esta ventana.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
