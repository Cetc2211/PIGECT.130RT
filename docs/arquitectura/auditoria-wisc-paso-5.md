# Auditoría del Módulo WISC-V/WAIS — Estado Actual

**Fecha:** 2026-04-28
**Rama:** `redesign-v2` (commit base: `f5daa65`)
**Archivos auditados:**
- `src/components/WISC-VScoringConsole.tsx` (1916 líneas)
- `src/lib/wisc-norms.ts` (122 líneas)
- `src/lib/wisc-logic.ts` (202 líneas)
- `src/lib/mock-test-case.ts` (29 líneas)
- `src/ai/flows/wisc-report-flow.ts` (78 líneas)
- `public/stimuli/**/*.webp` (176 archivos)

---

## TAREA 1 — Inventario de Estímulos Digitalizados

### Archivos .webp por Carpeta

| Carpeta | Subtest | Archivos | Items Presentes | Items Faltantes | Tamaño Total |
|---------|---------|----------|-----------------|-----------------|--------------|
| `A/` | Aritmética | 5 | 1-5 | — | 2,816 KB |
| `B/` | Balanzas | 34 | 1-23, 25-36 | **24** | 17,224 KB |
| `C/` | Cubos | 12 | 1-11, 13 | **12** | 980 KB |
| `Ca/` | Cancelación | 3 | 1-3 | — | 9,840 KB |
| `M/` | Matrices | 31 | 1-9, 11-17, 19, 21-34 | **10, 18, 20** | 5,972 KB |
| `PV/` | Puzles Visuales | 29 | 1-5, 7-8, 10-31 | **6, 9** | 8,672 KB |
| `SV/` | Span Visual | 58 | 1-58 | — | 32,756 KB |
| `V/` | Vocabulario | 4 | 1-4 | — | 3,584 KB |

**Total: 176 archivos .webp en 8 carpetas de subtests.**

### Observaciones por Carpeta

- **`A/` (Aritmética):** Solo 5 ítems. El WISC-V tiene ~22 ítems de Aritmética; los 5 presentes probablemente son muestras o ítems de ejemplo/ensayo.
- **`B/` (Balanzas):** Falta item 24. Tiene 34 de 35 ítems declarados en el manual.
- **`C/` (Cubos):** Falta item 12. Tiene 12 de ~14 ítems del manual. Archivos muy pequeños (24-97 KB), probablemente patrones geométricos simples.
- **`Ca/` (Cancelación):** 3 archivos (láminas), corresponden a las 3 fases: Práctica, Ensayo 1 (Aleatoria), Ensayo 2 (Estructurada). Tamaño muy grande (1.3-4.3 MB) por ser láminas completas con muchos estímulos.
- **`M/` (Matrices):** Faltan items 10, 18, 20. Tiene 31 de 34 ítems del manual.
- **`PV/` (Puzles Visuales):** Faltan items 6 y 9. Tiene 29 de ~31 ítems del manual.
- **`SV/` (Span Visual):** Completo con 58 ítems. La carpeta más grande (32 MB).
- **`V/` (Vocabulario):** Solo 4 ítems. El WISC-V tiene ~34 ítems de Vocabulario con estímulo visual; los 4 presentes son muestras.

---

## TAREA 2 — Mapa de Subtests del WISC-V

### 2.1 Subtests Declarados en Código

Fuente: `subtestsByDomainWISC` (línea 108) y `subtestsByDomainWAIS` (línea 136).

#### WISC-V (15 subtests en 5 dominios)

