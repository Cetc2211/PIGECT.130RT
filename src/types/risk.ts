/**
 * Tipos unificados para análisis de riesgo académico.
 * Centraliza CalculatedRisk para uso en use-data.tsx, risk-analysis.ts, 
 * groups, statistics, pigec-simulation y reportes.
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFactor {
  tipo: string;
  descripcion: string;
  peso: number;
}

/**
 * Tipo unificado de riesgo calculado.
 * 
 * Combina la información del análisis simple (use-data.tsx) 
 * con el análisis completo (risk-analysis.ts).
 * 
 * Los campos `level`, `reason`, y `count` son alias de compatibilidad
 * hacia atrás para consumidores que usaban la versión simple.
 */
export interface CalculatedRisk {
  // --- Análisis completo (analyzeStudentRiskFull) ---
  
  /** Nivel de riesgo determinado: 'low' | 'medium' | 'high' */
  riskLevel: RiskLevel;
  
  /** Puntaje total de riesgo (0-100, del análisis simple si aplica) */
  totalScore: number;
  
  /** Riesgo de reprobación estimado (0-100) */
  failingRisk: number;
  
  /** Riesgo de deserción estimado (0-100) */
  dropoutRisk: number;
  
  /** Factores de riesgo detectados */
  riskFactors: string[];
  
  /** Calificación actual del estudiante (0-100) */
  currentGrade?: number;
  
  /** Porcentaje de asistencia actual (0-100) */
  currentAttendance?: number;
  
  /** Indica si la calificación incluye recuperación */
  isRecovery?: boolean;
  
  /** Mensaje legible con la predicción */
  predictionMessage: string;
  
  // --- Compatibilidad hacia atrás (versión simple) ---
  
  /** Alias de riskLevel. Consumers viejos usan .level */
  level: RiskLevel;
  
  /** Número de factores de riesgo detectados. Consumers viejos usan .count */
  count: number;
  
  /** Razón legible del nivel de riesgo (para StoredExpediente legacy) */
  reason: string;
  
  // --- Metadata ---
  
  /** ISO timestamp de cuándo se calculó */
  calculatedAt: string;
}
