'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "./ui/textarea";
import { ClinicalAssessment } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { AlertTriangle, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { getTestResults, saveClinicalAssessment } from '@/lib/storage-local';
import type { Expediente } from '@/lib/expediente-service';

interface ClinicalAssessmentFormProps {
    initialData?: ClinicalAssessment;
    studentId?: string;
    expediente?: Expediente;
}

// Nombres amigables para las pruebas
const testLabels: Record<string, string> = {
    'PHQ-9': 'PHQ-9 (Depresión)',
    'GAD-7': 'GAD-7 (Ansiedad)',
    'BDI-II': 'BDI-II (Depresión Beck)',
    'BAI': 'BAI (Ansiedad Beck)',
    'HADS': 'HADS (Ansiedad/Depresión)',
    'IDARE/STAI': 'IDARE (Ansiedad Rasgo-Estado)',
    'BHS': 'BHS (Desesperanza)',
    'IPA': 'IPA (Pensamientos Automáticos)',
    'SSI': 'SSI (Ideación Suicida)',
    'Columbia C-SSRS': 'Columbia (Severidad Suicida)',
    'Plutchik': 'Plutchik (Riesgo Suicida)',
    'CDFR': 'CDFR (Factores de Riesgo)',
    'ASSIST': 'ASSIST (Sustancias)',
    'CHTE': 'CHTE (Hábitos de Estudio)',
};

interface TestResult {
    id: string;
    testType: string;
    canonicalType?: string;
    score: number;
    interpretation: string;
    date: string;
    alerts?: string[];
}

type TestCategory = 'Depresion' | 'Ansiedad' | 'Desesperanza y Pensamientos' | 'Ideacion y Conducta Suicida' | 'Conductas de Riesgo' | 'Psicopedagogicas';

type ActiveTestDefinition = {
    key: string;
    label: string;
    category: TestCategory;
};

const ACTIVE_TESTS_CATALOG: ActiveTestDefinition[] = [
    { key: 'PHQ-9', label: 'PHQ-9 (Depresion)', category: 'Depresion' },
    { key: 'BDI-II', label: 'BDI-II (Depresion Beck)', category: 'Depresion' },
    { key: 'GAD-7', label: 'GAD-7 (Ansiedad)', category: 'Ansiedad' },
    { key: 'BAI', label: 'BAI (Ansiedad Beck)', category: 'Ansiedad' },
    { key: 'HADS', label: 'HADS (Ansiedad/Depresion)', category: 'Ansiedad' },
    { key: 'IDARE/STAI', label: 'IDARE/STAI (Ansiedad Rasgo-Estado)', category: 'Ansiedad' },
    { key: 'BHS', label: 'BHS (Desesperanza)', category: 'Desesperanza y Pensamientos' },
    { key: 'IPA', label: 'IPA (Pensamientos Automaticos)', category: 'Desesperanza y Pensamientos' },
    { key: 'SSI', label: 'SSI (Ideacion Suicida)', category: 'Ideacion y Conducta Suicida' },
    { key: 'Columbia C-SSRS', label: 'Columbia C-SSRS', category: 'Ideacion y Conducta Suicida' },
    { key: 'Plutchik', label: 'Plutchik (Riesgo Suicida)', category: 'Ideacion y Conducta Suicida' },
    { key: 'CDFR', label: 'CDFR (Factores de Riesgo)', category: 'Ideacion y Conducta Suicida' },
    { key: 'ASSIST', label: 'ASSIST (Sustancias)', category: 'Conductas de Riesgo' },
    { key: 'CHTE', label: 'CHTE (Habitos de Estudio)', category: 'Psicopedagogicas' },
];

const ACTIVE_CATEGORY_ORDER: TestCategory[] = [
    'Depresion',
    'Ansiedad',
    'Desesperanza y Pensamientos',
    'Ideacion y Conducta Suicida',
    'Conductas de Riesgo',
    'Psicopedagogicas',
];

const normalizeText = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

const canonicalizeTestType = (raw: string): string => {
    const text = normalizeText(String(raw || ''));
    if (text.includes('PHQ-9')) return 'PHQ-9';
    if (text.includes('GAD-7')) return 'GAD-7';
    if (text.includes('BDI')) return 'BDI-II';
    if (text.includes('BAI')) return 'BAI';
    if (text.includes('HADS')) return 'HADS';
    if (text.includes('IDARE') || text.includes('STAI')) return 'IDARE/STAI';
    if (text.includes('BHS')) return 'BHS';
    if (text.includes('SSI')) return 'SSI';
    if (text.includes('COLUMBIA')) return 'Columbia C-SSRS';
    if (text.includes('PLUTCHIK')) return 'Plutchik';
    if (text.includes('IPA')) return 'IPA';
    if (text.includes('CDFR')) return 'CDFR';
    if (text.includes('ASSIST')) return 'ASSIST';
    if (text.includes('CHTE')) return 'CHTE';
    return String(raw || 'Desconocida');
};

const isPsychopedagogicalTest = (canonicalType: string): boolean => {
    const psycho = ['CHTE'];
    return psycho.includes(canonicalType);
};

const hasDomainInText = (text: string): boolean => {
    const normalized = normalizeText(text);
    return ['DEPRES', 'ANSIED', 'SUICID', 'DESESPER', 'SUSTAN', 'HABIT'].some((token) => normalized.includes(token));
};

const getDomainPrefix = (canonicalType: string): string => {
    const dep = ['PHQ-9', 'BDI-II'];
    const anx = ['GAD-7', 'BAI', 'HADS', 'IDARE/STAI'];
    const despair = ['BHS', 'IPA'];
    const suicide = ['SSI', 'Columbia C-SSRS', 'Plutchik', 'CDFR'];
    const risk = ['ASSIST'];
    const psycho = ['CHTE'];

    if (dep.includes(canonicalType)) return 'Depresion';
    if (anx.includes(canonicalType)) return 'Ansiedad';
    if (despair.includes(canonicalType)) return 'Desesperanza';
    if (suicide.includes(canonicalType)) return 'Riesgo suicida';
    if (risk.includes(canonicalType)) return 'Consumo de sustancias';
    if (psycho.includes(canonicalType)) return 'Habitos de estudio';
    return '';
};

const formatInterpretation = (canonicalType: string, interpretation: string): string => {
    const raw = String(interpretation || '').trim();
    if (!raw) return '';
    if (hasDomainInText(raw)) return raw;

    const prefix = getDomainPrefix(canonicalType);
    if (!prefix) return raw;

    const normalizedValue = raw.charAt(0).toLowerCase() + raw.slice(1);
    return `${prefix} ${normalizedValue}`;
};

function mergeByCanonicalLatest(results: TestResult[]): TestResult[] {
    const byType = new Map<string, TestResult & { _timestamp: number }>();

    results.forEach((item) => {
        const canonicalType = canonicalizeTestType(item.canonicalType || item.testType);
        const parsedTime = Date.parse(item.date || '');
        const timestamp = Number.isNaN(parsedTime) ? 0 : parsedTime;
        const current = byType.get(canonicalType);
        const normalized: TestResult & { _timestamp: number } = {
            ...item,
            canonicalType,
            _timestamp: timestamp,
        };

        if (!current || normalized._timestamp >= current._timestamp) {
            byType.set(canonicalType, normalized);
        }
    });

    return Array.from(byType.values())
        .sort((a, b) => b._timestamp - a._timestamp)
        .map(({ _timestamp, ...rest }) => rest);
}

export default function ClinicalAssessmentForm({ initialData, studentId, expediente }: ClinicalAssessmentFormProps) {
    const [user, authLoading] = useAuthState(auth);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Cargar resultados de pruebas desde Firestore
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const expedienteEvaluations = useMemo(() => {
        const source = Array.isArray(expediente?.evaluaciones) ? expediente!.evaluaciones : [];
        return source.map((ev, index) => {
            const parsedDate = new Date(ev.fecha || expediente?.fechaActualizacion || 0);
            return {
                id: ev.id || `exp-eval-${index}`,
                testType: ev.tipo || 'Desconocida',
                canonicalType: canonicalizeTestType(ev.tipo || ''),
                score: Number(ev.score || 0),
                interpretation: String(ev.observaciones || ''),
                date: Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleDateString('es-MX'),
                alerts: [],
            } as TestResult;
        });
    }, [expediente]);

    useEffect(() => {
        async function loadTestResults() {
            if (!studentId || authLoading) return;

            const localResults = getTestResults<any>()
                .filter((item) => item.studentId === studentId)
                .map((item) => {
                    const sortDate = new Date(item.submittedAt || item.date || 0);
                    return {
                        id: item.id || `local-${Math.random().toString(36).slice(2, 8)}`,
                        testType: item.testType || item.type || 'Desconocida',
                        canonicalType: canonicalizeTestType(item.testType || item.type || 'Desconocida'),
                        score: Number(item.score || item.totalScore || item.totalRisk || item.totalRiesgo || 0),
                        interpretation: item.interpretation || item.interpretacion || item.level || item.riskLevel || '',
                        date: Number.isNaN(sortDate.getTime()) ? '' : sortDate.toLocaleDateString('es-MX'),
                        alerts: Array.isArray(item.alerts) ? item.alerts : [],
                        _sortDate: sortDate,
                    };
                })
                .sort((a, b) => b._sortDate.getTime() - a._sortDate.getTime())
                .map(({ _sortDate, ...rest }) => rest);

            const mergedLocalAndExpediente = mergeByCanonicalLatest([...localResults, ...expedienteEvaluations]);

            if (mergedLocalAndExpediente.length > 0) {
                setTestResults(mergedLocalAndExpediente);
                setLoadError(null);
                setLoadingResults(false);
                return;
            }

            if (!db || !user) {
                setTestResults([]);
                setLoadError(null);
                setLoadingResults(false);
                return;
            }

            setLoadingResults(true);
            setLoadError(null);

            try {
                // Evita depender de índice compuesto (where + orderBy en campos distintos)
                // y ordena en memoria por fecha de envío.
                const q = query(
                    collection(db, 'test_results'),
                    where('studentId', '==', studentId)
                );
                const snapshot = await getDocs(q);
                type SortableResult = TestResult & { _sortDate: Date };
                const rawResults: SortableResult[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const sortDate = data.submittedAt?.toDate?.() || data.date?.toDate?.() || new Date(0);
                    rawResults.push({
                        id: doc.id,
                        testType: data.testType || data.type || 'Desconocida',
                        canonicalType: canonicalizeTestType(data.testType || data.type || 'Desconocida'),
                        score: data.score || data.totalScore || data.totalRisk || data.totalRiesgo || 0,
                        interpretation: data.interpretation || data.interpretacion || data.level || data.riskLevel || '',
                        date: sortDate.toLocaleDateString('es-MX'),
                        alerts: data.alerts || [],
                        _sortDate: sortDate,
                    });
                });

                rawResults.sort((a, b) => b._sortDate.getTime() - a._sortDate.getTime());

                const remoteResults = rawResults.map(({ _sortDate, ...rest }) => rest);
                setTestResults(mergeByCanonicalLatest([...remoteResults, ...expedienteEvaluations]));
            } catch (err) {
                console.error('Error cargando resultados de pruebas:', err);
                const errorMessage = (err as any)?.message || '';
                if (errorMessage.includes('Missing or insufficient permissions') || errorMessage.includes('PERMISSION_DENIED')) {
                    setLoadError(null);
                } else {
                    setLoadError(null);
                }
                setTestResults(mergeByCanonicalLatest([...expedienteEvaluations]));
            }

            setLoadingResults(false);
        }

        loadTestResults();
    }, [authLoading, expedienteEvaluations, studentId, user]);

    const screeningEmocionalResults = useMemo(() => {
        return testResults.filter((result) => !isPsychopedagogicalTest(result.canonicalType || result.testType));
    }, [testResults]);

    const resultsByCanonicalType = useMemo(() => {
        const map = new Map<string, TestResult>();
        testResults.forEach((result) => {
            const key = result.canonicalType || canonicalizeTestType(result.testType);
            if (!map.has(key)) {
                map.set(key, result);
            }
        });
        return map;
    }, [testResults]);

    const activeSections = useMemo(() => {
        return ACTIVE_CATEGORY_ORDER.map((category) => {
            const items = ACTIVE_TESTS_CATALOG
                .filter((test) => test.category === category)
                .map((test) => {
                    const result = resultsByCanonicalType.get(test.key);
                    return {
                        ...test,
                        hasResult: !!result,
                        score: result?.score,
                        interpretation: result?.interpretation || '',
                    };
                });

            return {
                category,
                items,
            };
        }).filter((section) => section.items.length > 0);
    }, [resultsByCanonicalType]);

    const findScore = (candidates: string[]): number | undefined => {
        for (const candidate of candidates) {
            const found = screeningEmocionalResults.find((item) => (item.canonicalType || item.testType) === candidate);
            if (found) return found.score;
        }
        return undefined;
    };

    const bdiDefault = initialData?.bdi_ii_score ?? findScore(['BDI-II', 'PHQ-9']);
    const baiDefault = initialData?.bai_score ?? findScore(['BAI', 'GAD-7', 'IDARE/STAI']);
    const beckSuicideDefault = initialData?.riesgo_suicida_beck_score ?? findScore(['BHS', 'SSI', 'Columbia C-SSRS', 'Plutchik']);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setSaveStatus('idle');
        
        try {
            const formData = new FormData(event.currentTarget);
            const effectiveStudentId = studentId || 'S001';
            const data: Omit<ClinicalAssessment, 'fecha_evaluacion'> = {
                studentId: effectiveStudentId,
                bdi_ii_score: Number(formData.get('bdi_score')),
                bai_score: Number(formData.get('bai_score')),
                riesgo_suicida_beck_score: Number(formData.get('beck_suicide_score')),
                neuro_mt_score: Number(formData.get('mt_index')),
                neuro_as_score: Number(formData.get('as_index')),
                neuro_vp_score: Number(formData.get('vp_index')),
                contexto_carga_cognitiva: formData.get('cognitive_load_context') as string,
                assist_result: formData.get('assist_result') as string,
                conducta_autolesiva_score: Number(formData.get('self_harm_score')),
                impresion_diagnostica: formData.get('diagnostic_impression') as string,
            };

            const finalData = { ...data, fecha_evaluacion: new Date().toISOString() };

            saveClinicalAssessment(finalData as any);
            setSaveStatus('success');
            console.log('Perfil Clínico y Evaluación guardado correctamente:', finalData);
        } catch (err) {
            console.error('Error al guardar Perfil Clínico:', err);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* ─── RESULTADOS DE PRUEBAS APLICADAS ─────────────────────── */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Resultados de Pruebas Aplicadas
                    </CardTitle>
                    <CardDescription>
                        Pruebas psicométricas respondidas por el estudiante a través del Banco de Pruebas.
                        Los resultados se integran automáticamente al expediente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingResults && (
                        <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando resultados de pruebas...
                        </div>
                    )}

                    {!loadingResults && testResults.length === 0 && (
                        <div className="text-center py-8">
                            <Clock className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">No hay resultados de pruebas registrados</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Cuando se apliquen pruebas desde el Banco de Pruebas, los resultados aparecerán aquí automáticamente.
                            </p>
                        </div>
                    )}

                    {loadError && (
                        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {loadError}
                        </div>
                    )}

                    {!loadingResults && testResults.length > 0 && (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-blue-100 text-blue-700">
                                    {testResults.length} prueba{testResults.length !== 1 ? 's' : ''} registrada{testResults.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                {testResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                                result.alerts && result.alerts.length > 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : result.score >= 15
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-green-100 text-green-700'
                                            }`}>
                                                {result.score}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {testLabels[result.canonicalType || result.testType] || result.testType}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Aplicada: {result.date}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {result.interpretation && (
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        result.interpretation.toLowerCase().includes('severo') ||
                                                        result.interpretation.toLowerCase().includes('alto')
                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                            : result.interpretation.toLowerCase().includes('moderado') ||
                                                                result.interpretation.toLowerCase().includes('medio')
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-green-50 text-green-700 border-green-200'
                                                    }
                                                >
                                                    {formatInterpretation(result.canonicalType || canonicalizeTestType(result.testType), result.interpretation)}
                                                </Badge>
                                            )}
                                            {result.alerts && result.alerts.map((alert, i) => (
                                                <Badge key={i} variant="destructive" className="text-[10px] px-1.5">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    {alert}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ─── EVALUACIÓN CLÍNICA MANUAL ───────────────────────────── */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Módulo 2.1: Evaluación Clínica</CardTitle>
                    <CardDescription>
                        Registro manual de puntajes de screening, tamizaje neuropsicológico e impresión diagnóstica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">I. Screening Emocional</h3>
                            <p className="text-sm text-gray-500 mb-4">Catalogo de pruebas activas y puntajes con su interpretacion diagnostica.</p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {activeSections.map((section) => (
                                    <div key={`active-${section.category}`} className="rounded-lg border bg-white p-4">
                                        <p className="text-sm font-semibold text-slate-800 mb-3">{section.category}</p>
                                        <div className="space-y-2">
                                            {section.items.map((item) => (
                                                <div key={`active-test-${section.category}-${item.key}`} className="rounded border px-3 py-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                                        {item.hasResult ? (
                                                            <Badge className="bg-emerald-100 text-emerald-700">Con resultado</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Sin resultado</Badge>
                                                        )}
                                                    </div>
                                                    {item.hasResult ? (
                                                        <p className="text-xs text-slate-600 mt-1">
                                                            {item.score} puntos{item.interpretation ? `; ${formatInterpretation(item.key, item.interpretation)}` : ''}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 mt-1">Aun no aplicada/respondida.</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* SECCIÓN I: CAMPOS EDITABLES DE SCREENING */}
                        <div>
                            <p className="text-sm text-gray-500 mb-4">Campos editables de referencia para consolidacion clinica.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="bdi-score">Puntuación BDI-II (Depresión)</Label>
                                    <Input id="bdi-score" name="bdi_score" type="number" placeholder="Ej. 25" defaultValue={bdiDefault} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bai-score">Puntuación BAI (Ansiedad)</Label>
                                    <Input id="bai-score" name="bai_score" type="number" placeholder="Ej. 21" defaultValue={baiDefault} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="beck-suicide-score">Puntaje Ideación Suicida (Beck)</Label>
                                    <Input id="beck-suicide-score" name="beck_suicide_score" type="number" placeholder="Ej. 10" defaultValue={beckSuicideDefault} />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* SECCIÓN II: TAMIZAJE NEUROPSICOLÓGICO */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">II. Tamizaje Neuropsicológico (Funciones Ejecutivas)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="mt-index">Índice Memoria de Trabajo (MT)</Label>
                                    <Input id="mt-index" name="mt_index" type="number" placeholder="Ej. 85" defaultValue={initialData?.neuro_mt_score} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="as-index">Índice Atención Sostenida (AS)</Label>
                                    <Input id="as-index" name="as_index" type="number" placeholder="Ej. 90" defaultValue={initialData?.neuro_as_score} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vp-index">Índice Velocidad de Procesamiento (VP)</Label>
                                    <Input id="vp-index" name="vp_index" type="number" placeholder="Ej. 80" defaultValue={initialData?.neuro_vp_score} />
                                </div>
                            </div>
                             <div className="mt-6 space-y-2">
                                <Label htmlFor="cognitive-load-context">Contexto de Carga Cognitiva / Estrés</Label>
                                <Textarea id="cognitive-load-context" name="cognitive_load_context" placeholder="Describir situación actual que impacta el desempeño (ej. 'Exámenes finales', 'Conflicto familiar')." defaultValue={initialData?.contexto_carga_cognitiva} />
                            </div>
                        </div>
                        
                        <Separator />

                        {/* SECCIÓN III: CONDUCTAS DE RIESGO */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">III. Conductas de Riesgo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <Label htmlFor="assist-result">Resultado ASSIST (Consumo de Sustancias)</Label>
                                    <Input id="assist-result" name="assist_result" placeholder="Positivo / Negativo" defaultValue={initialData?.assist_result} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="self-harm-score">Puntaje Conductas Autolesivas (Frecuencia)</Label>
                                    <Input id="self-harm-score" name="self_harm_score" type="number" placeholder="Ej. 5" defaultValue={initialData?.conducta_autolesiva_score} />
                                </div>
                            </div>
                        </div>

                        <Separator />
                        
                        {/* SECCIÓN IV: IMPRESIÓN DIAGNÓSTICA */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">IV. Impresión Diagnóstica (Provisional)</h3>
                             <div className="space-y-2">
                                <Label htmlFor="diagnostic-impression">Hipótesis Clínica Basada en la Evidencia Recopilada</Label>
                                <Textarea id="diagnostic-impression" name="diagnostic_impression" placeholder="Ej. 'Sintomatología depresiva y ansiosa severa, posiblemente exacerbada por déficit en memoria de trabajo y estresores académicos. Riesgo suicida activo a monitorear.'" defaultValue={initialData?.impresion_diagnostica} />
                            </div>
                        </div>


                        <div className="flex justify-end items-center gap-3 pt-4">
                            {saveStatus === 'success' && (
                                <span className="text-sm text-green-600 font-medium">Guardado correctamente</span>
                            )}
                            {saveStatus === 'error' && (
                                <span className="text-sm text-red-600 font-medium">Error al guardar</span>
                            )}
                            <Button type="submit" disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white font-bold">
                                {saving ? 'Guardando...' : 'Actualizar Evaluación Clínica'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
