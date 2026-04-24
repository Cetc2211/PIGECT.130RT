'use client';

import { getClinicalAssessmentByStudentId, getFunctionalAnalysisByStudentId, getProgressTrackingByStudentId, getEducationalAssessmentByStudentId } from '@/lib/store';
import type { ClinicalAssessment, FunctionalAnalysis, ProgressData, EducationalAssessment } from '@/lib/store';
import { getTestResults } from '@/lib/storage-local';
import { getExpedienteById } from '@/lib/expediente-service';
import type { Expediente } from '@/lib/expediente-service';

// ─── SCORE INTERPRETATION HELPERS ──────────────────────────────────────────

export function interpretBDIII(score: number): string {
    if (score <= 13) return 'Mínima';
    if (score <= 19) return 'Leve';
    if (score <= 28) return 'Moderada';
    return 'Severa';
}

export function interpretBAI(score: number): string {
    if (score <= 7) return 'Mínima';
    if (score <= 15) return 'Leve';
    if (score <= 25) return 'Moderada';
    return 'Severa';
}

export function interpretPHQ9(score: number): string {
    if (score <= 4) return 'Mínima';
    if (score <= 9) return 'Leve';
    if (score <= 14) return 'Moderada';
    if (score <= 19) return 'Moderadamente Severa';
    return 'Severa';
}

export function interpretGAD7(score: number): string {
    if (score <= 4) return 'Mínima';
    if (score <= 9) return 'Leve';
    if (score <= 14) return 'Moderada';
    return 'Severa';
}

export function interpretBHS(score: number): string {
    if (score <= 3) return 'Mínima';
    if (score <= 9) return 'Leve';
    if (score <= 14) return 'Moderada';
    return 'Severa';
}

// Generic interpretation for unknown test types
function interpretGeneric(testType: string, score: number): string {
    const type = testType.toLowerCase();
    if (type.includes('bdi') || type.includes('depresi')) return interpretBDIII(score);
    if (type.includes('bai') || type.includes('ansiedad')) return interpretBAI(score);
    if (type.includes('phq-9') || type.includes('phq9')) return interpretPHQ9(score);
    if (type.includes('gad-7') || type.includes('gad7')) return interpretGAD7(score);
    if (type.includes('bhs') || type.includes('esperanza')) return interpretBHS(score);
    return `${score} puntos`;
}

// ─── DATA AVAILABILITY REPORT ──────────────────────────────────────────────

export interface DataAvailability {
    hasClinicalAssessment: boolean;
    hasFunctionalAnalysis: boolean;
    hasExpediente: boolean;
    testResultCount: number;
    hasProgressTracking: boolean;
    progressRecordCount: number;
    hasEducationalAssessment: boolean;
    hasReferenceDocuments: boolean;
    referenceDocumentCount: number;
    clinicalNotesCount: number;
    evaluacionesCount: number;
}

export function checkDataAvailability(studentId: string, referenceDocCount?: number): DataAvailability {
    const clinical = getClinicalAssessmentByStudentId(studentId);
    const functional = getFunctionalAnalysisByStudentId(studentId);
    const expediente = getExpedienteById(studentId);
    const allTestResults = getTestResults<any>();
    const studentTests = allTestResults.filter((t: any) => t.studentId === studentId);
    const progress = getProgressTrackingByStudentId(studentId);
    const educational = getEducationalAssessmentByStudentId(studentId);

    return {
        hasClinicalAssessment: !!clinical,
        hasFunctionalAnalysis: !!functional,
        hasExpediente: !!expediente,
        testResultCount: studentTests.length + (expediente?.evaluaciones?.length || 0),
        hasProgressTracking: progress.length > 0,
        progressRecordCount: progress.length,
        hasEducationalAssessment: !!educational,
        hasReferenceDocuments: (referenceDocCount ?? 0) > 0,
        referenceDocumentCount: referenceDocCount ?? 0,
        clinicalNotesCount: expediente?.notas?.length || 0,
        evaluacionesCount: expediente?.evaluaciones?.length || 0,
    };
}

// ─── MAIN ASSEMBLER ───────────────────────────────────────────────────────

