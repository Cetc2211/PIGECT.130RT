# Decisiones Técnicas — Paso 1: Migración Firebase → IndexedDB

## Estado: ✅ Completado
**Fecha:** 2026-04-25
**Commits:** `bec7e49`, `e2ae054`, `b16bdab`, `f32a2c0`, `2551272`
**Rama:** `redesign-v2`

---

## 1. Por qué no se introdujo Dexie (idb-keyval ya estaba en uso)

El proyecto ya utilizaba `idb-keyval` como wrapper de IndexedDB antes de la migración. La capa de almacenamiento existente en `src/lib/storage-local.ts` consumía directamente `get`, `set`, `del` y `clear` de idb-keyval para persistir grupos, estudiantes, observaciones, datos parciales y configuración.

Introducir Dexie habría implicado:
- Reescribir toda la capa de persistencia existente (20+ funciones en storage-local.ts)
- Agregar una dependencia pesada (~30KB gzipped) para funcionalidad que idb-keyval ya cubre
- Añadir complejidad de esquemas y migraciones de versiones que no se necesitan en una app local-only

La decisión fue mantener idb-keyval y crear una capa de abstracción thin (`src/lib/storage/`) con repositorios tipados que usan las mismas claves IDB ya existentes en el código. Esto minimizó el riesgo de regressión durante la migración.

---

## 2. Por qué login se hace con bcrypt local

En la arquitectura anterior, la autenticación usaba Firebase Auth (email + password contra los servidores de Google). Al eliminar Firebase, se necesitaba un mecanismo de autenticación que funcionara completamente offline.

Se implementó autenticación local en `src/lib/local-access.ts`:

1. **Registro (signup):** El especialista ingresa email, nombre, contraseña y código institucional. La contraseña se hashea con `bcryptjs` (`hashPassword()`) y se almacena junto al perfil en localStorage.

2. **Login:** Se verifican las credenciales contra el perfil almacenado localmente (`verifyPassword()` usando `bcrypt.compare()`).

3. **Sesión:** Se mantiene un flag `hasLocalAccessProfile()` que verifica la existencia del perfil sin necesidad de re-autenticar en cada reload.

**Limitaciones aceptadas:**
- No hay recuperación de contraseña por email (se recuperará vía respaldo .pigec en Fase 2).
- No hay autenticación multi-dispositivo (cada dispositivo tiene su propio localStorage).
- No hay roles diferenciados en este momento (un solo perfil de especialista por dispositivo).

La elección de bcrypt sobre alternativas (SHA-256 puro, PBKDF2) se debe a que bcryptjs es una implementación probada de bcrypt optimizada para navegadores, con salting automático y resistencia a ataques de fuerza bruta.

---

## 3. Por qué se eliminaron las API routes (api/report-absences, api/vincular)

### `api/report-absences/route.ts`
Esta ruta generaba reportes de inasistencias y los enviaba por WhatsApp usando la API de Twilio/WhatsApp Business. Dependía de Firebase Firestore para leer datos de estudiantes y su configuración de contacto.

**Razón de eliminación:** Con la migración a almacenamiento 100% local, los datos de estudiantes ya no están disponibles en Firestore. La ruta no puede funcionar sin Firebase. Además, la funcionalidad de envío de WhatsApp por servidor será rediseñada en fases posteriores con un enfoque que respete la arquitectura local-first.

### `api/vincular/route.ts`
Esta ruta vinculaba expedientes de estudiantes entre diferentes sesiones de evaluación, permitiendo que un evaluador compartiera resultados con el clínico principal.

**Razón de eliminación:** La vinculación presupone un backend centralizado donde múltiples usuarios comparten datos. En la arquitectura local-only, cada clínico maneja sus propios expedientes. La funcionalidad se reemplaza por el flujo de importar/exportar expedientes vía códigos PIGEC-WA1 (WhatsApp bridge offline), que ya existe y funciona sin servidor.

---

## 4. Funcionalidad pérdida y cuándo se recupera

### Recuperación de contraseña
- **Estado actual:** No aplica. No hay recuperación de contraseña porque no hay un servidor que envíe emails.
- **Recuperación en Fase 2:** Se implementará mediante el sistema de respaldo/restauración. Si el especialista pierde acceso, podrá:
  1. Exportar un respaldo `.pigec` (ya funciona en settings).
  2. Reinstalar la app y crear un nuevo perfil.
  3. Importar el respaldo para restaurar todos los datos.
- **Nota:** La contraseña local solo protege el acceso al dispositivo. No es una contraseña "de cuenta" en la nube.

### Vinculación de expedientes entre evaluadores
- **Estado actual:** Eliminada. Ya no hay vinculación servidor-a-servidor.
- **Alternativa existente:** El flujo de códigos PIGEC-WA1 permite que un evaluador externo genere un código de resultados desde la página de evaluación (`/evaluacion/[tokenId]`), lo envíe por WhatsApp al clínico, y este lo importe en su expediente local (`/expedientes`).
- **Mejora futura:** En Fase 3+ se podría explorar WebRTC o Web Share API para transferencias directas peer-to-peer sin servidor.

### Sincronización entre dispositivos
- **Estado actual:** Eliminada. No hay sincronización con la nube.
- **Alternativa existente:** Exportar/importar datos completos desde settings (formato JSON).
- **Mejora futura:** Podría implementarse sincronización vía archivo compartido (Google Drive, Dropbox) o WebRTC en fases posteriores.

### Datos públicos para tutores
- **Estado actual:** La vista de tutor (`/tutor`) funcionaba leyendo datos públicos desde Firestore. Ahora usa datos locales.
- **Impacto:** Los tutores solo pueden ver datos si acceden desde el mismo dispositivo del especialista.
- **Alternativa:** Exportar reportes como PDF para compartir manualmente con tutores.

---

## 5. Política de commits para Pasos siguientes

A partir del Paso 1, se establece la siguiente política para evitar la pérdida de trabajo:

### 5.1 Push inmediato después de cada commit
```
git commit -m "mensaje"
git push origin redesign-v2
```
**Nunca** acumular más de 1 commit local sin hacer push. Si el push falla, detenerse y reportar.

### 5.2 Verificación con git ls-remote
Después de cada push, ejecutar:
```
git ls-remote origin refs/heads/redesign-v2
```
El hash devuelto DEBE coincidir con `git rev-parse HEAD`. Si no coincide, el push no se completó correctamente.

### 5.3 Commits atómicos y descriptivos
Cada commit debe ser una unidad lógica de cambio que:
- Pasa typecheck de forma independiente
- Tiene un mensaje descriptivo con prefijo (feat, fix, refactor, docs, chore)
- Puede revertirse sin romper los commits anteriores

### 5.4 No usar `--force`
Jamás hacer `git push --force`. Si hay divergencia, hacer `git pull --rebase` o reportar para resolver manualmente.

### 5.5 Verificación pre-commit
Antes de cada commit, ejecutar:
```
npx tsc --noEmit 2>&1 | grep -c "error TS"
```
Si el conteo de errores INCREMENTA respecto al commit anterior, revisar antes de commitear. Reducir errores está bien; incrementarlos requiere justificación.

---

## Referencia de archivos clave

| Archivo | Rol |
|---------|-----|
| `src/lib/storage/` | Nueva capa de abstracción local |
| `src/lib/storage-local.ts` | Capa de persistencia original (preservada) |
| `src/lib/local-access.ts` | Autenticación local con bcrypt |
| `src/hooks/use-data.tsx` | Hook principal de datos (migrado a local-only) |
| `docs/arquitectura/migracion-firebase-completada.md` | Documentación de la migración |
