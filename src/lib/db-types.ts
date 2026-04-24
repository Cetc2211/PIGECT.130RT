// ============================================================================
// PIGEC-130 — Tipos de Datos Unificados para la Capa de Persistencia
// ============================================================================
// Todas las interfaces clínicas centralizadas en un solo archivo.
// Estos tipos definen la estructura exacta de los datos que se almacenan
// en IndexedDB a través de db-service.ts.
// ============================================================================

// ─── TIPOS BASE ──────────────────────────────────────────────────────────────

export type NivelMTSS = 'nivel_1' | 'nivel_2' | 'nivel_3';
export type EstadoExpediente = 'abierto' | 'en_seguimiento' | 'concluido' | 'inactivo';
export type OrigenExpediente = 'demo' | 'tamizaje_grupal' | 'derivacion_orientacion' | 'evaluacion_clinica' | 'registro_manual';
export type SuicideRiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Critico';

// ─── FICHA DE IDENTIFICACION ─────────────────────────────────────────────────

export interface FichaIdentificacionData {
  fullName: string;
  birthDate: string;
  sexo: 'femenino' | 'masculino' | '';
  genderIdentity: string;
  group: string;
  semester: string;
  domicilio: string;
  celular: string;
  whatsapp: string;
  email: string;
  livingWith: 'ambos' | 'mama' | 'papa' | 'abuelos' | 'otro' | '';
  motherName: string;
  motherPhone: string;
  fatherName: string;
  fatherPhone: string;
  backgroundInfo: string;
}

export const defaultFichaIdentificacion: FichaIdentificacionData = {
  fullName: '',
  birthDate: '',
  sexo: '',
  genderIdentity: '',
  group: '',
  semester: '',
  domicilio: '',
  celular: '',
  whatsapp: '',
  email: '',
  livingWith: '',
  motherName: '',
  motherPhone: '',
  fatherName: '',
  fatherPhone: '',
  backgroundInfo: '',
};

// ─── EXPEDIENTE (Entidad Central) ────────────────────────────────────────────

export interface Expediente {
  id: string;
  studentId: string;
  studentName: string;
  groupName: string;
  semester: number;

  // Metadata
  nivel: NivelMTSS;
  estado: EstadoExpediente;
  origen: OrigenExpediente;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: string;

  // Datos academicos base
  academicData: {
    gpa: number;
    absences: number;
  };

  // Ficha de identificacion
  fichaIdentificacion?: FichaIdentificacionData;

  // Indicadores clinicos calculados
  ansiedadScore?: number;
  suicideRiskLevel?: SuicideRiskLevel;
  irc?: number;
  nivelRiesgo?: string;

  // Evaluaciones registradas
  evaluaciones: EvaluacionRegistro[];

  // Notas clinicas/educativas
  notas: NotaExpediente[];
}

// ─── EVALUACION REGISTRO ─────────────────────────────────────────────────────

export interface EvaluacionRegistro {
  id: string;
  tipo: string;        // 'GAD-7', 'PHQ-9', 'BDI-II', 'BAI', 'BHS', 'SSI', 'Columbia', 'WISC-V', 'CHTE', etc.
  score: number;
  fecha: string;       // ISO date
  aplicadaPor: string;
  observaciones?: string;
  // Campos para distribucion inteligente (Fase 2)
  interpretacion?: string;
  severidad?: string;  // 'Minimo' | 'Leve' | 'Moderado' | 'Severo'
  alerts?: string[];
}

// ─── NOTA DE EXPEDIENTE ──────────────────────────────────────────────────────

export interface NotaExpediente {
  id: string;
  fecha: string;
  autor: string;
  tipo: 'clinica' | 'educativa' | 'derivacion' | 'seguimiento' | 'alerta' | 'trazabilidad';
  contenido: string;
}

// ─── EVALUACION CLINICA (Resumen consolidado) ────────────────────────────────

export interface ClinicalAssessment {
  id: string;
  expedienteId: string;
  studentId: string;
  fecha_evaluacion: string;

  // Instrumentos de depresion
  bdi_ii_score?: number;            // Beck Depression Inventory-II
  phq_9_score?: number;             // Patient Health Questionnaire-9

  // Instrumentos de ansiedad
  bai_score?: number;               // Beck Anxiety Inventory
  gad_7_score?: number;             // Generalized Anxiety Disorder-7
  idare_score?: number;             // IDARE/STAI

  // Desesperanza e ideacion suicida
  bhs_score?: number;               // Beck Hopelessness Scale
  ssi_score?: number;               // Scale for Suicide Ideation
  columbia_score?: number;          // Columbia-Suicide Severity Rating Scale

