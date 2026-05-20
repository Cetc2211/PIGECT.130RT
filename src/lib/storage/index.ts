// ============================================================================
// STORAGE — Barrel export for the storage abstraction layer
// ============================================================================
// Import from '@/lib/storage' to access all types, db helpers, and repos.
// ============================================================================

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  // placeholder-data re-exports
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
  // local-access re-exports
  LocalSpecialistProfile,
  // store re-exports
  ClinicalAssessment,
  FunctionalAnalysis,
  TreatmentPlan,
  // expediente-service re-exports
  Expediente,
  FichaIdentificacionData,
  EvaluacionRegistro,
  NotaExpediente,
  // grupos-service re-exports
  Grupo,
  EstudianteGrupo,
  // storage-specific types
  StorageEnvelope,
  DbKey,
  TestResultSaveParams,
  TestResult,
  StoredEvaluationSession,
} from './types';

// ─── DB helpers ─────────────────────────────────────────────────────────────
export {
  readFromDb,
  writeToDb,
  removeFromDb,
  clearDb,
  readFromLocalStorage,
  writeToLocalStorage,
  readSingleFromLocalStorage,
  writeSingleToLocalStorage,
  removeFromLocalStorage,
  generateId,
} from './db';

// ─── Repos ─────────────────────────────────────────────────────────────────
export {
  getExpedientes,
  getExpedienteById,
  saveExpediente,
  deleteExpediente,
} from './repos/expedientes';

export {
  getGrupos,
  saveGrupo,
  deleteGrupo,
  getEstudiantesGrupo,
  saveEstudiantesGrupo,
} from './repos/grupos';

export {
  getAlumnos,
  saveAlumnos,
  getAlumnoById,
  updateAlumno,
} from './repos/alumnos';

export {
  getEvaluationSessions,
  getEvaluationSessionById,
  saveEvaluationSession,
} from './repos/sesiones';

export {
  getLocalProfile,
  saveLocalProfile,
  clearLocalProfile,
  hasAccess,
} from './repos/usuarios';

export {
  getObservaciones,
  saveObservaciones,
  addObservacion,
  updateObservacion,
} from './repos/observaciones';

export {
  getTestResults,
  saveTestResultLocal,
  saveTestResultDirect,
  getTestResultById,
} from './repos/resultados-pruebas';

export {
  getSettings,
  saveSettings,
  getGroups,
  saveGroups,
  getPartialsData,
  savePartialsData,
  getSpecialNotes,
  saveSpecialNotes,
  getActiveGroupId,
  setActiveGroupId,
} from './repos/configuracion';
