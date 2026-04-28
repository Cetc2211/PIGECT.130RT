# Documentación PIGEC-130

Este directorio organiza toda la documentación técnica y operativa del proyecto. Las guías aquí reemplazan a la colección dispersa de 40+ archivos Markdown que vivían en la raíz del repositorio.

## Estructura

```
docs/
├── README.md               (este archivo)
├── arquitectura/           Decisiones de diseño y visión técnica
├── despliegue/             Guías operativas de deploy
├── guias/                  Manuales para usuarios (clínicos) y desarrolladores
└── historico/              Documentos de versiones anteriores conservados por trazabilidad
```

## Lectura recomendada por rol

### Si eres un clínico que usa la app

1. `guias/instalacion-ipad.md` — instalar la PWA
2. `guias/uso-cotidiano.md` — flujo diario: tamizaje, evaluación, validación
3. `guias/respaldo-y-restauracion.md` — proteger los expedientes
4. `guias/proveedores-ia.md` — configurar API key gratuita

### Si eres un desarrollador nuevo

1. `arquitectura/rediseno-v2.md` — por qué la app es como es
2. `arquitectura/cronograma.md` — en qué fase estamos
3. `arquitectura/capa-de-datos.md` — cómo funciona IndexedDB + repositorios
4. `arquitectura/capa-de-ia.md` — cómo funciona el provider intercambiable
5. `despliegue/vercel.md` — cómo se despliega

### Si eres un agente de IA ayudando al desarrollador

1. `arquitectura/rediseno-v2.md`
2. `arquitectura/cronograma.md`
3. `guias/prompt-agente-ia.md` — instrucciones para colaborar con coherencia

---

## Mapeo de archivos antiguos (histórico)

Los siguientes archivos que estaban en la raíz del repositorio se reubicaron o se fusionaron. Se conservan por trazabilidad, pero la documentación viva es la nueva.

| Archivo antiguo | Nueva ubicación |
|---|---|
| `API_INTEGRATION_SPECS.md` | `historico/api-integration-specs.md` |
| `BACKEND_COMPLETE_GUIDE.md` | `historico/backend-complete-guide.md` |
| `BACKEND_DEPLOYMENT_COMPLETE.md` | `historico/backend-deployment-complete.md` |
| `BACKEND_DEPLOYMENT_STATUS.md` | `historico/backend-deployment-status.md` |
| `COMPLETE_CHECKLIST_V2_3.md` | `historico/checklist-v2-3.md` |
| `CONFIGURACION_VARIABLES_ENTORNO.md` | fusionado en `despliegue/variables-entorno.md` |
| `CONFIGURAR_CLOUD_RUN_PRODUCCION.md` | `historico/cloud-run-produccion.md` (Cloud Run deprecado en v2) |
| `DEPLOYMENT_COMMAND_FINAL.md` | fusionado en `despliegue/vercel.md` |
| `DEPLOYMENT_COMPLETE_GUIDE.md` | fusionado en `despliegue/vercel.md` |
| `DEPLOYMENT_SUCCESS.md` | `historico/` |
| `DEPLOYMENT_VERIFICATION_FINAL.md` | `historico/` |
| `DEPLOY_FIX_GEMINI_1_5.md` | `historico/` |
| `DIAGNOSTICO_AI_GCP.md` | `historico/` (GCP deprecado en v2) |
| `DIAGNOSTICO_GENERAR.js` | mover a `scripts/diagnostico/` |
| `DIAGNOSTICO_SINCRONIZACION_GENERAR.js` | mover a `scripts/diagnostico/` |
| `EJECUTAR_PRUEBAS.md` | fusionado en `guias/pruebas.md` |
| `FINAL_STATUS_V2_3.md` | `historico/` |
| `FINAL_SUMMARY.txt` | `historico/` |
| `GUIA_CAMBIO_PROYECTO_FIREBASE.md` | `historico/` (Firebase deprecado en v2) |
| `GUIA_CONFIGURACION_API_KEYS.md` | fusionado en `guias/proveedores-ia.md` |
| `GUIA_CONFIGURACION_API_KEY_REAL.md` | fusionado en `guias/proveedores-ia.md` |
| `GUIA_SOLUCION_CONEXION_DB.md` | `historico/` (Firestore deprecado) |
| `GUIA_SOLUCION_DESDE_FIREBASE.md` | `historico/` |
| `IMPLEMENTACION_CLOUD_RUN.md` | `historico/` |
| `INFORME_AVANCE_V2_4.md` | `historico/informes/` |
| `INSTRUCCIONES_FINALIZAR_MIGRACION.md` | `historico/` |
| `IPAD_GOOGLE_AI_STUDIO_GUIDE.md` | fusionado en `guias/proveedores-ia.md` |
| `MAIN_PY_CHANGES_V2_3.md` | `historico/` |
| `MIGRACION.md` | `arquitectura/migracion-a-v2.md` (reescrito) |
| `PROMPTS_DOCX_GENERAR.js` | mover a `scripts/generadores/` |
| `QUICKSTART.txt` | fusionado en `README.md` principal |
| `QUICK_DEPLOY.md` | fusionado en `despliegue/vercel.md` |
| `README_DEPLOYMENT_V2_3.md` | `historico/` |
| `REGLAS_PEDAGOGICAS_IRA.md` | `guias/reglas-pedagogicas.md` (documento vivo) |
| `REPORTE_ESTADO_ACTUAL.md` | `historico/informes/` |
| `REPORTE_GESTION_V2_5.md` | `historico/informes/` |
| `REPORTE_INSTITUCIONAL_GENERAR.js` | mover a `scripts/generadores/` |
| `REPORTE_RESUMIDO.md` | `historico/informes/` |
| `SEGURIDAD_RECOMENDACIONES.md` | `arquitectura/seguridad.md` (reescrito) |
| `SETUP_CLOUD_RUN.md` | `historico/` |
| `SOLUCION_ERROR_REPORTES.md` | `historico/` |
| `START_HERE_V2_3.md` | fusionado en `README.md` principal |
| `SUMMARY_CHANGES_V2_3.md` | `historico/` |
| `TESTING_AI_INTEGRATION.md` | fusionado en `guias/pruebas.md` |
| `VERIFICACION_SECRETOS_VERCEL.md` | fusionado en `despliegue/variables-entorno.md` |

## Convenciones

- Archivos en minúsculas con guiones, no mayúsculas ni guiones bajos.
- Un solo idioma por archivo (español, excepto docs técnicos específicos).
- Cada documento abre con un encabezado H1 que describe su propósito.
- Cada documento cierra con "Última revisión: YYYY-MM-DD".
- Documentos que quedan obsoletos se marcan con `> **DEPRECADO en v2:** razón` al inicio, no se borran.
