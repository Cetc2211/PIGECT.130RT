// ============================================================================
// REPOS: observaciones — Student observations (IndexedDB)
// ============================================================================
// IDB key: `app_observations` (matches existing use-data.tsx pattern)
// ============================================================================

import type { StudentObservation } from '@/lib/placeholder-data';
import { readFromDb, writeToDb, generateId } from '../db';

const OBSERVATIONS_KEY = 'app_observations';

type ObservationsMap = Record<string, StudentObservation[]>;

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Get the full observations map `{ [studentId]: StudentObservation[] }`.
 */
export async function getObservaciones(): Promise<ObservationsMap> {
  const envelope = await readFromDb<ObservationsMap>(OBSERVATIONS_KEY);
  return envelope?.value ?? {};
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Replace the entire observations map.
 */
export async function saveObservaciones(
  observaciones: ObservationsMap,
): Promise<void> {
  await writeToDb(OBSERVATIONS_KEY, observaciones);
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Append a new observation for a student.
 */
export async function addObservacion(
  studentId: string,
  observation: Omit<StudentObservation, 'id'>,
): Promise<StudentObservation> {
  const all = await getObservaciones();
  const studentObs = all[studentId] ?? [];

  const newObservation: StudentObservation = {
    ...observation,
    id: generateId('obs'),
  };

  all[studentId] = [...studentObs, newObservation];
  await saveObservaciones(all);
  return newObservation;
}

/**
 * Update an existing observation: modify its `details` text and optionally
 * close it (`isClosed = true`).
 */
export async function updateObservacion(
  studentId: string,
  observationId: string,
  updateText: string,
  isClosing: boolean,
): Promise<void> {
  const all = await getObservaciones();
  const studentObs = all[studentId];
  if (!studentObs) return;

  const idx = studentObs.findIndex((o) => o.id === observationId);
  if (idx === -1) return;

  const updated = [...studentObs];
  updated[idx] = {
    ...updated[idx],
    details: updateText,
    ...(isClosing ? { isClosed: true } : {}),
    ...(isClosing
      ? {
          followUpUpdates: [
            ...(updated[idx].followUpUpdates ?? []),
            { date: new Date().toISOString(), update: updateText },
          ],
        }
      : {}),
  };

  all[studentId] = updated;
  await saveObservaciones(all);
}