  // Conductas de riesgo
  assist_result?: string;           // ASSIST screening (Positivo/Negativo)
  plutchik_score?: number;          // Escala de Impulsividad de Plutchik
  conducta_autolesiva_score?: number;
  cdfr_score?: number;              // Conducta Disfuncional en Familia y Relaciones

  // Neuropsicologicos (WAIS-IV)
  neuro_mt_score?: number;          // Indice de Memoria de Trabajo
  neuro_as_score?: number;          // Atencion Sostenida
  neuro_vp_score?: number;          // Velocidad de Procesamiento

  // Contexto e impresion
  contexto_carga_cognitiva?: string;
  impresion_diagnostica?: string;

  // Interpretaciones individuales por instrumento
  interpretaciones?: Record<string, {
    score: number;
    severidad: string;
    interpretacion: string;
  }>;

  // Metadatos
  generadoPorIA?: boolean;
  fechaGeneracionIA?: string;
}

// ─── ANALISIS FUNCIONAL ─────────────────────────────────────────────────────

export interface FunctionalAnalysis {
  id: string;
  expedienteId: string;
  studentId: string;
  session_number: number;
  fecha_sesion: string;
  analisis_funcional: {
    antecedente_principal: string;   // A: Antecedente
    conducta_problema: string;       // B: Conducta Problema
    funcion_mantenimiento: string;   // C: Consecuencia (Refuerzo Positivo/Negativo)
    creencia_esquema: string;        // Creencia nucleare / Esquema cognitivo
  };
  observaciones?: string;
  generadoPorIA?: boolean;
}

// ─── NOTAS SOAP ──────────────────────────────────────────────────────────────

export interface SOAPNote {
  id: string;
  expedienteId: string;
  studentId: string;
  sessionId: string;
  createdAt: string;
  subjective: string;   // S: Reporte subjetivo del paciente
  objective: string;    // O: Observaciones objetivas del clinico
  assessment: string;   // A: Analisis clinico / Evaluacion
  plan: string;         // P: Plan de tratamiento
  sesionNumero?: number;
}

// ─── PLAN DE TRATAMIENTO ─────────────────────────────────────────────────────

export interface TreatmentPlan {
  id: string;
  expedienteId: string;
  studentId: string;
  fecha_aprobacion: string;
  version: number;
  plan_narrativo_final: string;

  // Desglose estructurado (para uso futuro con IA)
  diagnostico_preliminar?: string;
  objetivos_terapeuticos?: Array<{
    descripcion: string;
    criterio_medicion: string;
    plazo: string;
  }>;
  tecnicas_intervencion?: string[];
  frecuencia_sesiones?: string;
  indicadores_seguimiento?: string[];
  criterios_alta?: string[];

  generadoPorIA?: boolean;
  validadoClinicamente?: boolean;
}

// ─── REGISTRO DE SEGUIMIENTO (ProgressTracker) ───────────────────────────────

export interface ProgressRecord {
  id: string;
  expedienteId: string;
  studentId: string;
  semana_numero: number;
  fecha_registro: string;
  ideacion_suicida_score: number;   // 0-10
  suds_score: number;               // 0-100 (Subjective Units of Distress)
  logro_tarea_score: number;        // 0-10
  notas?: string;
}

// ─── PLAN DE SEGURIDAD ──────────────────────────────────────────────────────

export interface SafetyPlanStep {
  step: string;         // Etiqueta del paso
  content: string;      // Contenido ingresado por el especialista
}

export interface SafetyPlan {
  id: string;
  expedienteId: string;
  studentId: string;
  studentName: string;
  createdAt: string;
  version: number;
  steps: SafetyPlanStep[];
  activo: boolean;
}

// ─── PERFIL WISC-V ──────────────────────────────────────────────────────────

export interface WiscIndexResult {
  id: string;            // 'ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'
  name: string;
  sumPE: number;         // Suma de Puntajes Escalares
  pc: number;            // Puntuacion Compuesta
  percentile: number;
  classification: string; // 'Muy Superior' | 'Superior' | 'Promedio Alto' | 'Promedio' | 'Medio Bajo' | 'Muy Bajo' | 'Extremadamente Bajo'
}

export interface WiscProfile {
  id: string;
  expedienteId: string;
  studentId: string;
  studentName: string;
  studentAge: string;
  fecha_aplicacion: string;
  tipo: 'WISC-V' | 'WAIS-IV';
  scaledScores: Record<string, number>;
  indices: WiscIndexResult[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    discrepancies: string[];
    diagnosis: string;
  };
  narrative: Record<string, string>;
  chartImage?: string;   // Base64 del grafico
  generadoPorIA?: boolean;
  reporteNarrativo?: string;
  sintesisDiagnostica?: string;
}

