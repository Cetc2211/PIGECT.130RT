// ============================================================================
// REPOS: resultados-pruebas — Test results (localStorage)
// ============================================================================
// localStorage key: `pigec_test_results` (matches existing storage-local.ts)
//
// IMPORTANT: `saveTestResultLocal` MUST match the exact signature expected
// by existing form components (PlutchikForm, Gad7Form, LiraForm, etc.).
// ============================================================================

import type { TestResult, TestResultSaveParams } from '../types';
import {
  readFromLocalStorage,
  writeToLocalStorage,
  generateId,
} from '../db';

const TEST_RESULTS_KEY = 'pigec_test_results';

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Get all stored test results.
 */
export function getTestResults(): TestResult[] {
  return readFromLocalStorage<TestResult>(TEST_RESULTS_KEY);
}

/**
 * Get a single test result by ID.
 */
export function getTestResultById(
  id: string,
): TestResult | undefined {
  return getTestResults().find((r) => r.id === id);
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Save a test result using the canonical params interface.
 *
 * This is the **primary** entry point used by all form components.  It
 * accepts `TestResultSaveParams` (which uses `alumnoId` + `tipoPrueba`) and
 * normalises the data into the `TestResult` shape for storage.
 *
 * Returns `{ id: string; saved: true }` so callers can confirm success.
 */
export async function saveTestResultLocal(params: {
  alumnoId: string;
  tipoPrueba: 'Plutchik' | 'LIRA' | 'SSI' | 'WISC-V' | 'WAIS-IV' | string;
  respuestas: Record<string, unknown>;
  puntuacion?: Record<string, number>;
  fechaAplicacion: string;
  aplicadoPor: string;
  modo: 'presencial' | 'remoto';
}): Promise<{ id: string; saved: true }> {
  const resultId = generateId('tr');

  const result: TestResult = {
    id: resultId,
    studentId: params.alumnoId,
    testType: params.tipoPrueba,
    submittedAt: new Date().toISOString(),
    respuestas: params.respuestas,
    puntuacion: params.puntuacion,
    fechaAplicacion: params.fechaAplicacion,
    aplicadoPor: params.aplicadoPor,
    modo: params.modo,
  };

  const current = readFromLocalStorage<TestResult>(TEST_RESULTS_KEY);
  current.push(result);
  writeToLocalStorage(TEST_RESULTS_KEY, current);

  return { id: resultId, saved: true };
}

/**
 * Direct save of an already-shaped `TestResult` object (upsert by `id`).
 * Used by migration / import utilities that already have a full record.
 */
export function saveTestResultDirect(result: TestResult): void {
  const current = readFromLocalStorage<TestResult>(TEST_RESULTS_KEY);
  const resultId = result.id || generateId('tr');

  const normalized: TestResult = {
    ...result,
    id: resultId,
    submittedAt: result.submittedAt || new Date().toISOString(),
  };

  const matchIndex = current.findIndex((item) => item.id === resultId);
  if (matchIndex >= 0) {
    current[matchIndex] = normalized;
  } else {
    current.push(normalized);
  }

  writeToLocalStorage(TEST_RESULTS_KEY, current);
}
