'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardList,
    Save,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Eye,
} from 'lucide-react';

import {
    getClinicalInterviewByStudentId,
    saveClinicalInterview,
    type ClinicalInterviewData,
} from '@/lib/storage-local';

// ─── PROPS ─────────────────────────────────────────────────────────────────

interface ClinicalInterviewFormProps {
    studentId: string;
    studentName?: string;
    semester?: string;
    grupo?: string;
    edad?: number;
    readOnly?: boolean;
}

// ─── DEFAULT STATE ─────────────────────────────────────────────────────────

function createDefaultData(studentId: string, overrides?: Partial<ClinicalInterviewData>): ClinicalInterviewData {
    return {
        id: `ent-${Date.now()}`,
        studentId,
        fecha: new Date().toISOString().split('T')[0],
        expediente: '',
        entrevistador: '',
        nombre: '',
        edad: '',
        semestre: '',
        motivoConsulta: '',
        historiaProblema: '',
        dinamiaFamiliar: '',
        promedio: '',
        matDif: '',
        habitos: '',
        animoScale: '',
        predominioEmocional: '',
        sintomas: [],
        ideaMuerte: 'Negada',
        planSuicida: 'Sin Plan',
        autolesiones: 'Niega',
        detalleRiesgo: '',
        usoTabaco: false,
        frecTabaco: '',
        usoAlcohol: false,
        frecAlcohol: '',
        usoMarihuana: false,
        frecMarihuana: '',
        usoOtras: false,
        frecOtras: '',
        otrosRiesgos: [],
        emApariencia: '',
        emHabla: '',
        emOrientacion: '',
        emPensamiento: '',
        emJuicio: '',
        metasVida: '',
        impDiagnostica: '',
        hipotesisDiag: '',
        riesgoGlobal: 'Bajo',
        planIntervencion: '',
        ...overrides,
    };
}

// ─── SINTOM OPTIONS ────────────────────────────────────────────────────────

const SINTOMAS_OPTIONS = [
    { id: 'sin1', label: 'Tristeza persistente' },
    { id: 'sin2', label: 'Llanto facil' },
    { id: 'sin3', label: 'Anhedonia (Perdida de interes)' },
    { id: 'sin4', label: 'Fatiga / Baja energia' },
    { id: 'sin5', label: 'Alteracion del sueno' },
    { id: 'sin6', label: 'Alteracion del apetito' },
    { id: 'sin7', label: 'Dificultad de Concentracion' },
    { id: 'sin8', label: 'Culpa / Inutilidad' },
    { id: 'sin9', label: 'Crisis de ansiedad' },
];

const OTROS_RIESGOS_OPTIONS = [
    { id: 'riesgoSexual', label: 'Conducta sexual de riesgo' },
    { id: 'riesgoViolencia', label: 'Violencia / Pandillerismo' },
    { id: 'riesgoRedes', label: 'Ciberadiccion' },
    { id: 'riesgoBullying', label: 'Acoso Escolar (Victima/Agresor)' },
    { id: 'riesgoAlim', label: 'Trastorno Alimentario' },
];

// ─── SECTION HEADER ────────────────────────────────────────────────────────

function SectionHeader({ title, alert }: { title: string; alert?: boolean }) {
    return (
        <div className={`py-2 px-4 rounded-md font-bold text-sm uppercase tracking-wide mt-6 mb-3 ${
            alert 
                ? 'bg-red-50 text-red-900 border border-red-200 border-l-4 border-l-red-500' 
                : 'bg-slate-50 text-slate-900 border border-slate-200 border-l-4 border-l-slate-700'
        }`}>
            {title}
        </div>
    );
}

// ─── FIELD WRAPPER ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

// ─── CHECKBOX GRID ITEM ────────────────────────────────────────────────────

