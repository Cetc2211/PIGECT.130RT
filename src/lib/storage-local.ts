import type { OfficialGroup } from '@/lib/placeholder-data';
import type { WhatsAppBridgePayload } from '@/lib/data-utils';

const EXPEDIENTES_KEY = 'pigec_expedientes';
const OFFICIAL_GROUPS_KEY = 'pigec_official_groups';
const WHATSAPP_IMPORTS_KEY = 'pigec_whatsapp_imports';
const EVALUATION_SESSIONS_KEY = 'pigec_evaluation_sessions';
const TEST_RESULTS_KEY = 'pigec_test_results';
const CLINICAL_ASSESSMENTS_KEY = 'pigec_clinical_assessments';
const FUNCTIONAL_ANALYSES_KEY = 'pigec_functional_analyses';
const TREATMENT_PLANS_KEY = 'pigec_treatment_plans';

type StoredExpediente = {
  id?: string;
  studentId?: string;
  [key: string]: unknown;
};

type StoredWhatsAppImport = {
  id: string;
  importedAt: string;
  payload: WhatsAppBridgePayload;
};

type StoredEvaluationSession = {
  id: string;
  [key: string]: unknown;
};

type StoredTestResult = {
  id?: string;
  studentId?: string;
  sessionId?: string | null;
  testType?: string;
  submittedAt?: string;
  [key: string]: unknown;
};

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function getExpedientes<T = StoredExpediente>(): T[] {
  if (!isBrowser()) return [];
  return safeParseArray<T>(localStorage.getItem(EXPEDIENTES_KEY));
}

export function saveExpediente(expediente: StoredExpediente): void {
  if (!isBrowser()) return;
  const current = getExpedientes<StoredExpediente>();

  const matchIndex = expediente.studentId
    ? current.findIndex((item) => item.studentId && item.studentId === expediente.studentId)
    : current.findIndex((item) => expediente.id && item.id && item.id === expediente.id);

  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...expediente };
  } else {
    current.push(expediente);
  }

  // Collapse legacy duplicates for the same studentId and keep the most recently updated record.
  let normalized = current;
  if (expediente.studentId) {
    const targetStudentId = expediente.studentId;
    let keeperIndex = -1;

    normalized.forEach((item, index) => {
      if (item.studentId === targetStudentId) {
        keeperIndex = index;
      }
    });

    if (keeperIndex >= 0) {
      normalized = normalized.filter((item, index) => item.studentId !== targetStudentId || index === keeperIndex);
    }
  }

  localStorage.setItem(EXPEDIENTES_KEY, JSON.stringify(normalized));
}

export function saveExpedienteLocal(expediente: StoredExpediente): void {
  saveExpediente(expediente);
}

export function saveOfficialGroupStructure(group: OfficialGroup): void {
  if (!isBrowser()) return;
  const current = safeParseArray<OfficialGroup>(localStorage.getItem(OFFICIAL_GROUPS_KEY));
  const idx = current.findIndex((g) => g.id === group.id);

  if (idx >= 0) {
    current[idx] = { ...current[idx], ...group };
  } else {
    current.push(group);
  }

  localStorage.setItem(OFFICIAL_GROUPS_KEY, JSON.stringify(current));
}

export function getOfficialGroupStructures(): OfficialGroup[] {
  if (!isBrowser()) return [];
  return safeParseArray<OfficialGroup>(localStorage.getItem(OFFICIAL_GROUPS_KEY));
}

export function saveImportedWhatsAppEvaluation(payload: WhatsAppBridgePayload): string {
  if (!isBrowser()) return '';

  const importId = `wa-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const imports = safeParseArray<StoredWhatsAppImport>(localStorage.getItem(WHATSAPP_IMPORTS_KEY));

  imports.push({
    id: importId,
    importedAt: new Date().toISOString(),
    payload,
  });

  localStorage.setItem(WHATSAPP_IMPORTS_KEY, JSON.stringify(imports));

  return importId;
}

export function getImportedWhatsAppEvaluations(): StoredWhatsAppImport[] {
  if (!isBrowser()) return [];
  return safeParseArray<StoredWhatsAppImport>(localStorage.getItem(WHATSAPP_IMPORTS_KEY));
}

export function getEvaluationSessions<T = StoredEvaluationSession>(): T[] {
  if (!isBrowser()) return [];
  return safeParseArray<T>(localStorage.getItem(EVALUATION_SESSIONS_KEY));
}

export function getEvaluationSessionById<T = StoredEvaluationSession>(sessionId: string): T | null {
  if (!isBrowser()) return null;
  const sessions = getEvaluationSessions<T & { id: string }>();
  return sessions.find((session) => session.id === sessionId) || null;
}

export function saveEvaluationSession(session: StoredEvaluationSession): void {
  if (!isBrowser()) return;

  const current = getEvaluationSessions<StoredEvaluationSession>();
  const matchIndex = current.findIndex((item) => item.id === session.id);

  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...session };
  } else {
    current.push(session);
  }

  localStorage.setItem(EVALUATION_SESSIONS_KEY, JSON.stringify(current));
}

export function getTestResults<T = StoredTestResult>(): T[] {
  if (!isBrowser()) return [];
  return safeParseArray<T>(localStorage.getItem(TEST_RESULTS_KEY));
}

export function saveTestResultLocal(result: StoredTestResult): void {
  if (!isBrowser()) return;

  const current = getTestResults<StoredTestResult>();
  const resultId =
    result.id ||
    `tr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const normalized: StoredTestResult = {
    ...result,
    id: resultId,
    submittedAt: result.submittedAt || new Date().toISOString(),
  };

  const matchIndex = current.findIndex((item) => item.id === resultId);
  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...normalized };
  } else {
    current.push(normalized);
  }

  localStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(current));
}

