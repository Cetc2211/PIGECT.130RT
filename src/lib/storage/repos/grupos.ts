// ============================================================================
// REPOS: grupos — CRUD for Grupo and EstudianteGrupo records (localStorage)
// ============================================================================
// localStorage keys:
//   `pigec_grupos`           — Grupo[]
//   `pigec_estudiantes_grupo` — EstudianteGrupo[]
// Matches existing grupos-service.ts key names.
// ============================================================================

import type { Grupo, EstudianteGrupo } from '@/lib/grupos-service';
import {
  readFromLocalStorage,
  writeToLocalStorage,
} from '../db';

const GRUPOS_KEY = 'pigec_grupos';
const ESTUDIANTES_KEY = 'pigec_estudiantes_grupo';

// ─── Grupos ─────────────────────────────────────────────────────────────────

/**
 * Get all stored grupos, sorted by semester then name.
 */
export function getGrupos(): Grupo[] {
  const grupos = readFromLocalStorage<Grupo>(GRUPOS_KEY);
  grupos.sort(
    (a, b) =>
      a.semestre !== b.semestre
        ? a.semestre - b.semestre
        : a.nombre.localeCompare(b.nombre),
  );
  return grupos;
}

/**
 * Save (upsert) a grupo.  If a record with the same `id` exists it is
 * replaced; otherwise it is appended.
 */
export function saveGrupo(grupo: Grupo): void {
  const current = readFromLocalStorage<Grupo>(GRUPOS_KEY);
  const idx = current.findIndex((g) => g.id === grupo.id);
  if (idx >= 0) {
    current[idx] = grupo;
  } else {
    current.push(grupo);
  }
  writeToLocalStorage(GRUPOS_KEY, current);
}

/**
 * Delete a grupo by `id`.
 */
export function deleteGrupo(id: string): void {
  const current = readFromLocalStorage<Grupo>(GRUPOS_KEY);
  writeToLocalStorage(
    GRUPOS_KEY,
    current.filter((g) => g.id !== id),
  );
}

// ─── Estudiantes de Grupo ───────────────────────────────────────────────────

/**
 * Get all students belonging to a specific group.
 */
export function getEstudiantesGrupo(grupoId: string): EstudianteGrupo[] {
  const all = readFromLocalStorage<EstudianteGrupo>(ESTUDIANTES_KEY);
  const filtered = all.filter((e) => e.grupoId === grupoId);
  filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return filtered;
}

/**
 * Save (upsert) a batch of estudiantes for a group.  Existing records with
 * matching `id` are replaced; new ones are appended.
 */
export function saveEstudiantesGrupo(estudiantes: EstudianteGrupo[]): void {
  const current = readFromLocalStorage<EstudianteGrupo>(ESTUDIANTES_KEY);
  const incomingIds = new Set(estudiantes.map((e) => e.id));
  const merged = [
    ...current.filter((e) => !incomingIds.has(e.id)),
    ...estudiantes,
  ];
  writeToLocalStorage(ESTUDIANTES_KEY, merged);
}