| Dominio | ID | Nombre Clínico | renderType | es CIT | Orden | Stimulus Booklet | Opcional |
|---------|-----|----------------|-----------|--------|-------|-----------------|----------|
| ICV | S | Semejanzas | VERBAL_CRITERIO | Sí | 2 | — | No |
| ICV | V | Vocabulario | VERBAL_CRITERIO | Sí | 6 | 1 | No |
| ICV | I | Información | VERBAL_CRITERIO | No | 11 | — | Sí |
| ICV | Co | Comprensión | VERBAL_CRITERIO | No | 14 | — | Sí |
| IVE | C | Construcción con Cubos | VERBAL_CRITERIO | Sí | 1 | 1 | No |
| IVE | PV | Puzles Visuales | MULTI_CHOICE | Sí | 8 | 2 | No |
| IRF | M | Matrices | VERBAL_CRITERIO | Sí | 3 | 1 | No |
| IRF | B | Balanzas | SINGLE_CHOICE | Sí | 7 | 1 | No |
| IRF | A | Aritmética | ARITHMETIC | No | 15 | 2 | Sí |
| IMT | D | Dígitos | VERBAL_CRITERIO | Sí | 4 | — | No |
| IMT | SV | Span Visual | MULTI_CHOICE | Sí | 9 | 2 | No |
| IMT | LN | Letras y Números | LETTER_NUMBER_SEQUENCING | No | 12 | — | Sí |
| IVP | Cl | Claves | SPEED_TEST | Sí | 5 | — | No |
| IVP | BS | Búsqueda de Símbolos | SPEED_TEST | Sí | 10 | — | No |
| IVP | Ca | Cancelación | SPEED_TEST | No | 13 | — | Sí |

**Subtests CIT WISC-V (7):** S, V, C, M, B, D, Cl

#### WAIS-IV (14 subtests en 4 dominios)

| Dominio | ID | Nombre Clínico | renderType | es CIT | Opcional |
|---------|-----|----------------|-----------|--------|----------|
| ICV | S | Semejanzas | VERBAL_CRITERIO | Sí | No |
| ICV | V | Vocabulario | VERBAL_CRITERIO | Sí | No |
| ICV | I | Información | VERBAL_CRITERIO | Sí | No |
| ICV | Co | Comprensión | VERBAL_CRITERIO | No | Sí |
| IRP | C | Diseño con Cubos | VERBAL_CRITERIO | Sí | No |
| IRP | M | Matrices | VERBAL_CRITERIO | Sí | No |
| IRP | PV | Puzles Visuales | MULTI_CHOICE | Sí | No |
| IRP | B | Balanzas | SINGLE_CHOICE | No | Sí |
| IRP | FI | Figuras Incompletas | VERBAL_CRITERIO | No | Sí |
| IMT | D | Retención de Dígitos | VERBAL_CRITERIO | Sí | No |
| IMT | A | Aritmética | ARITHMETIC | Sí | No |
| IMT | LN | Sucesión de Letras y Números | LETTER_NUMBER_SEQUENCING | No | Sí |
| IVP | BS | Búsqueda de Símbolos | SPEED_TEST | Sí | No |
| IVP | Cl | Claves | SPEED_TEST | Sí | No |
| IVP | Ca | Cancelación | SPEED_TEST | No | Sí |

**Subtests CIT WAIS-IV (10):** S, V, I, C, M, PV, D, A, BS, Cl

### 2.2 Estímulos Visuales por Subtest

| ID | ¿Tiene estímulos visuales? | Carpeta .webp | Notas |
|----|---------------------------|---------------|-------|
| S | No | — | Consigna oral, el evaluador lee |
| V | Parcial | V/ (4 archivos) | Manual WISC-V tiene ~34 ítems con estímulo visual (palabra escrita). Solo 4 presentes |
| I | No | — | Consigna oral |
| Co | No | — | Consigna oral |
| C | Sí | C/ (12 archivos) | Patrones geométricos. Falta item 12 |
| PV | Sí | PV/ (29 archivos) | Rompecabezas visuales. Faltan items 6, 9 |
| M | Sí | M/ (31 archivos) | Matrices de razonamiento. Faltan 10, 18, 20 |
| B | Sí | B/ (34 archivos) | Balanzas visuales. Falta item 24 |
| A | Parcial | A/ (5 archivos) | Solo 5 ítems de ejemplo/práctica. El subtest es principalmente oral |
| D | No | — | Consigna oral (secuencias de números) |
| SV | Sí | SV/ (58 archivos) | Span Visual completo |
| LN | No | — | Consigna oral (secuencias letra-número) |
| Cl | Parcial | Sin carpeta | El estímulo es la hoja de respuestas (clave de símbolos). No hay imágenes de ítems individuales |
| BS | No | Sin carpeta | Similar a Claves, requiere hoja física |
| Ca | Sí | Ca/ (3 archivos) | Láminas de búsqueda de animales. 3 láminas (práctica + 2 ensayos) |
| FI | No | Sin carpeta | No hay estímulos digitalesizados |