// ─── CLINICAL ASSESSMENTS (localStorage) ─────────────────────────────────────

type StoredClinicalAssessment = {
  id?: string;
  studentId: string;
  fecha_evaluacion: string;
  bdi_ii_score: number;
  bai_score: number;
  riesgo_suicida_beck_score: number;
  neuro_mt_score: number;
  neuro_as_score: number;
  neuro_vp_score: number;
  contexto_carga_cognitiva: string;
  assist_result: string;
  conducta_autolesiva_score: number;
  impresion_diagnostica: string;
  [key: string]: unknown;
};

export function getClinicalAssessments<T = StoredClinicalAssessment>(): T[] {
  if (!isBrowser()) return [];
  return safeParseArray<T>(localStorage.getItem(CLINICAL_ASSESSMENTS_KEY));
}

export function getClinicalAssessmentByStudentId(studentId: string): StoredClinicalAssessment | undefined {
  const all = getClinicalAssessments<StoredClinicalAssessment>();
  return all.find((a) => a.studentId === studentId);
}

export function saveClinicalAssessment(assessment: StoredClinicalAssessment): void {
  if (!isBrowser()) return;

  const current = getClinicalAssessments<StoredClinicalAssessment>();
  const matchIndex = current.findIndex((item) => item.studentId === assessment.studentId);

  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...assessment };
  } else {
    current.push(assessment);
  }

  localStorage.setItem(CLINICAL_ASSESSMENTS_KEY, JSON.stringify(current));
}

// ─── FUNCTIONAL ANALYSES (localStorage) ───────────────────────────────────────

type StoredFunctionalAnalysis = {
  id?: string;
  studentId: string;
  session_number: number;
  fecha_sesion: string;
  analisis_funcional: {
    antecedente_principal: string;
    conducta_problema: string;
    funcion_mantenimiento: string;
    creencia_esquema: string;
  };
  [key: string]: unknown;
};

export function getFunctionalAnalyses<T = StoredFunctionalAnalysis>(): T[] {
  if (!isBrowser()) return [];
  return safeParseArray<T>(localStorage.getItem(FUNCTIONAL_ANALYSES_KEY));
}

export function getFunctionalAnalysisByStudentId(studentId: string): StoredFunctionalAnalysis | undefined {
  const all = getFunctionalAnalyses<StoredFunctionalAnalysis>();
  return all.find((a) => a.studentId === studentId);
}

export function saveFunctionalAnalysis(analysis: StoredFunctionalAnalysis): void {
  if (!isBrowser()) return;

  const current = getFunctionalAnalyses<StoredFunctionalAnalysis>();
  const matchIndex = current.findIndex((item) => item.studentId === analysis.studentId);

  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...analysis };
  } else {
    current.push(analysis);
  }

  localStorage.setItem(FUNCTIONAL_ANALYSES_KEY, JSON.stringify(current));
}

// ─── TREATMENT PLANS (localStorage) ───────────────────────────────────────────

type StoredTreatmentPlan = {
  id?: string;
  studentId: string;
  fecha_aprobacion: string;
  plan_narrativo_final: string;
  [key: string]: unknown;
};

export function getTreatmentPlans<T = StoredTreatmentPlan>(): T[] {
  if (!isBrowser()) return [];
  return safeParseArray<T>(localStorage.getItem(TREATMENT_PLANS_KEY));
}

export function getTreatmentPlanByStudentId(studentId: string): StoredTreatmentPlan | undefined {
  const all = getTreatmentPlans<StoredTreatmentPlan>();
  return all.find((p) => p.studentId === studentId);
}

export function saveTreatmentPlan(plan: StoredTreatmentPlan): void {
  if (!isBrowser()) return;

  const current = getTreatmentPlans<StoredTreatmentPlan>();
  const matchIndex = current.findIndex((item) => item.studentId === plan.studentId);

  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...plan };
  } else {
    current.push(plan);
  }

  localStorage.setItem(TREATMENT_PLANS_KEY, JSON.stringify(current));
}
