/**
 * Define los coeficientes ponderados (Betas) para las variables predictoras (Xi).
 * NOTA: Estos coeficientes son simulados y deben ajustarse con la investigación real del Cap. 5.1.1.
 */
import type { PartialData } from './placeholder-data';

interface RiskCoefficients {
    B0_intercepto: number;
    B1_ausentismo: number;
    B2_bajo_rendimiento: number;
    B3_ansiedad_clinica: number;
}

const DEFAULT_COEFFICIENTS: RiskCoefficients = {
    B0_intercepto: -3.0, // Base line (ajuste)
    B1_ausentismo: 1.5, // Fuerte predictor (más peso)
    B2_bajo_rendimiento: 1.0, // Predictor moderado
    B3_ansiedad_clinica: 0.8, // Predictor clínico
};

/**
 * Define los datos necesarios para el cálculo de riesgo.
 * La Ansiedad (X3) se asume normalizada de 0 a 1 (0 = baja, 1 = alta).
 */
interface RiskData {
    // Academic Tracker Inputs
    ausentismo_norm: number; // X1: Porcentaje de faltas (0 a 1.0)
    bajo_rendimiento_bin: 0 | 1; // X2: 1 si GPA < 7.0; 0 si no.

    // Clinical Screening Input (from MTSS Expediente)
    ansiedad_norm: number; // X3: Puntuación normalizada de GAD-7/BAI (0 a 1.0)
}

/**
 * Calcula el Índice de Riesgo Compuesto (IRC) y determina el nivel de riesgo (Semáforo).
 * @param data Datos del estudiante, ya procesados y normalizados.
 * @returns IRC (0-100) y Nivel de Riesgo (Bajo, Medio, Alto).
 */
export function calculateRisk(data: RiskData) {
    const { B0_intercepto, B1_ausentismo, B2_bajo_rendimiento, B3_ansiedad_clinica } = DEFAULT_COEFFICIENTS;

    // 1. Cálculo del puntaje lineal (Z)
    const Z = B0_intercepto +
        (B1_ausentismo * data.ausentismo_norm) +
        (B2_bajo_rendimiento * data.bajo_rendimiento_bin) +
        (B3_ansiedad_clinica * data.ansiedad_norm);

    // 2. Aplicación de la Ecuación Logística: P = 1 / (1 + e^(-Z))
    const probabilidadRiesgo = 1 / (1 + Math.exp(-Z));

    // 3. Normalizar a porcentaje
    const IRC = parseFloat((probabilidadRiesgo * 100).toFixed(1));

    // 4. Lógica del Semáforo (Cap. 5.2.3)
    let nivelRiesgo: 'Bajo (Verde)' | 'Medio (Amarillo)' | 'Alto (Rojo)';
    let color: 'green' | 'yellow' | 'red';

    if (IRC >= 60) {
        nivelRiesgo = 'Alto (Rojo)';
        color = 'red';
    } else if (IRC >= 30) {
        nivelRiesgo = 'Medio (Amarillo)';
        color = 'yellow';
    } else {
        nivelRiesgo = 'Bajo (Verde)';
        color = 'green';
    }

    return {
        IRC,
        nivelRiesgo,
        color,
    };
}

/**
 * Analiza una lista de resultados de pruebas para estimar riesgo agregado (versión legacy/simple).
 */
export function analyzeStudentRiskSimple(testResults: Array<{ score?: number }>) {
    if (!testResults || testResults.length === 0) {
        return { level: 'bajo' as const, totalScore: 0, count: 0 };
    }

    const totalScore = testResults.reduce((acc, res) => acc + (res.score || 0), 0);
    let level: 'bajo' | 'medio' | 'alto' = 'bajo';

    if (totalScore > 50) level = 'alto';
    else if (totalScore > 20) level = 'medio';

    return { level, totalScore, count: testResults.length };
}

// Rename the old export for backward compat
export { analyzeStudentRiskSimple as analyzeStudentRisk };

/**
 * Return type for the full analyzeStudentRisk function.
 */