### 2.3 Ítems Declarados en Código

El código **no define explícitamente** el número de ítems por subtest. El componente `SubtestApplicationConsole` usa un contador incremental (`currentItem` que inicia en 1) sin un máximo. El evaluador navega libremente con botones Anterior/Siguiente sin límite superior. No hay un array de definición de ítems con contenido, puntos de inicio, o reglas de discontinuación.

La excepción es `Cancelación (Ca)`, que tiene definidas fases explícitas en `SUBTEST_RULES` (línea 544):
- Fase 1: Práctica (sin puntaje)
- Fase 2: Ensayo 1 Aleatoria (45s timer, con puntaje)
- Fase 3: Ensayo 2 Estructurada (45s timer, con puntaje)

### 2.4 Funciones Expuestas por Módulos

#### `src/lib/wisc-norms.ts`
```
getClassification(score: number): string
getScaledScoreFromTable(subtestId: string, rawScore: number, age: string): number
getCompositeFromTable(indexId: string, sumPE: number): { pc: number, perc: number }
CLINICAL_DICTIONARY: Record<string, Record<string, string>>
SCALED_SCORE_LOOKUP: Record<string, Record<number, number>>
COMPOSITE_SCORE_LOOKUP: Record<string, Record<number, { pc: number, perc: number }>>
```

#### `src/lib/wisc-logic.ts`
```
calculateWiscProfile(rawScores: Record<string, number>, studentAge: string, studentName: string): WiscCalculationResult
WiscCalculationResult (interface exportada)
```

### 2.5 Formato de las Tablas de Baremos

Las tablas están **embebidas como constantes TypeScript** en `wisc-norms.ts`:
- `SCALED_SCORE_LOOKUP`: Diccionario `{ subtestId: { rawScore: scaledScore } }` — solo tiene pares específicos para los casos de prueba (Esteban y Sofía), no una tabla completa.
- `COMPOSITE_SCORE_LOOKUP`: Diccionario `{ indexId: { sumPE: { pc, perc } } }` — mismo enfoque, solo casos de prueba.
- `getScaledScoreFromTable`: Para `Ca` tiene rangos hardcoded (líneas 92-101). Para otros subtests, busca en `SCALED_SCORE_LOOKUP` y si no encuentra, devuelve `Math.min(19, Math.max(1, Math.round(rawScore / 3)))` (aproximación lineal sin base psicométrica).
- Las reglas de administración están **en código** (no en datos), como `calculateClinicalProfile` en el componente principal.

---

## TAREA 3 — Cruce: Subtests × Estímulos

| Subtest | ID | Ítems en Manual (aprox.) | .webp Encontrados | Items Faltantes | Estado |
|---------|-----|------------------------|-------------------|----------------|--------|
| Semejanzas | S | 23 (oral) | 0 | N/A | Sin estímulos visuales |
| Vocabulario | V | 34 (visual+oral) | 4 | 30 | Parcial |
| Información | I | 30 (oral) | 0 | N/A | Sin estímulos visuales |
| Comprensión | Co | 18 (oral) | 0 | N/A | Sin estímulos visuales |
| Cubos | C | 14 | 12 | 12 | Parcial |
| Puzles Visuales | PV | 31 | 29 | 6, 9 | Parcial |
| Matrices | M | 34 | 31 | 10, 18, 20 | Parcial |
| Balanzas | B | 35 | 34 | 24 | Parcial |
| Aritmética | A | 22 (oral) | 5 | 17+ | Parcial (solo ejemplos) |
| Dígitos | D | 30 (oral) | 0 | N/A | Sin estímulos visuales |
| Span Visual | SV | 58 | 58 | Ninguno | Completo |
| Letras y Números | LN | 20 (oral) | 0 | N/A | Sin estímulos visuales |
| Claves | Cl | 1 (hoja de clave) | 0 | N/A | Sin estímulos digitales |
| Búsqueda de Símbolos | BS | 1 (hoja) | 0 | N/A | Sin estímulos digitales |
| Cancelación | Ca | 3 láminas | 3 | Ninguno | Completo |
| Figuras Incompletas | FI | 38 | 0 | 38 | Faltan estímulos |

