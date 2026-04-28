# Task: FASE 1.A — Create storage abstraction layer

## Agent: Main Orchestrator

## Summary
Created the complete `src/lib/storage/` abstraction layer with 11 files:
- `types.ts` — Unified type contracts (re-exports + storage-specific types)
- `db.ts` — Typed wrapper over idb-keyval (IDB) + localStorage helpers + `generateId`
- `index.ts` — Barrel export for the entire module
- 8 repository modules under `repos/`:
  1. `expedientes.ts` — CRUD for Expediente (localStorage `pigec_expedientes`)
  2. `grupos.ts` — CRUD for Grupo/EstudianteGrupo (localStorage `pigec_grupos`, `pigec_estudiantes_grupo`)
  3. `alumnos.ts` — CRUD for Student (IDB `app_students`, async)
  4. `sesiones.ts` — Evaluation sessions (localStorage `pigec_evaluation_sessions`)
  5. `usuarios.ts` — Local specialist profile (localStorage, mirrors local-access.ts keys)
  6. `observaciones.ts` — Student observations (IDB `app_observations`, async)
  7. `resultados-pruebas.ts` — Test results with exact `saveTestResultLocal` signature (localStorage `pigec_test_results`)
  8. `configuracion.ts` — App settings, groups, partials data (IDB keys from use-data.tsx)

## Key decisions
- `saveTestResultLocal` has the EXACT required inline signature matching what existing form components expect
- All IDB-backed repos are async; localStorage repos are sync
- Backward compatible with all existing localStorage key names
- `readFromDb` handles both `StorageEnvelope<T>` and legacy bare values
- `generateId` uses `crypto.randomUUID()` with fallback
- `activeGroupId_v1` uses the wrapper functions (readFromDb/writeToDb) for consistency

## TypeScript verification
- Ran `tsc --noEmit` — zero NEW errors from the storage layer files
- All pre-existing errors are in other files (genkit, firebase stubs, etc.)

## Files created (11 total)
1. `src/lib/storage/types.ts`
2. `src/lib/storage/db.ts`
3. `src/lib/storage/index.ts`
4. `src/lib/storage/repos/expedientes.ts`
5. `src/lib/storage/repos/grupos.ts`
6. `src/lib/storage/repos/alumnos.ts`
7. `src/lib/storage/repos/sesiones.ts`
8. `src/lib/storage/repos/usuarios.ts`
9. `src/lib/storage/repos/observaciones.ts`
10. `src/lib/storage/repos/resultados-pruebas.ts`
11. `src/lib/storage/repos/configuracion.ts`

## Files modified
- None (requirement: DO NOT modify existing files)
