# PIGEC-130

Sistema de Evaluación Psicológica y Gestión de Expedientes Clínicos para el **CBTA 130** — bachillerato tecnológico en México.

## Qué es

PIGEC-130 es una aplicación web progresiva (PWA) que implementa el protocolo **MTSS** (Multi-Tiered System of Supports) de atención multinivel para un equipo de tres psicólogos clínicos. La app permite:

- **Tamizaje universal** — detección temprana de riesgos psicológicos en toda la población estudiantil.
- **Evaluación multinivel** — instrumentos estandarizados según el nivel de atención requerido (Nivel 1, 2 y 3).
- **Gestión de expedientes** — registros clínicos completos almacenados localmente en el iPad de cada clínico.
- **Impresión diagnóstica asistida por IA** — análisis que el clínico valida granularmente antes de incorporar al expediente.
- **Planes de intervención** — generación de planes de tratamiento y planes de intervención educativa (PIIE).
- **Reportes institucionales** — consolidados para toma de decisiones.

## Arquitectura

| Aspecto | Detalle |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Base de datos | IndexedDB (local, 100% offline) |
| IA | Google Gemini (configurable por el clínico) |
| Hosting | Vercel (plan gratuito) |
| Dispositivos | iPad (Safari — PWA) |

Los expedientes viven **exclusivamente en el dispositivo local** del clínico. No hay servidor central ni base de datos en la nube.

## Inicio rápido

```bash
# Clonar el repositorio
git clone https://github.com/Cetc2211/PIGECT.130RT.git
cd PIGECT.130RT

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
# La app estará disponible en http://localhost:9003
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 9003) |
| `npm run build` | Construcción de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Análisis estático con ESLint |
| `npm run typecheck` | Verificación de tipos con TypeScript |

## Despliegue

El despliegue automatizado utiliza `scripts/deploy.sh`:

```bash
# Vista previa (desde cualquier rama)
./scripts/deploy.sh --target=preview

# Producción (solo desde main)
./scripts/deploy.sh --target=production
```

Ver [docs/despliegue/vercel.md](docs/despliegue/vercel.md) para más detalles.

## Documentación

Toda la documentación del proyecto está organizada en `docs/`:

- [Índice de documentación](docs/README.md) — mapa completo de documentos
- [docs/arquitectura/](docs/arquitectura/) — decisiones de diseño y visión técnica
- [docs/guias/](docs/guias/) — manuales para clínicos y desarrolladores
- [docs/despliegue/](docs/despliegue/) — guías operativas de despliegue
- [docs/historico/](docs/historico/) — documentos de versiones anteriores

## Estado del proyecto

**Fase actual:** Fase 0 — Higiene y preparación del repositorio

Ver [docs/arquitectura/cronograma.md](docs/arquitectura/cronograma.md) para el plan completo por fases.

## Colaboración

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de contribuir. Reglas clave:

- Todas las tareas en ramas (`feature/`, `fix/`, `refactor/`, `docs/`).
- Commits atómicos con mensajes convencionales.
- Pull request con CI verde antes de mergear.
- Revisión de al menos un miembro del equipo.

## Equipo

Tres psicólogos clínicos del CBTA 130, con apoyo de desarrollo técnico.

## Licencia

Uso interno del CBTA 130. No redistribuir sin autorización expresa.
