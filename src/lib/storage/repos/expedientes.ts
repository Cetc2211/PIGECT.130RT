// ============================================================================
// REPOS: expedientes — CRUD for Expediente records (localStorage)
// ============================================================================
// localStorage key: `pigec_expedientes` (matches existing storage-local.ts)
// ============================================================================

import type { Expediente } from '@/lib/expediente-service';
import {
  readFromLocalStorage,
  writeToLocalStorage,
} from '../db';

const EXPEDIENTES_KEY = 'pigec_expedientes';

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Get all stored expedientes, optionally filtered by a text search term
 * that matches `studentName`, `groupName`, or `id`.
 */
export function getExpedientes(filtro?: string): Expediente[] {
  const all = readFromLocalStorage<Expediente>(EXPEDIENTES_KEY);
  if (!filtro) return all;
  const term = filtro.toLowerCase();
  return all.filter(
    (e) =>
      e.studentName?.toLowerCase().includes(term) ||
      e.groupName?.toLowerCase().includes(term) ||
      e.id.toLowerCase().includes(term) ||
      e.studentId?.toLowerCase().includes(term),
  );
}

/**
 * Get a single expediente by its `id` or `studentId`.
 */
export function getExpedienteById(id: string): Expediente | undefined {
  return readFromLocalStorage<Expediente>(EXPEDIENTES_KEY).find(
    (e) => e.id === id || e.studentId === id,
  );
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Save (upsert) an expediente.  If a record with the same `studentId` or `id`
 * already exists it will be replaced; otherwise the record is appended.
 *
 * Also deduplicates legacy records with the same `studentId`, keeping only
 * the most recently created one (matches existing storage-local.ts logic).
 */
export function saveExpediente(expediente: Expediente): void {
  const current = readFromLocalStorage<Expediente>(EXPEDIENTES_KEY);

  const matchIndex = expediente.studentId
    ? current.findIndex(
        (item) => item.studentId && item.studentId === expediente.studentId,
      )
    : current.findIndex(
        (item) => expediente.id && item.id && item.id === expediente.id,
      );

  if (matchIndex >= 0) {
    current[matchIndex] = { ...current[matchIndex], ...expediente };
  } else {
    current.push(expediente);
  }

  // Deduplicate legacy entries sharing the same studentId
  let normalized = current;
  if (expediente.studentId) {
    const target = expediente.studentId;
    let keeperIndex = -1;
    normalized.forEach((item, idx) => {
      if (item.studentId === target) keeperIndex = idx;
    });
    if (keeperIndex >= 0) {
      normalized = normalized.filter(
        (item, idx) => item.studentId !== target || idx === keeperIndex,
      );
    }
  }

  writeToLocalStorage(EXPEDIENTES_KEY, normalized);
}

// ─── Delete ─────────────────────────────────────────────────────────────────

/**
 * Delete an expediente by its `id`.
 */
export function deleteExpediente(id: string): void {
  const current = readFromLocalStorage<Expediente>(EXPEDIENTES_KEY);
  const filtered = current.filter(
    (e) => e.id !== id && e.studentId !== id,
  );
  writeToLocalStorage(EXPEDIENTES_KEY, filtered);
}
