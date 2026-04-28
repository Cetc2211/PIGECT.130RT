// ============================================================================
// REPOS: sesiones — Evaluation session CRUD (localStorage)
// ============================================================================
// localStorage key: `pigec_evaluation_sessions` (matches existing storage-local.ts)
// ============================================================================

import type { StoredEvaluationSession } from '../types';
import {
  readFromLocalStorage,
  writeToLocalStorage,
} from '../db';

const SESSIONS_KEY = 'pigec_evaluation_sessions';

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Get all stored evaluation sessions.
 */
export function getEvaluationSessions(): StoredEvaluationSession[] {
  return readFromLocalStorage<StoredEvaluationSession>(SESSIONS_KEY);
}

/**
 * Get a single evaluation session by ID.
 */
export function getEvaluationSessionById(
  id: string,
): StoredEvaluationSession | null {
  const sessions = getEvaluationSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Save (upsert) an evaluation session.  If a record with the same `id`
 * exists it is replaced; otherwise it is appended.
 */
export function saveEvaluationSession(
  session: StoredEvaluationSession,
): void {
  const current = readFromLocalStorage<StoredEvaluationSession>(SESSIONS_KEY);
  const matchIndex = current.findIndex((item) => item.id === session.id);

  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...session };
  } else {
    current.push(session);
  }

  writeToLocalStorage(SESSIONS_KEY, current);
}