// ─── PIEI (Plan de Intervencion Educativa Individual) ────────────────────────

export interface PIEIInstruction {
  id: string;
  text: string;
  evidenceTag: 'educativa' | 'activacion-conductual' | 'dbt' | 'tcc' | 'regulacion-emocional' | 'otro';
}

export interface PIEIPlan {
  id: string;
  expedienteId: string;
  studentId: string;
  approved_instructions: PIEIInstruction[];
  supporting_evidence: string[];
  approved_at: string;
  approved_by: string;
  version: number;
}

export interface PIEIFeedback {
  id: string;
  expedienteId: string;
  studentId: string;
  feedback_data: Record<string, {
    applied: boolean;
    effectiveness?: 'alta' | 'media' | 'baja';
    notas?: string;
  }>;
  submitted_at: string;
}

// ─── EVALUACION EDUCATIVA ────────────────────────────────────────────────────

export interface ChteScores {
  lugar: number;
  planificacion: number;
  atencion: number;
  metodo: number;
  actitud: number;
}

export interface NeuropsychScreening {
  atencionPercentil: number;
  memoriaTrabajoPercentil: number;
  controlInhibitorioPercentil: number;
}

export interface EducationalAssessment {
  id: string;
  expedienteId: string;
  studentId: string;
  fecha_evaluacion: string;
  chteScores: ChteScores;
  totalScore: number;
  interpretation: 'Bajo' | 'Medio' | 'Alto';
  neuropsychScreening: NeuropsychScreening;
}

// ─── IMPRESION DIAGNOSTICA INTEGRAL ─────────────────────────────────────────

export interface ImpresionDiagnostica {
  id: string;
  expedienteId: string;
  studentId: string;
  fecha_generacion: string;
  modelo_usado: string;      // Ej: 'gemini-2.0-flash'
  secciones: {
    motivo_consulta: string;
    historial_evaluaciones: string;
    resumen_clinico: string;
    analisis_cualitativo: string;
    evolucion_temporal: string;
    impresion_diagnostica: string;
    plan_intervencion: string;
    pronostico: string;
  };
  advertencia_etica: boolean;
  version: number;
}

// ─── CONFIGURACION DE LA APLICACION ──────────────────────────────────────────

export interface AppConfiguration {
  clave: string;   // unique key
  valor: string;   // JSON stringified value
  descripcion?: string;
  actualizadoEn: string;
}

// ─── SESION DE EVALUACION ───────────────────────────────────────────────────

export interface EvaluacionSesion {
  id: string;
  tokenId: string;
  estado: 'activa' | 'completada' | 'cancelada';
  createdAt: string;
  updatedAt?: string;
  studentId?: string;
  studentName?: string;
  modo: 'grupal' | 'individual';
  pruebas: string[];
  resultados?: Record<string, unknown>;
}

// ─── RESPELDO / EXPORTACION ─────────────────────────────────────────────────

export interface BackupSnapshot {
  version: string;
  fecha_respaldo: string;
  especialista: string;
  expedientes: Expediente[];
  evaluaciones_clinicas: ClinicalAssessment[];
  analisis_funcionales: FunctionalAnalysis[];
  notas_soap: SOAPNote[];
  planes_tratamiento: TreatmentPlan[];
  registros_seguimiento: ProgressRecord[];
  planes_seguridad: SafetyPlan[];
  perfiles_wisc: WiscProfile[];
  planes_piei: PIEIPlan[];
  feedbacks_piei: PIEIFeedback[];
  evaluaciones_educativas: EducationalAssessment[];
  impresiones_diagnosticas: ImpresionDiagnostica[];
  sesiones_evaluacion: EvaluacionSesion[];
  configuracion: AppConfiguration[];
}

// ─── RESULTADO DE TEST (WhatsApp Bridge / Importacion) ───────────────────────

export interface TestResultImport {
  id: string;
  expedienteId: string;
  studentId: string;
  testType: string;
  canonicalType?: string;
  score: number;
  interpretation: string;
  severity: string;
  date: string;
  alerts?: string[];
  source: 'whatsapp_bridge' | 'manual' | 'grupo_evaluacion';
  importId?: string;
}

// ─── ALERTA CLINICA ─────────────────────────────────────────────────────────

export interface ClinicalAlert {
  id: string;
  expedienteId: string;
  studentId: string;
  fecha: string;
  tipo: 'riesgo_suicida' | 'riesgo_autolesion' | 'severidad_alta' | 'cambio_significativo' | 'info';
  prueba_origen: string;
  score: number;
  umbral: number;
  mensaje: string;
  accion_recomendada: string;
  revisada: boolean;
}