export function assembleClinicalContext(studentId: string, studentName: string): string {
    const lines: string[] = [];

    // === 1. IDENTIFICACIÓN DEL ESTUDIANTE ===
    lines.push('=== IDENTIFICACIÓN DEL ESTUDIANTE ===');
    lines.push(`Nombre: ${studentName}`);
    lines.push(`ID: ${studentId}`);

    const expediente = getExpedienteById(studentId);
    if (expediente) {
        lines.push(`Grupo: ${expediente.groupName}`);
        lines.push(`Semestre: ${expediente.semester}`);
        lines.push(`Nivel MTSS: ${expediente.nivel.replace('_', ' ').toUpperCase()}`);
        lines.push(`Estado del Expediente: ${expediente.estado}`);
        lines.push(`Riesgo Suicida: ${expediente.suicideRiskLevel || 'No evaluado'}`);
        lines.push(`IRC (Índice de Riesgo Compuesto): ${expediente.irc ?? 'No calculado'}/100`);
        lines.push(`Nivel de Riesgo Académico: ${expediente.nivelRiesgo || 'No asignado'}`);
        lines.push(`Rendimiento Académico (GPA): ${expediente.academicData.gpa}`);
        lines.push(`Ausentismo: ${expediente.academicData.absences}%`);
    } else {
        lines.push('Grupo: No disponible');
        lines.push('Semestre: No disponible');
        lines.push('Nivel MTSS: No asignado');
        lines.push('Estado del Expediente: No disponible');
        lines.push('Riesgo Suicida: No evaluado');
        lines.push('IRC (Índice de Riesgo Compuesto): No calculado');
        lines.push('Nivel de Riesgo Académico: No asignado');
        lines.push('Rendimiento Académico (GPA): No disponible');
        lines.push('Ausentismo: No disponible');
    }
    lines.push('');

    // === 2. EVALUACIÓN CLÍNICA (Evaluación de Entrada) ===
    lines.push('=== EVALUACIÓN CLÍNICA (Evaluación de Entrada) ===');
    const clinical = getClinicalAssessmentByStudentId(studentId);
    if (clinical) {
        lines.push(`Fecha: ${clinical.fecha_evaluacion}`);
        lines.push(`BDI-II (Inventario de Depresión de Beck): ${clinical.bdi_ii_score} - ${interpretBDIII(clinical.bdi_ii_score)}`);
        lines.push(`BAI (Inventario de Ansiedad de Beck): ${clinical.bai_score} - ${interpretBAI(clinical.bai_score)}`);
        lines.push(`Riesgo Suicida (Beck): ${clinical.riesgo_suicida_beck_score} - ${clinical.riesgo_suicida_beck_score <= 3 ? 'Bajo' : clinical.riesgo_suicida_beck_score <= 9 ? 'Moderado' : clinical.riesgo_suicida_beck_score <= 14 ? 'Alto' : 'Muy Alto'}`);
        lines.push('Funciones Neuropsicológicas:');
        lines.push(`  - Memoria de Trabajo: ${clinical.neuro_mt_score}`);
        lines.push(`  - Atención Sostenida: ${clinical.neuro_as_score}`);
        lines.push(`  - Velocidad de Procesamiento: ${clinical.neuro_vp_score}`);
        lines.push(`Contexto de Carga Cognitiva: ${clinical.contexto_carga_cognitiva || 'No registrado'}`);
        lines.push(`ASSIST (Consumo de Sustancias): ${clinical.assist_result || 'No aplicado'}`);
        lines.push(`Conducta Autolesiva: ${clinical.conducta_autolesiva_score}`);
        lines.push(`Impresión Diagnóstica: ${clinical.impresion_diagnostica || 'No registrada'}`);
    } else {
        lines.push('No disponible - No se ha registrado evaluación clínica de entrada.');
    }
    lines.push('');

    // === 3. ANÁLISIS FUNCIONAL DE LA CONDUCTA ===
    lines.push('=== ANÁLISIS FUNCIONAL DE LA CONDUCTA (Formulación Cognitiva) ===');
    const functional = getFunctionalAnalysisByStudentId(studentId);
    if (functional) {
        lines.push(`Sesión #: ${functional.session_number}`);
        lines.push(`Fecha: ${functional.fecha_sesion}`);
        lines.push(`Antecedente Principal (A): ${functional.analisis_funcional.antecedente_principal}`);
        lines.push(`Conducta Problema (B): ${functional.analisis_funcional.conducta_problema}`);
        lines.push(`Función de Mantenimiento (C): ${functional.analisis_funcional.funcion_mantenimiento}`);
        lines.push(`Creencia/Esquema Cognitivo Subyacente: ${functional.analisis_funcional.creencia_esquema}`);
    } else {
        lines.push('No disponible - No se ha completado el análisis funcional de la conducta.');
    }
    lines.push('');

    // === 4. RESULTADOS DE INSTRUMENTOS DE EVALUACIÓN ===
    lines.push('=== RESULTADOS DE INSTRUMENTOS DE EVALUACIÓN ===');

    // From expediente.evaluaciones
    const evalEntries: { tipo: string; score: number; fecha: string; aplicadaPor: string; observaciones?: string }[] = [];
    if (expediente?.evaluaciones) {
        expediente.evaluaciones.forEach((ev) => {
            evalEntries.push(ev);
        });
    }

    // From localStorage test results
    try {
        const allTestResults = getTestResults<any>();
        allTestResults
            .filter((t: any) => t.studentId === studentId)
            .forEach((t: any) => {
                // Avoid duplicates with expediente evaluaciones
                const isDuplicate = evalEntries.some(
                    (e) => e.tipo === t.testType && e.fecha === (t.submittedAt || t.date) && e.score === t.score
                );
                if (!isDuplicate) {
                    evalEntries.push({
                        tipo: t.testType || t.test || 'Desconocido',
                        score: t.score ?? t.totalScore ?? 0,
                        fecha: t.submittedAt || t.date || '',
                        aplicadaPor: t.aplicadaPor || 'Registro local',
                        observaciones: t.interpretation || t.level || t.observaciones || '',
                    });
                }
            });
    } catch {
        // localStorage not available
    }

    if (evalEntries.length > 0) {
        evalEntries.forEach((ev) => {
            const interp = interpretGeneric(ev.tipo, ev.score);
            lines.push(`- ${ev.tipo}: Puntuación ${ev.score} - ${interp} - ${ev.fecha || 'Sin fecha'} (Aplicado por: ${ev.aplicadaPor})`);
            if (ev.observaciones) {
                lines.push(`  Observaciones: ${ev.observaciones}`);
            }
        });
    } else {
        lines.push('No se han registrado resultados de instrumentos de evaluación adicionales.');
    }
    lines.push('');

    // === 5. SEGUIMIENTO DE PROGRESO ===
    lines.push('=== SEGUIMIENTO DE PROGRESO ===');
    const progress = getProgressTrackingByStudentId(studentId);
    if (progress.length > 0) {
        progress.forEach((p: ProgressData) => {
            lines.push(`- Semana ${p.week}: SUDS=${p.suds}, Ideación Suicida=${p.suicidalIdeation}, Logro de Tareas=${p.taskAchievement}`);
        });
    } else {
        lines.push('No hay registros de seguimiento de progreso.');
    }
    lines.push('');

    // === 6. NOTAS CLÍNICAS / EVOLUCIÓN ===
    lines.push('=== NOTAS CLÍNICAS / EVOLUCIÓN ===');
    if (expediente?.notas && expediente.notas.length > 0) {
        expediente.notas.forEach((nota) => {
            lines.push(`- [${nota.fecha}] (${nota.tipo}) Autor: ${nota.autor}`);
            lines.push(`  ${nota.contenido}`);
        });
    } else {
        lines.push('No hay notas clínicas registradas en el expediente.');
    }
    lines.push('');

    // === 7. EVALUACIÓN EDUCATIVA ===
    lines.push('=== EVALUACIÓN EDUCATIVA ===');
    const educational = getEducationalAssessmentByStudentId(studentId);
    if (educational) {
        lines.push(`Fecha: ${educational.fecha_evaluacion}`);
        lines.push(`Puntuación Total CHTE: ${educational.totalScore} - Interpretación: ${educational.interpretation}`);
        lines.push('Desglose CHTE:');
        lines.push(`  - Lugar: ${educational.chteScores.lugar}`);
        lines.push(`  - Planificación: ${educational.chteScores.planificacion}`);
        lines.push(`  - Atención: ${educational.chteScores.atencion}`);
        lines.push(`  - Método: ${educational.chteScores.metodo}`);
        lines.push(`  - Actitud: ${educational.chteScores.actitud}`);
        lines.push('Tamizaje Neuropsicológico:');
        lines.push(`  - Atención (percentil): ${educational.neuropsychScreening.atencionPercentil}`);
        lines.push(`  - Memoria de Trabajo (percentil): ${educational.neuropsychScreening.memoriaTrabajoPercentil}`);
        lines.push(`  - Control Inhibitorio (percentil): ${educational.neuropsychScreening.controlInhibitorioPercentil}`);
    } else {
        lines.push('No disponible - No se ha completado la evaluación educativa.');
    }

    return lines.join('\n');
}