**Resumen:**
- **Completos (2):** SV, Ca
- **Parciales (5):** V (12%), C (86%), PV (94%), M (91%), B (97%), A (23%)
- **Sin estímulos visuales (7):** S, I, Co, D, LN, Cl, BS (correcto — son orales o requieren material físico)
- **Faltan estímulos (1):** FI (WAIS-IV only, 0%)

---

## TAREA 4 — Estado del Componente StimulusDisplay

### ¿Existe un componente StimulusDisplay?

**No existe un componente `StimulusDisplay` separado.** La referencia aparece en dos lugares:

1. **Línea 1458:** `<div>{/* StimulusDisplay: rendered from parent scope in production */}</div>` — Es un comentario JSX dentro de un div vacío. Es un placeholder que **no renderiza nada**.

2. **Dentro de `DigitalCanvasInterface` (línea 900):** Los estímulos se muestran directamente con una etiqueta `<img>`:
   ```tsx
   <img src={imagePath} alt={`Estímulo ${subtestId} - ${currentLabel}`}
        className="max-w-full max-h-full object-contain opacity-90" />
   ```
   Donde `imagePath = /stimuli/${subtestId}/item${currentSheet}.webp`.

### ¿Cómo se muestran los estímulos actualmente?

- **Subtests SPEED_TEST (Cl, BS, Ca) en modo DIGITAL:** Los estímulos se cargan como imagen de fondo en el canvas de `DigitalCanvasInterface`. La imagen se muestra con `<img>` directo y un canvas transparente encima para capturar trazos.
- **Subtests SPEED_TEST en modo FÍSICO:** No se muestran estímulos. El evaluador ingresa totales manualmente.
- **Subtests VERBAL_CRITERIO / MULTI_CHOICE / SINGLE_CHOICE / ARITHMETIC / LETTER_NUMBER_SEQUENCING:** El área de estímulo está vacía. Muestra "Consigna Oral — Lea el problema en voz alta desde el manual de aplicación" para subtests sin `stimulusBooklet`. Para subtests con `stimulusBooklet`, muestra el div placeholder vacío de la línea 1458.
- **`stimulusBooklet` no se usa funcionalmente:** Aunque se define en la configuración de subtests (ej. Cubos booklet=1, PV booklet=2), el componente `SubtestApplicationConsole` lo recibe como prop pero **nunca lo utiliza para cargar imágenes**. Solo condiciona si muestra el placeholder o el texto "Consigna Oral".

### Precarga, Lazy Loading, Error Handling

- **No hay precarga** de imágenes.
- **No hay lazy loading** (no se usa `loading="lazy"` ni `IntersectionObserver`).
- **No hay error handling** para imágenes fallidas (no hay `onError` en el `<img>`).
- La única carga de imágenes es dentro de `DigitalCanvasInterface`, que usa `<img src={imagePath}>` directo del `public/` directory.

---

## TAREA 5 — Estado de los Baremos (Tablas de Conversión)

### ¿Están las tablas de conversión natural → escalar?

**Parcialmente, y solo para 2 casos de prueba.**

El `SCALED_SCORE_LOOKUP` en `wisc-norms.ts` contiene mapeos `{ rawScore → scaledScore }` para exactamente 10 subtests, pero **cada subtest tiene solo 2 pares** (correspondientes a los casos de prueba Esteban y Sofía). Ejemplo:
```typescript
"C": { 27: 8, 58: 14 },  // Solo para rawScore 27 y 58
```

