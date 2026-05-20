// ============================================================================
// STORAGE TYPES — Unified type contracts for the storage abstraction layer
// ============================================================================
// Re-exports all relevant types from existing modules and defines new
// storage-specific types used by the repository modules.
// ============================================================================

// ─── Re-exports from placeholder-data (educational/grading domain) ───────────
export type {
  Student,
  Group,
  OfficialGroup,
  StudentObservation,
  SpecialNote,
  EvaluationCriteria,
  GradeDetail,
  Grades,
  RecoveryGrade,
  RecoveryGrades,
  MeritGrade,
  MeritGrades,
  AttendanceRecord,
  ParticipationRecord,
  Activity,
  ActivityRecord,
  PartialData,
  AllPartialsData,
  AllPartialsDataForGroup,
  AppSettings,
  CalculatedRisk,
  StudentWithRisk,
  CriteriaDetail,
  StudentStats,
  GroupedActivities,
  PartialId,
  RiskFlag,
  StudentReferral,
  Announcement,
  StudentJustification,
  JustificationCategory,
} from '@/lib/placeholder-data';

// ─── Re-exports from local-access (user/auth) ───────────────────────────────
export type { LocalSpecialistProfile } from '@/lib/local-access';

// ─── Re-exports from store (clinical domain) ────────────────────────────────
export type {
  ClinicalAssessment,
  FunctionalAnalysis,
  TreatmentPlan,
} from '@/lib/store';

// ─── Re-exports from expediente-service (expedientes domain) ────────────────
export type {
  Expediente,
  FichaIdentificacionData,
  EvaluacionRegistro,
  NotaExpediente,
} from '@/lib/expediente-service';

// ─── Re-exports from grupos-service (grupos domain) ─────────────────────────
export type { Grupo, EstudianteGrupo } from '@/lib/grupos-service';

// ─── Storage-specific types ─────────────────────────────────────────────────

/** Envelope wrapping stored values with a lastUpdated timestamp */
export interface StorageEnvelope<T> {
  value: T;
  lastUpdated: number;
}

/** Well-known IndexedDB keys used by idb-keyval */
export type DbKey =
  | 'app_groups'
  | 'app_students'
  | 'app_observations'
  | 'app_specialNotes'
  | 'app_partialsData'
  | 'app_settings';

/** Params for saving a test result — MUST match the signature used by existing
 *  form components (PlutchikForm, Gad7Form, LiraForm, etc.) */
export interface TestResultSaveParams {
  alumnoId: string;
  tipoPrueba:
    | 'Plutchik'
    | 'LIRA'
    | 'SSI'
    | 'WISC-V'
    | 'WAIS-IV'
    | string;
  respuestas: Record<string, unknown>;
  puntuacion?: Record<string, number>;
  fechaAplicacion: string;
  aplicadoPor: string;
  modo: 'presencial' | 'remoto';
}

/** Stored test result record */
export interface TestResult {
  id: string;
  studentId: string;
  sessionId?: string | null;
  testType: string;
  submittedAt: string;
  respuestas: Record<string, unknown>;
  puntuacion?: Record<string, number>;
  fechaAplicacion: string;
  aplicadoPor: string;
  modo: 'presencial' | 'remoto';
}

/** Generic evaluation session record (matches storage-local.ts StoredEvaluationSession) */
export interface StoredEvaluationSession {
  id: string;
  [key: string]: unknown;
}