function CheckItem({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <label className={`flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-slate-50 transition-colors ${disabled ? 'opacity-70 cursor-default' : ''}`}>
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 accent-slate-800"
            />
            <span>{label}</span>
        </label>
    );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

export default function ClinicalInterviewForm({
    studentId,
    studentName,
    semester,
    grupo,
    edad,
    readOnly = false,
}: ClinicalInterviewFormProps) {
    const [data, setData] = useState<ClinicalInterviewData>(createDefaultData(studentId));
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [hasExisting, setHasExisting] = useState(false);

    // Load existing data on mount
    useEffect(() => {
        const existing = getClinicalInterviewByStudentId(studentId);
        if (existing) {
            setData(existing);
            setHasExisting(true);
        } else {
            // Pre-fill with student info if available
            setData(createDefaultData(studentId, {
                nombre: studentName || '',
                edad: edad ? String(edad) : '',
                semestre: semester && grupo ? `${semester} - ${grupo}` : '',
            }));
        }
    }, [studentId, studentName, semester, grupo, edad]);

    // Update handler
    const update = useCallback((field: keyof ClinicalInterviewData, value: unknown) => {
        setData((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Toggle symptom
    const toggleSintoma = useCallback((sintoma: string) => {
        setData((prev) => ({
            ...prev,
            sintomas: prev.sintomas.includes(sintoma)
                ? prev.sintomas.filter((s) => s !== sintoma)
                : [...prev.sintomas, sintoma],
        }));
    }, []);

    // Toggle otro riesgo
    const toggleOtroRiesgo = useCallback((riesgo: string) => {
        setData((prev) => ({
            ...prev,
            otrosRiesgos: prev.otrosRiesgos.includes(riesgo)
                ? prev.otrosRiesgos.filter((r) => r !== riesgo)
                : [...prev.otrosRiesgos, riesgo],
        }));
    }, []);

    // Save
    const handleSave = useCallback(() => {
        setSaveStatus('saving');
        const toSave: ClinicalInterviewData = {
            ...data,
            studentId,
            fecha: data.fecha || new Date().toISOString().split('T')[0],
        };
        saveClinicalInterview(toSave);
        setHasExisting(true);
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    }, [data, studentId]);

    // Risk alert
    const showRiskAlert = data.ideaMuerte !== 'Negada' || data.planSuicida !== 'Sin Plan';

    const inputClass = readOnly ? 'bg-slate-50 cursor-default' : '';
    const textareaClass = readOnly ? 'bg-slate-50 cursor-default min-h-[80px]' : 'min-h-[80px]';

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-teal-600" />
                    Modulo 2.1: Entrevista Clinica Psicopedagogica Integral
                </CardTitle>
                <CardDescription>
                    Formato de entrevista clinica integral del CBTa 130. Los datos se integran automaticamente al plan de intervencion.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
                {/* Control */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border mb-4">
                    <Field label="Expediente">
                        <Input value={data.expediente} onChange={(e) => update('expediente', e.target.value)} placeholder="No. Expediente" className={`font-mono font-bold ${inputClass}`} readOnly={readOnly} />
                    </Field>
                    <Field label="Fecha">
                        <Input type="date" value={data.fecha} onChange={(e) => update('fecha', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <Field label="Entrevistador">
                        <Input value={data.entrevistador} onChange={(e) => update('entrevistador', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <div className="flex items-end">
                        {hasExisting && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Guardado previamente
                            </Badge>
                        )}
                    </div>
                </div>

                {/* A. Ficha de Identificacion */}
                <SectionHeader title="A. Ficha de Identificacion" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                        <Field label="Nombre del Estudiante">
                            <Input value={data.nombre} onChange={(e) => update('nombre', e.target.value)} placeholder="Nombre Completo" className={inputClass} readOnly={readOnly} />
                        </Field>
                    </div>
                    <Field label="Edad">
                        <Input type="number" value={data.edad} onChange={(e) => update('edad', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <Field label="Semestre y Grupo">
                        <Input value={data.semestre} onChange={(e) => update('semestre', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                </div>

                {/* B. Motivo de Consulta */}
                <SectionHeader title="B. Motivo de Consulta" />
                <Field label="Motivo manifiesto (Lo que dice el estudiante)">
                    <Textarea value={data.motivoConsulta} onChange={(e) => update('motivoConsulta', e.target.value)} placeholder="Describa el motivo..." className={textareaClass} readOnly={readOnly} />
                </Field>
                <div className="mt-3">
                    <Field label="Historia del Problema (Inicio, evolucion, factores desencadenantes)">
                        <Textarea value={data.historiaProblema} onChange={(e) => update('historiaProblema', e.target.value)} className="min-h-[100px]" readOnly={readOnly} />
                    </Field>
                </div>

                {/* C. Contexto Familiar */}
                <SectionHeader title="C. Contexto Familiar" />
                <Field label="Dinamica Familiar (Estructura, comunicacion, conflictos)">
                    <Textarea value={data.dinamiaFamiliar} onChange={(e) => update('dinamiaFamiliar', e.target.value)} className={textareaClass} readOnly={readOnly} />
                </Field>

                {/* D. Historia Academica */}
                <SectionHeader title="D. Historia Academica" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Promedio Actual">
                        <Input value={data.promedio} onChange={(e) => update('promedio', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <div className="sm:col-span-2">
                        <Field label="Materias con Dificultad">
                            <Input value={data.matDif} onChange={(e) => update('matDif', e.target.value)} className={inputClass} readOnly={readOnly} />
                        </Field>
                    </div>
                </div>
                <div className="mt-3">
                    <Field label="Habitos de Estudio y Actitud escolar">
                        <Textarea value={data.habitos} onChange={(e) => update('habitos', e.target.value)} className={textareaClass} readOnly={readOnly} />
                    </Field>
                </div>

                {/* E. Exploracion Emocional */}
                <SectionHeader title="E. Exploracion Emocional" />
                
                <div className="text-sm font-semibold text-teal-700 border-b border-teal-100 pb-1 mt-4 mb-3">
                    Estado Emocional Actual
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Escala de Animo (1-10)">
                        <Input type="number" min="1" max="10" value={data.animoScale} onChange={(e) => update('animoScale', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <Field label="Estado Predominante">
                        <select 
                            value={data.predominioEmocional} 
                            onChange={(e) => update('predominioEmocional', e.target.value)}
                            disabled={readOnly}
                            className="w-full px-3 py-2.5 border rounded-md text-sm bg-white disabled:bg-slate-50"
                        >
                            <option value="">-- Seleccione --</option>
                            <option value="Tristeza">Tristeza / Melancolia</option>
                            <option value="Ansiedad">Ansiedad / Nerviosismo</option>
                            <option value="Irritabilidad">Irritabilidad / Enojo</option>
                            <option value="Apatia">Apatia / Indiferencia</option>
                            <option value="Eutimico">Estable / Eutimico</option>
                            <option value="Labil">Labil / Cambiante</option>
                        </select>
                    </Field>
                </div>

                <div className="mt-4">
                    <Field label="Sintomatologia presente (Ultimas 2 semanas)">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 mt-1">
                            {SINTOMAS_OPTIONS.map((s) => (
                                <CheckItem
                                    key={s.id}
                                    label={s.label}
                                    checked={data.sintomas.includes(s.label)}
                                    onChange={() => toggleSintoma(s.label)}
                                    disabled={readOnly}
                                />
                            ))}
                        </div>
                    </Field>
                </div>

                {/* Protocolo de Riesgo */}
                <SectionHeader title="Protocolo de Riesgo" alert />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Ideacion Suicida">
                        <select 
                            value={data.ideaMuerte} onChange={(e) => update('ideaMuerte', e.target.value)}
                            disabled={readOnly}
                            className="w-full px-3 py-2.5 border rounded-md text-sm bg-white disabled:bg-slate-50"
                        >
                            <option value="Negada">Negada</option>
                            <option value="Pasiva">Pasiva (Deseo de muerte)</option>
                            <option value="Activa">Activa (Pensamientos)</option>
                        </select>
                    </Field>
                    <Field label="Planificacion">
                        <select 
                            value={data.planSuicida} onChange={(e) => update('planSuicida', e.target.value)}
                            disabled={readOnly}
                            className="w-full px-3 py-2.5 border rounded-md text-sm bg-white disabled:bg-slate-50"
                        >
                            <option value="Sin Plan">Sin Plan</option>
                            <option value="Vago">Plan Inespecifico</option>
                            <option value="Estructurado">Plan Estructurado</option>
                        </select>
                    </Field>
                    <Field label="Autolesiones">
                        <select 
                            value={data.autolesiones} onChange={(e) => update('autolesiones', e.target.value)}
                            disabled={readOnly}
                            className="w-full px-3 py-2.5 border rounded-md text-sm bg-white disabled:bg-slate-50"
                        >
                            <option value="Niega">Niega</option>
                            <option value="Historico">En el pasado</option>
                            <option value="Reciente">Reciente / Actual</option>
                        </select>
                    </Field>
                </div>

                {showRiskAlert && (
                    <Alert variant="destructive" className="mt-3 animate-pulse">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>ALERTA CLINICA ACTIVADA</AlertTitle>
                        <AlertDescription>
                            Evaluar necesidad de referencia psiquiatrica urgente. Ideacion suicida: {data.ideaMuerte} | Plan: {data.planSuicida}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="mt-3">
                    <Field label="Detalles del Riesgo y Factores Protectores">
                        <Textarea value={data.detalleRiesgo} onChange={(e) => update('detalleRiesgo', e.target.value)} placeholder="Describir frecuencia, metodo, intencion y redes de apoyo..." className="border-red-200" readOnly={readOnly} />
                    </Field>
                </div>

                {/* F. Conductas de Riesgo */}
                <SectionHeader title="F. Conductas de Riesgo" />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="text-left p-2 border-b-2 border-slate-200 font-semibold text-slate-500">Sustancia</th>
                                <th className="w-16 p-2 border-b-2 border-slate-200 text-center">Uso</th>
                                <th className="text-left p-2 border-b-2 border-slate-200 font-semibold text-slate-500">Frecuencia y Patron de Consumo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: 'Tabaco / Vape', usoKey: 'usoTabaco' as const, frecKey: 'frecTabaco' as const },
                                { label: 'Alcohol', usoKey: 'usoAlcohol' as const, frecKey: 'frecAlcohol' as const },
                                { label: 'Marihuana', usoKey: 'usoMarihuana' as const, frecKey: 'frecMarihuana' as const },
                                { label: 'Otras drogas', usoKey: 'usoOtras' as const, frecKey: 'frecOtras' as const },
                            ].map((row) => (
                                <tr key={row.label} className="border-b border-slate-100">
                                    <td className="p-2">{row.label}</td>
                                    <td className="p-2 text-center">
                                        <input type="checkbox" checked={data[row.usoKey]} onChange={(e) => update(row.usoKey, e.target.checked)} disabled={readOnly} className="w-4 h-4 accent-teal-700" />
                                    </td>
                                    <td className="p-2">
                                        <Input value={data[row.frecKey]} onChange={(e) => update(row.frecKey, e.target.value)} placeholder="..." className={inputClass} readOnly={readOnly} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4">
                    <Field label="Otros Indicadores de Riesgo">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 mt-1">
                            {OTROS_RIESGOS_OPTIONS.map((r) => (
                                <CheckItem
                                    key={r.id}
                                    label={r.label}
                                    checked={data.otrosRiesgos.includes(r.label)}
                                    onChange={() => toggleOtroRiesgo(r.label)}
                                    disabled={readOnly}
                                />
                            ))}
                        </div>
                    </Field>
                </div>

                {/* G. Examen Mental */}
                <SectionHeader title="G. Examen Mental" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Apariencia / Alieno">
                        <Input value={data.emApariencia} onChange={(e) => update('emApariencia', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <Field label="Lenguaje / Discurso">
                        <Input value={data.emHabla} onChange={(e) => update('emHabla', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <Field label="Orientacion (T/E/P)">
                        <Input value={data.emOrientacion} onChange={(e) => update('emOrientacion', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <Field label="Curso del Pensamiento">
                        <Input value={data.emPensamiento} onChange={(e) => update('emPensamiento', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                    <Field label="Juicio / Insight">
                        <Input value={data.emJuicio} onChange={(e) => update('emJuicio', e.target.value)} className={inputClass} readOnly={readOnly} />
                    </Field>
                </div>

                {/* H. Proyecto de Vida */}
                <SectionHeader title="H. Proyecto de Vida" />
                <Field label="Intereses y Metas a Futuro">
                    <Textarea value={data.metasVida} onChange={(e) => update('metasVida', e.target.value)} className="min-h-[60px]" readOnly={readOnly} />
                </Field>

                {/* I. Formulacion Clinica */}
                <SectionHeader title="I. Formulacion Clinica" />
                <Field label="Impresion Diagnostica (Sintesis del caso)">
                    <Textarea value={data.impDiagnostica} onChange={(e) => update('impDiagnostica', e.target.value)} className="bg-blue-50 border-blue-200 min-h-[100px]" readOnly={readOnly} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <Field label="Hipotesis Diagnostica (CIE-11 / DSM-5)">
                        <Input value={data.hipotesisDiag} onChange={(e) => update('hipotesisDiag', e.target.value)} className={`font-semibold ${inputClass}`} readOnly={readOnly} />
                    </Field>
                    <Field label="Nivel de Riesgo Global">
                        <select 
                            value={data.riesgoGlobal} onChange={(e) => update('riesgoGlobal', e.target.value)}
                            disabled={readOnly}
                            className="w-full px-3 py-2.5 border rounded-md text-sm font-bold bg-white disabled:bg-slate-50"
                        >
                            <option value="Bajo">Bajo</option>
                            <option value="Moderado">Moderado</option>
                            <option value="Alto">Alto</option>
                            <option value="Inminente">Inminente</option>
                        </select>
                    </Field>
                </div>

                <div className="mt-3">
                    <Field label="Plan de Intervencion y Acuerdos">
                        <Textarea value={data.planIntervencion} onChange={(e) => update('planIntervencion', e.target.value)} placeholder="Acciones a seguir, citatorios, canalizacion..." className="min-h-[80px]" readOnly={readOnly} />
                    </Field>
                </div>

                {/* Save Button */}
                {!readOnly && (
                    <div className="flex justify-end mt-6 pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                            className={`min-w-[180px] ${
                                saveStatus === 'saved'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-slate-800 hover:bg-slate-900'
                            } text-white`}
                        >
                            {saveStatus === 'saving' ? (
                                <>Guardando...</>
                            ) : saveStatus === 'saved' ? (
                                <><CheckCircle2 className="mr-2 h-4 w-4" /> Guardado Correctamente</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Guardar Entrevista</>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