Para cualquier otro puntaje bruto, la función `getScaledScoreFromTable` cae en un **fallback lineal sin validez psicométrica**:
```typescript
return Math.min(19, Math.max(1, Math.round(rawScore / 3)));
```

### Para cuántos grupos de edad?

**Cero.** Las tablas no discriminan por edad. La función `getScaledScoreFromTable` recibe un parámetro `age` (string) pero **no lo utiliza** en ninguna parte de su lógica (excepto para `Ca` que tampoco usa edad).

### Para cuántos subtests?

10 subtests tienen entradas: C, S, M, D, Cl, V, B, PV, SV, BS. El subtest `Ca` tiene una tabla de rangos hardcoded (8 rangos). Los subtests I, Co, LN, A no tienen entradas en la tabla.

### Formato

- Constantes TypeScript embebidas (`SCALED_SCORE_LOOKUP`, `COMPOSITE_SCORE_LOOKUP`)
- No hay archivos JSON externos ni carga dinámica
- No hay tablas por rango etario

### ¿Qué pasa si faltan tablas?

- `getScaledScoreFromTable`: Devuelve la aproximación lineal `Math.round(rawScore / 3)` truncada a [1, 19]
- `getCompositeFromTable`: Devuelve `{ pc: 40 + sumPE * 1.5, perc: 1 }` (percentil siempre 1, PC arbitrario)
- No hay errores explícitos, warnings en consola, ni indicación al usuario de que el valor es aproximado

### Tablas de Índices Compuestos

`COMPOSITE_SCORE_LOOKUP` tiene entradas para 6 índices (ICV, IVE, IRF, IMT, IVP, CIT), cada uno con solo 2 pares de valores sumPE→{pc, perc} (Esteban y Sofía). El fallback produce valores arbitrarios.

---

## TAREA 6 — Estado de las Reglas de Administración

### 6.1 Inicio por Edad (Start Point)

**AUSENTE.** No hay ninguna lógica que determine el ítem de inicio según la edad del evaluado. El `currentItem` siempre empieza en 1 para todos los subtests y todas las edades. El parámetro `studentAge` solo se usa para determinar si es WISC-V o WAIS-IV (umbral: 17 años).

### 6.2 Reversa (Reverse Rule)

**AUSENTE.** No hay implementación de regla de reversa. Si el evaluado falla los primeros ítems, no hay mecanismo automático para regresar a ítems anteriores ni para ajustar el puntaje base.

### 6.3 Discontinuación (Discontinue Rule)

**AUSENTE.** No hay regla de discontinuación. El evaluador avanza y retrocede libremente sin límite. No hay detención automática después de N puntajes consecutivos de 0. No existe un `maxItems` por subtest.

### 6.4 Bonificaciones por Tiempo (Time Bonuses)

**PARCIAL — Solo para Cancelación (Ca).**

Los subtests cronometrados (`SPEED_TEST`) tienen un timer genérico que cuenta segundos, pero:
- **Claves (Cl):** Timer de 120s. No hay bonificación por tiempo — solo cuenta aciertos totales.
- **Búsqueda de Símbolos (BS):** Timer de 120s. No hay bonificación — usa `correctAnswers - incorrectAnswers`.
- **Cancelación (Ca):** Timer de 45s por lámina. La fórmula es `max(0, hits - errors)`. No hay bonificación por completar antes del tiempo.

Para subtests de velocidad individual con tiempo por ítem (Cubos, PV en ciertos ítems), el código tiene un `timeLimitConfig` (línea 1084):
```typescript
{ A: 30, PV: 30, B: 20, FI: 20 }
```
Pero estos valores solo generan un `alert()` cuando se excede el tiempo, y automáticamente asigna puntuación 0 si no es SPEED_TEST. No hay bonificación por finalizar rápido.

### 6.5 Resumen por Regla

| Regla | Estado | Detalle |
|-------|--------|---------|
| Inicio por edad | AUSENTE | currentItem siempre inicia en 1 |
| Reversa | AUSENTE | No hay retroceso automático |
| Discontinuación | AUSENTE | No hay límite de ítems ni parada automática |
| Bonificación por tiempo | PARCIAL | Solo timer con alerta en Ca. Sin bonificación real en ningún subtest |
| Time limits (Cubos, PV, B, FI) | PARCIAL | Config definida (A:30, PV:30, B:20, FI:20) pero solo genera alert, no bonifica |

