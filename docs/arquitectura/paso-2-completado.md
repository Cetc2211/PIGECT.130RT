# Paso 2 — Consolidación de Tipos y Limpieza de Silenciados

## Estado: ✅ Completado
**Fecha:** 2026-04-25
**Commits:** `7f41669`, `efaf155`, `0b0884b`, `cierre-p2`
**Rama:** `redesign-v2`
**Commit base:** `c930e0e` (cierre Paso 1)

---

## 1. Resumen de Cambios

### Commit 1 — `7f41669`: Unificación de CalculatedRisk

**Problema:** Existían dos tipos de riesgo incompatibles:
- `CalculatedRisk` en `placeholder-data.ts`: `{ level, reason }` (simple)
- `StudentRiskAnalysis` en `risk-analysis.ts`: `{ riskLevel, currentGrade, ... }` (full, 8 campos)

Dos funciones coexistían con firmas diferentes:
- `getStudentRiskLevel(3 params)` → CalculatedRisk simple
- `analyzeStudentRiskFull(6 params posicionales)` → StudentRiskAnalysis

**Solución:**
- Creado `src/types/risk.ts` con tipo unificado `CalculatedRisk` que incluye todos los campos del análisis full + alias de compatibilidad (`level`, `reason`, `count`)
- `placeholder-data.ts` ahora re-exporta `CalculatedRisk` desde `@/types/risk`
- `analyzeStudentRiskFull`: firma cambiada de 6 params posicionales a objeto de parámetros (`AnalyzeRiskParams`)
- `getStudentRiskLevel` en `use-data.tsx`: ahora es wrapper de `getSimpleRiskLevel()`, devuelve CalculatedRisk completo
- Creada `getSimpleRiskLevel()` en `risk-analysis.ts` para el caso simple (solo calificación + asistencia)
- Eliminado tipo `StudentRiskAnalysis` (reemplazado por `CalculatedRisk`)
- Actualizados 3 consumidores (groups, statistics, pigec-simulation) a firma con objeto

### Commit 2 — `efaf155`: Resolución Zod/Genkit

**Problema:** Genkit embebe Zod 3.25.76 pero la app usaba Zod 3.22.4. La incompatibilidad causaba 4 errores de tipo en `wisc-report-flow.ts` y 2 en `genkit.ts`, todos silenciados con `@ts-expect-error`.

**Solución:**
- `wisc-report-flow.ts`: importar `z` desde `@/ai/genkit` (re-export del Zod embebido de Genkit) en vez de `zod`
- `genkit.ts`: eliminar `Plugin` type (no existe en versión actual de Genkit), usar `GenkitPlugin` directo
- `genkit.ts`: eliminar `enableTracingAndMetrics` (no existe en versión actual)
- Eliminados 5 `@ts-expect-error` (4 en wisc-report-flow, 1 en genkit)

### Commit 3 — `0b0884b`: Auditoría de silenciados

**Resultado del audit:**
- Solo quedan 3 silenciados en todo el codebase, todos en `WISC-VScoringConsole.tsx`:
  1. Línea 1388: `@ts-expect-error` — `getScaledScoreFromTable` referenciado sin importar en subcomponente
  2. Línea 1399: `@ts-expect-error` — `setRawScores` del scope padre no pasado como prop
  3. Línea 1625: `@ts-ignore` — `TEST_CASES` indexado dinámicamente sin tipo
- Cada uno marcado con `// TODO(Paso 5)` explicando la solución correcta
- `tsconfig.json`: `strict: true` ya estaba activo
- `typecheck` y `lint` scripts limpios (sin `|| true` ni flags suavizadores)

---

## 2. Conteo de Errores TypeScript

| Métrica | Antes del Paso 2 | Después del Paso 2 |
|---------|-------------------|-------------------|
| Errores totales | 0 (con ~5 @ts-expect-error) | 0 |
| @ts-expect-error | 5 (AI) + 3 (WISC) = 8 | 3 (solo WISC Paso 5) |
| @ts-ignore | 1 (WISC) | 1 (solo WISC Paso 5) |
| Errores reales | 0 | 0 |

### @ts-expect-error remanentes (todos WISC, Paso 5)

| Archivo | Línea | Descripción |
|---------|-------|-------------|
| `WISC-VScoringConsole.tsx` | 1388 | `getScaledScoreFromTable` referenciado sin importar en subcomponente |
| `WISC-VScoringConsole.tsx` | 1399 | `setRawScores` del scope padre no pasado como prop |
| `WISC-VScoringConsole.tsx` | 1625 | `TEST_CASES` indexado dinámicamente sin tipar |

---

## 3. Estado del CI

- **TypeScript:** ✅ 0 errores (`npx tsc --noEmit`)
- **ESLint:** ✅ 0 errores, 1 warning preexistente (`<img>` en vez de `<Image>`)
- **Build:** ✅ Exitoso — todas las rutas compiladas
- **CI esperado:** https://github.com/Cetc2211/PIGECT.130RT/actions

---

## 4. Archivos Nuevos/Modificados

| Archivo | Acción |
|---------|--------|
| `src/types/risk.ts` | **Creado** — Tipo unificado CalculatedRisk + RiskLevel + AnalyzeRiskParams |
| `src/lib/risk-analysis.ts` | **Refactorizado** — Firma objeto, elimina StudentRiskAnalysis, agrega getSimpleRiskLevel |
| `src/lib/placeholder-data.ts` | **Modificado** — Re-exporta CalculatedRisk desde @/types/risk |
| `src/hooks/use-data.tsx` | **Modificado** — getStudentRiskLevel como wrapper, fallback completo |
| `src/ai/genkit.ts` | **Modificado** — Elimina Plugin/logLevel, re-exporta z |
| `src/ai/flows/wisc-report-flow.ts` | **Modificado** — Usa z de genkit, elimina @ts-expect-error |
| `src/app/groups/[groupId]/page.tsx` | **Modificado** — Firma objeto en analyzeStudentRiskFull |
| `src/app/statistics/page.tsx` | **Modificado** — Firma objeto + null checks |
| `src/app/pigec-simulation/page.tsx` | **Modificado** — Firma objeto |
| `src/components/WISC-VScoringConsole.tsx` | **Modificado** — TODO(Paso 5) en silenciados |

---

## 5. Próximo Paso: Paso 5 — WISC-V Funcional

El Paso 3 y 4 originales quedaron incluidos en el Paso 1 (migración Firebase). El siguiente paso pendiente es:

- Implementar `StimulusDisplay` como componente real
- Conectar correctamente `getScaledScoreFromTable` en el subcomponente `CancellationSubtest`
- Pasar `setRawScores` y `studentAge` como props al subcomponente
- Tipar `TEST_CASES` como `Record<string, TestCaseData>`
- Eliminar los 3 silenciados remanentes

Después de Paso 5, el objetivo es llegar a **0 @ts-expect-error y 0 @ts-ignore en todo el codebase**.