export type StudentRiskAnalysis = {
    riskLevel: 'low' | 'medium' | 'high';
    currentGrade: number;
    currentAttendance: number;
    isRecovery: boolean;
    riskFactors: string[];
    failingRisk: number;
    dropoutRisk: number;
    predictionMessage: string;
};

// Re-export the full analysis function under the same name for callers that need the expanded signature.
// We use declaration merging: the default export of analyzeStudentRisk (above) is the simple version.
// The full version is available as analyzeStudentRiskFull.
export function analyzeStudentRiskFull(
    student: { id: string; gad7Score?: number; neuropsiTotal?: number; neuropsiScore?: number },
    partialData: PartialData,
    criteria: Array<{ id: string; name: string; weight: number; expectedValue: number; isActive?: boolean }>,
    totalClasses: number,
    observations?: string[],
    semesterGradeOverride?: number
): StudentRiskAnalysis {
    // --- Calculate current grade ---
    let isRecovery = false;
    let currentGrade: number;

    const meritInfo = partialData.meritGrades?.[student.id];
    if (meritInfo?.applied) {
        currentGrade = meritInfo.grade ?? 0;
    } else {
        const recoveryInfo = partialData.recoveryGrades?.[student.id];
        if (recoveryInfo?.applied) {
            currentGrade = recoveryInfo.grade ?? 0;
            isRecovery = true;
        } else {
            // Calculate weighted grade
            let totalEarned = 0;
            let totalPossibleWeight = 0;
            const activeCriteria = (criteria || []).filter(c => c.isActive !== false);

            if (partialData && activeCriteria.length > 0) {
                activeCriteria.forEach(c => {
                    let ratio = 0;
                    if (c.name === 'Actividades' || c.name === 'Portafolio') {
                        const total = partialData.activities?.length ?? 0;
                        if (total > 0) {
                            const completed = Object.values(partialData.activityRecords?.[student.id] || {}).filter(Boolean).length;
                            ratio = completed / total;
                        }
                    } else if (c.name === 'Participación') {
                        const total = Object.keys(partialData.participations || {}).length;
                        if (total > 0) {
                            const daysAttended = Object.values(partialData.participations).filter((day: any) => day[student.id]).length;
                            ratio = daysAttended / total;
                        }
                    } else {
                        const delivered = partialData.grades?.[student.id]?.[c.id]?.delivered ?? 0;
                        if (c.expectedValue > 0) ratio = delivered / c.expectedValue;
                    }
                    const earned = ratio * c.weight;
                    totalEarned += earned;
                    totalPossibleWeight += c.weight;
                });
            }

            currentGrade = totalPossibleWeight > 0 ? (totalEarned / totalPossibleWeight) * 100 : 100;
        }
    }

    // Apply semester grade override if provided
    if (semesterGradeOverride !== undefined) {
        currentGrade = semesterGradeOverride;
    }

    // Clamp grade to 0-100
    currentGrade = Math.max(0, Math.min(100, currentGrade));

    // --- Calculate attendance ---
    let currentAttendance = 100;
    if (totalClasses > 0 && partialData.attendance) {
        const days = Object.keys(partialData.attendance).filter(d => Object.prototype.hasOwnProperty.call(partialData.attendance![d], student.id));
        if (days.length > 0) {
            const attended = days.reduce((count, d) => partialData.attendance![d][student.id] === true ? count + 1 : count, 0);
            currentAttendance = (attended / days.length) * 100;
        }
    }

    // --- Determine risk factors ---
    const riskFactors: string[] = [];

    if (currentGrade < 60) {
        riskFactors.push(`Calificación reprobatoria (${currentGrade.toFixed(0)}%)`);
    } else if (currentGrade <= 70) {
        riskFactors.push(`Calificación baja (${currentGrade.toFixed(0)}%)`);
    }

    if (currentAttendance < 80) {
        riskFactors.push(`Asistencia baja (${currentAttendance.toFixed(0)}%)`);
    }

    // Clinical risk factors
    const gad7Score = student.gad7Score;
    if (gad7Score !== undefined && gad7Score > 14) {
        riskFactors.push(`Ansiedad clínica severa (GAD-7: ${gad7Score})`);
    } else if (gad7Score !== undefined && gad7Score > 9) {
        riskFactors.push(`Ansiedad moderada (GAD-7: ${gad7Score})`);
    }

    const neuropsiScore = student.neuropsiTotal ?? student.neuropsiScore;
    if (neuropsiScore !== undefined && neuropsiScore < 70) {
        riskFactors.push(`Rendimiento neuropsicológico bajo (${neuropsiScore})`);
    }

    // Observation-based risk factors
    if (observations && observations.length > 0) {
        const obsText = observations.join(' ').toLowerCase();
        if (obsText.includes('ideación suicida') || obsText.includes('autolesiones')) {
            riskFactors.push('Indicadores de riesgo suicida detectados');
        }
        if (obsText.includes('agresividad') || obsText.includes('violencia')) {
            riskFactors.push('Conducta agresiva reportada');
        }
        if (obsText.includes('deserción') || obsText.includes('abandono')) {
            riskFactors.push('Riesgo de deserción verbalizado');
        }
    }

    // --- Determine risk level ---
    let riskLevel: 'low' | 'medium' | 'high';

    if (riskFactors.length === 0 && currentGrade >= 80 && currentAttendance >= 90) {
        riskLevel = 'low';
    } else if (
        currentGrade < 60 ||
        currentAttendance < 70 ||
        (gad7Score !== undefined && gad7Score > 14) ||
        riskFactors.some(f => f.includes('suicida') || f.includes('autolesiones'))
    ) {
        riskLevel = 'high';
    } else if (riskFactors.length > 0 || currentGrade <= 75 || currentAttendance < 85) {
        riskLevel = 'medium';
    } else {
        riskLevel = 'low';
    }

    // --- Calculate failing and dropout risk percentages ---
    let failingRisk = 0;
    let dropoutRisk = 0;

    // Failing risk based on grade trajectory
    if (currentGrade < 50) failingRisk = 85;
    else if (currentGrade < 60) failingRisk = 70;
    else if (currentGrade < 70) failingRisk = 40;
    else if (currentGrade < 80) failingRisk = 15;
    else failingRisk = 5;

    // Boost failing risk if attendance is low
    if (currentAttendance < 70) failingRisk = Math.min(95, failingRisk + 15);
    else if (currentAttendance < 80) failingRisk = Math.min(95, failingRisk + 8);

    // Dropout risk based on combined factors
    if (currentAttendance < 60) dropoutRisk = 60;
    else if (currentAttendance < 75) dropoutRisk = 30;
    else if (currentAttendance < 85) dropoutRisk = 12;
    else dropoutRisk = 3;

    if (currentGrade < 50) dropoutRisk = Math.min(80, dropoutRisk + 25);
    if (gad7Score !== undefined && gad7Score > 14) dropoutRisk = Math.min(80, dropoutRisk + 15);
    if (riskFactors.some(f => f.includes('deserción'))) dropoutRisk = Math.min(90, dropoutRisk + 20);

    // --- Generate prediction message ---
    let predictionMessage: string;
    if (riskLevel === 'high') {
        predictionMessage = '⚠️ Alto riesgo detectado. Se requiere intervención inmediata y seguimiento estrecho.';
    } else if (riskLevel === 'medium') {
        predictionMessage = '🔶 Riesgo moderado. Se recomienda monitoreo y posible referencia a orientación.';
    } else {
        predictionMessage = '✅ Rendimiento adecuado. Continuar con seguimiento regular.';
    }

    if (isRecovery) {
        predictionMessage += ' (Con calificación de recuperación aplicada)';
    }

    return {
        riskLevel,
        currentGrade,
        currentAttendance,
        isRecovery,
        riskFactors,
        failingRisk,
        dropoutRisk,
        predictionMessage,
    };
}