---

## TAREA 7 — Estado de los Cronómetros

### APIs Utilizadas

| Ubicación | API | Uso |
|-----------|-----|-----|
| `SpeedTimer` (línea 23) | `setInterval` | Cuenta regresiva de 1s para subtests SPEED_TEST en modo físico |
| `SubtestApplicationConsole` (línea 1081) | `setInterval` | Cronómetro ascendente para todos los subtests |
| `DigitalCanvasInterface` (línea 632) | `setTimeout` | Delay de 2s entre láminas de Cancelación |

### Manejo de visibilitychange

**AUSENTE.** No hay ningún listener de `visibilitychange`, `document.hidden`, `pagehide` o `pageshow`. Si el iPad bloquea la pantalla durante una prueba (evento común), el timer seguirá corriendo en segundo plano pero el `setInterval` puede ser throttleado por el navegador, causando desincronización.

### Almacenamiento de Tiempos

- **Por subtest (total):** El timer muestra segundos transcurridos (`timer` state) pero **no se guarda** al cambiar de ítem o al cerrar el componente. El estado `timer` se resetea a 0 en `handleNextItem` y `handlePrevItem`.
- **Por ítem:** No se guarda tiempo por ítem. No hay un array o mapa de tiempos individuales.
- **Persistencia:** Ningún tiempo se persiste en localStorage. Solo las puntuaciones y el ítem actual se guardan.

### Riesgos Identificados

1. El `setInterval` del cronómetro ascendente (línea 1081) no se pausa cuando la pestaña pierde foco. Esto genera mediciones incorrectas si el evaluador cambia de pestaña o si la pantalla se bloquea.
2. El cronómetro de `SpeedTimer` usa `setInterval` que se acumula drift a largo plazo, aunque es aceptable para pruebas de 120s.
3. No hay audio de advertencia al expirar el tiempo en el cronómetro ascendente (a diferencia de `SpeedTimer` que sí usa `playBeep()`).

---

## ANÁLISIS DE @ts-expect-error / @ts-ignore PENDIENTES

Se encontraron 4 instancias de supresores de TypeScript en el módulo WISC-V:

| Línea | Tipo | Razón | Marco de Paso |
|-------|------|-------|---------------|
| 1388-1389 | `@ts-expect-error` | `getScaledScoreFromTable` referenciado sin importar en scope de subcomponente | Paso 5 |
| 1399-1400 | `@ts-expect-error` | `setRawScores` referenciado sin pasar como prop al subcomponente | Paso 5 |
| 1625 | `@ts-ignore` | `TEST_CASES` indexado con string sin tipado adecuado | Paso 5 |

Todos están marcados con `// TODO(Paso 5)` o `// Paso 5:` en los comentarios, confirmando que son deuda técnica planificada para esta fase.

---

## RESUMEN DE ARCHIVOS

### Código

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `WISC-VScoringConsole.tsx` | 1916 | Componente principal: consola de aplicación, UI de subtests, cálculos de perfil clínico, generación de PDF |
| `wisc-norms.ts` | 122 | Baremos simplificados (mock), clasificación, diccionario clínico |
| `wisc-logic.ts` | 202 | Motor de cálculo de perfil WISC (índices, discrepancias, fortalezas/debilidades) |
| `mock-test-case.ts` | 29 | 2 casos de prueba golden (Esteban, Sofía) |
| `wisc-report-flow.ts` | 78 | Flujo de IA para generación de informe narrativo |
| `WiscProfileChart.tsx` | (no auditado) | Gráfico de perfil |
| `WiscReportDocument.tsx` | (no auditado) | Plantilla de reporte PDF |

### Estímulos

| Carpeta | Archivos | Tamaño |
|---------|----------|--------|
| `public/stimuli/` | 176 .webp | ~81.6 MB |
