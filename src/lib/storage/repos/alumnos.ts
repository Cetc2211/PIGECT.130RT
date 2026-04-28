// ============================================================================
// REPOS: alumnos — CRUD for Student records (IndexedDB)
// ============================================================================
// IDB key: `app_students` (matches existing use-data.tsx pattern)
// ============================================================================

import type { Student } from '@/lib/placeholder-data';
import { readFromDb, writeToDb } from '../db';

const STUDENTS_KEY = 'app_students';

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Get all stored students from IndexedDB.
 * Returns an empty array if nothing is stored or on SSR.
 */
export async function getAlumnos(): Promise<Student[]> {
  const envelope = await readFromDb<Student[]>(STUDENTS_KEY);
  return envelope?.value ?? [];
}

/**
 * Get a single student by ID.
 */
export async function getAlumnoById(
  id: string,
): Promise<Student | undefined> {
  const all = await getAlumnos();
  return all.find((s) => s.id === id);
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Save (replace) the entire student list in IndexedDB.
 */
export async function saveAlumnos(alumnos: Student[]): Promise<void> {
  await writeToDb(STUDENTS_KEY, alumnos);
}

/**
 * Update a single student by merging `data` into the existing record.
 * If the student does not exist, this is a no-op.
 */
export async function updateAlumno(
  id: string,
  data: Partial<Student>,
): Promise<void> {
  const all = await getAlumnos();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...data };
  await writeToDb(STUDENTS_KEY, all);
}
