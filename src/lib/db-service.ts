// ============================================================================
// PIGEC-130 — Servicio de Persistencia Unificado (IndexedDB)
// ============================================================================
// Capa centralizada que reemplaza todas las llamadas dispersas a localStorage
// y Firestore. Utiliza IndexedDB nativo para almacenamiento estructurado con
// indices, transacciones ACID, y capacidad de almacenamiento significativa.
//
// USO:
//   import { db } from '@/lib/db-service';
//   await db.expedientes.getAll();
//   await db.expedientes.getById('exp-001');
//   await db.expedientes.save(expediente);
//   await db.expedientes.delete('exp-001');
//   await db.expedientes.getByIndex('studentId', 'S001');
// ============================================================================

import type {
  Expediente,
  EvaluacionRegistro,
  NotaExpediente,
  ClinicalAssessment,
  FunctionalAnalysis,
  SOAPNote,
  TreatmentPlan,
  ProgressRecord,
  SafetyPlan,
  WiscProfile,
  PIEIPlan,
  PIEIFeedback,
  EducationalAssessment,
  ImpresionDiagnostica,
  AppConfiguration,
  EvaluacionSesion,
  TestResultImport,
  ClinicalAlert,
  BackupSnapshot,
} from './db-types';

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const DB_NAME = 'pigec-130-clinico';
const DB_VERSION = 1;

// Nombres de object stores (tablas)
const STORES = {
  EXPEDIENTES: 'expedientes',
  CLINICAL_ASSESSMENTS: 'clinical_assessments',
  FUNCTIONAL_ANALYSES: 'functional_analyses',
  SOAP_NOTES: 'soap_notes',
  TREATMENT_PLANS: 'treatment_plans',
  PROGRESS_RECORDS: 'progress_records',
  SAFETY_PLANS: 'safety_plans',
  WISC_PROFILES: 'wisc_profiles',
  PIEI_PLANS: 'piei_plans',
  PIEI_FEEDBACKS: 'piei_feedbacks',
  EDUCATIONAL_ASSESSMENTS: 'educational_assessments',
  IMPRESIONES_DIAGNOSTICAS: 'impresiones_diagnosticas',
  SESIONES_EVAL: 'sesiones_evaluacion',
  CONFIGURACION: 'configuracion',
  TEST_RESULT_IMPORTS: 'test_result_imports',
  CLINICAL_ALERTS: 'clinical_alerts',
} as const;

// ─── HELPER: Verificar entorno navegador ────────────────────────────────────

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

// ─── HELPER: Generador de IDs ───────────────────────────────────────────────

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── CLASE BASE: Repositorio Generico ───────────────────────────────────────

/**
 * Repositorio base con operaciones CRUD tipadas para un object store de IDB.
 * Soporta: getAll, getById, save (upsert), delete, getByIndex, count,
 * y operaciones de busqueda con filtros simples.
 */
// Alias para AppConfiguration que tiene `clave` como keyPath en vez de `id`
interface ConfigWithId extends AppConfiguration {
  id: string; // Alias de `clave` — se mapea en el repository
}

class BaseRepository<T extends { id: string }> {
  private storeName: string;
  private dbPromise: Promise<IDBDatabase>;

  constructor(storeName: string, dbPromise: Promise<IDBDatabase>) {
    this.storeName = storeName;
    this.dbPromise = dbPromise;
  }

  /** Obtiene una referencia transaccion al object store (modo read o readwrite) */
  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.dbPromise;
    const tx = db.transaction(this.storeName, mode);
    return tx.objectStore(this.storeName);
  }

  /** Obtiene todos los registros del store */
  async getAll(): Promise<T[]> {
    if (!isBrowser()) return [];
    try {
      const store = await this.getStore();
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      console.warn(`[DB] Error al leer ${this.storeName}`);
      return [];
    }
  }

  /** Obtiene un registro por ID */
  async getById(id: string): Promise<T | undefined> {
    if (!isBrowser()) return undefined;
    try {
      const store = await this.getStore();
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return undefined;
    }
  }

  /** Guarda (inserta o actualiza) un registro */
  async save(record: T): Promise<T> {
    if (!isBrowser()) return record;
    try {
      const store = await this.getStore('readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(record);
        request.onsuccess = () => resolve(record);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[DB] Error al guardar en ${this.storeName}:`, error);
      return record;
    }
  }

  /** Guarda multiples registros en una sola transaccion */
  async saveMany(records: T[]): Promise<T[]> {
    if (!isBrowser()) return records;
    if (!records.length) return records;
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      for (const record of records) {
        store.put(record);
      }

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(records);
        tx.onerror = () => {
          console.error(`[DB] Error al guardar batch en ${this.storeName}:`, tx.error);
          reject(tx.error);
        };
      });
    } catch (error) {
      console.error(`[DB] Error en saveMany ${this.storeName}:`, error);
      return records;
    }
  }

  /** Elimina un registro por ID */
  async delete(id: string): Promise<boolean> {
    if (!isBrowser()) return false;
    try {
      const store = await this.getStore('readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error(`[DB] Error al eliminar de ${this.storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch {
      return false;
    }
  }

  /** Elimina todos los registros del store */
  async clear(): Promise<boolean> {
    if (!isBrowser()) return false;
    try {
      const store = await this.getStore('readwrite');
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return false;
    }
  }

  /** Busca registros por indice */
  async getByIndex(indexName: string, value: string | number): Promise<T[]> {
    if (!isBrowser()) return [];
    try {
      const store = await this.getStore();
      const index = store.index(indexName);
      return new Promise((resolve, reject) => {
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      console.warn(`[DB] Error en getByIndex ${this.storeName}.${indexName}`);
      return [];
    }
  }

  /** Obtiene un solo registro por indice (el primero) */
  async getOneByIndex(indexName: string, value: string | number): Promise<T | undefined> {
    const results = await this.getByIndex(indexName, value);
    return results[0];
  }

  /** Cuenta los registros del store */
  async count(): Promise<number> {
    if (!isBrowser()) return 0;
    try {
      const store = await this.getStore();
      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return 0;
    }
  }

  /** Filtra registros en memoria con predicado */
  async filter(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(predicate);
  }

  /** Genera un ID con prefijo */
  newId(prefix: string = 'id'): string {
    return generateId(prefix);
  }
}

// ─── CONFIGURACION DE SCHEMA (onupgradeneeded) ──────────────────────────────

/**
 * Define la estructura completa de la base de datos IndexedDB.
 * Se ejecuta una sola vez al abrir la DB por primera vez, o cuando
 * se incrementa DB_VERSION.
 */
function createSchema(db: IDBDatabase): void {
  // ─── EXPEDIENTES ───────────────────────────────────────────────────────
  const expedientes = db.createObjectStore(STORES.EXPEDIENTES, { keyPath: 'id' });
  expedientes.createIndex('studentId', 'studentId', { unique: false });
  expedientes.createIndex('estado', 'estado', { unique: false });
  expedientes.createIndex('nivel', 'nivel', { unique: false });
  expedientes.createIndex('grupoName', 'groupName', { unique: false });

  // ─── EVALUACIONES CLINICAS ────────────────────────────────────────────
  const clinical = db.createObjectStore(STORES.CLINICAL_ASSESSMENTS, { keyPath: 'id' });
  clinical.createIndex('expedienteId', 'expedienteId', { unique: false });
  clinical.createIndex('studentId', 'studentId', { unique: false });
  clinical.createIndex('fecha', 'fecha_evaluacion', { unique: false });

  // ─── ANALISIS FUNCIONALES ─────────────────────────────────────────────
  const funcional = db.createObjectStore(STORES.FUNCTIONAL_ANALYSES, { keyPath: 'id' });
  funcional.createIndex('expedienteId', 'expedienteId', { unique: false });
  funcional.createIndex('studentId', 'studentId', { unique: false });
  funcional.createIndex('fecha', 'fecha_sesion', { unique: false });

  // ─── NOTAS SOAP ───────────────────────────────────────────────────────
  const soap = db.createObjectStore(STORES.SOAP_NOTES, { keyPath: 'id' });
  soap.createIndex('expedienteId', 'expedienteId', { unique: false });
  soap.createIndex('studentId', 'studentId', { unique: false });
  soap.createIndex('fecha', 'createdAt', { unique: false });

  // ─── PLANES DE TRATAMIENTO ────────────────────────────────────────────
  const tratamientos = db.createObjectStore(STORES.TREATMENT_PLANS, { keyPath: 'id' });
  tratamientos.createIndex('expedienteId', 'expedienteId', { unique: false });
  tratamientos.createIndex('studentId', 'studentId', { unique: false });
  tratamientos.createIndex('fecha', 'fecha_aprobacion', { unique: false });

  // ─── REGISTROS DE SEGUIMIENTO ────────────────────────────────────────
  const seguimiento = db.createObjectStore(STORES.PROGRESS_RECORDS, { keyPath: 'id' });
  seguimiento.createIndex('expedienteId', 'expedienteId', { unique: false });
  seguimiento.createIndex('studentId', 'studentId', { unique: false });
  seguimiento.createIndex('semana', 'semana_numero', { unique: false });

  // ─── PLANES DE SEGURIDAD ──────────────────────────────────────────────
  const seguridad = db.createObjectStore(STORES.SAFETY_PLANS, { keyPath: 'id' });
  seguridad.createIndex('expedienteId', 'expedienteId', { unique: false });
  seguridad.createIndex('studentId', 'studentId', { unique: false });

  // ─── PERFILES WISC ────────────────────────────────────────────────────
  const wisc = db.createObjectStore(STORES.WISC_PROFILES, { keyPath: 'id' });
  wisc.createIndex('expedienteId', 'expedienteId', { unique: false });
  wisc.createIndex('studentId', 'studentId', { unique: false });
  wisc.createIndex('fecha', 'fecha_aplicacion', { unique: false });

  // ─── PLANES PIEI ──────────────────────────────────────────────────────
  const piei = db.createObjectStore(STORES.PIEI_PLANS, { keyPath: 'id' });
  piei.createIndex('expedienteId', 'expedienteId', { unique: false });
  piei.createIndex('studentId', 'studentId', { unique: false });

  // ─── FEEDBACKS PIEI ───────────────────────────────────────────────────
  const pieiFb = db.createObjectStore(STORES.PIEI_FEEDBACKS, { keyPath: 'id' });
  pieiFb.createIndex('expedienteId', 'expedienteId', { unique: false });
  pieiFb.createIndex('studentId', 'studentId', { unique: false });

  // ─── EVALUACIONES EDUCATIVAS ─────────────────────────────────────────
  const eduEval = db.createObjectStore(STORES.EDUCATIONAL_ASSESSMENTS, { keyPath: 'id' });
  eduEval.createIndex('expedienteId', 'expedienteId', { unique: false });
  eduEval.createIndex('studentId', 'studentId', { unique: false });

  // ─── IMPRESIONES DIAGNOSTICAS ─────────────────────────────────────────
  const diagnosticas = db.createObjectStore(STORES.IMPRESIONES_DIAGNOSTICAS, { keyPath: 'id' });
  diagnosticas.createIndex('expedienteId', 'expedienteId', { unique: false });
  diagnosticas.createIndex('studentId', 'studentId', { unique: false });
  diagnosticas.createIndex('fecha', 'fecha_generacion', { unique: false });

  // ─── SESIONES DE EVALUACION ──────────────────────────────────────────
  const sesiones = db.createObjectStore(STORES.SESIONES_EVAL, { keyPath: 'id' });
  sesiones.createIndex('estado', 'estado', { unique: false });
  sesiones.createIndex('tokenId', 'tokenId', { unique: false });

  // ─── CONFIGURACION ───────────────────────────────────────────────────
  const config = db.createObjectStore(STORES.CONFIGURACION, { keyPath: 'clave' });

  // ─── TEST RESULT IMPORTS ─────────────────────────────────────────────
  const testImports = db.createObjectStore(STORES.TEST_RESULT_IMPORTS, { keyPath: 'id' });
  testImports.createIndex('expedienteId', 'expedienteId', { unique: false });
  testImports.createIndex('studentId', 'studentId', { unique: false });
  testImports.createIndex('testType', 'testType', { unique: false });
  testImports.createIndex('fecha', 'date', { unique: false });

  // ─── CLINICAL ALERTS ─────────────────────────────────────────────────
  const alerts = db.createObjectStore(STORES.CLINICAL_ALERTS, { keyPath: 'id' });
  alerts.createIndex('expedienteId', 'expedienteId', { unique: false });
  alerts.createIndex('studentId', 'studentId', { unique: false });
  alerts.createIndex('revisada', 'revisada', { unique: false });
}

// ─── INICIALIZACION DE LA BASE DE DATOS ────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    // During SSR, return a promise that never resolves — prevents
    // unhandled rejection errors. Client-side code will create a new
    // real promise via the cached dbPromise on first browser access.
    return new Promise(() => {});
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      createSchema(db);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[DB] Error al abrir IndexedDB:', request.error);
      dbPromise = null; // Permitir reintento
      reject(request.error);
    };
  });

  return dbPromise;
}

// ─── INSTANCIAS DE REPOSITORIOS ─────────────────────────────────────────────

// Se crean de manera diferida para no lanzar errores durante SSR (Next.js)

const repositorios = {
  get expedientes() {
    return new BaseRepository<Expediente>(STORES.EXPEDIENTES, getDB());
  },
  get clinicalAssessments() {
    return new BaseRepository<ClinicalAssessment>(STORES.CLINICAL_ASSESSMENTS, getDB());
  },
  get functionalAnalyses() {
    return new BaseRepository<FunctionalAnalysis>(STORES.FUNCTIONAL_ANALYSES, getDB());
  },
  get soapNotes() {
    return new BaseRepository<SOAPNote>(STORES.SOAP_NOTES, getDB());
  },
  get treatmentPlans() {
    return new BaseRepository<TreatmentPlan>(STORES.TREATMENT_PLANS, getDB());
  },
  get progressRecords() {
    return new BaseRepository<ProgressRecord>(STORES.PROGRESS_RECORDS, getDB());
  },
  get safetyPlans() {
    return new BaseRepository<SafetyPlan>(STORES.SAFETY_PLANS, getDB());
  },
  get wiscProfiles() {
    return new BaseRepository<WiscProfile>(STORES.WISC_PROFILES, getDB());
  },
  get pieiPlans() {
    return new BaseRepository<PIEIPlan>(STORES.PIEI_PLANS, getDB());
  },
  get pieiFeedbacks() {
    return new BaseRepository<PIEIFeedback>(STORES.PIEI_FEEDBACKS, getDB());
  },
  get educationalAssessments() {
    return new BaseRepository<EducationalAssessment>(STORES.EDUCATIONAL_ASSESSMENTS, getDB());
  },
  get impresionesDiagnosticas() {
    return new BaseRepository<ImpresionDiagnostica>(STORES.IMPRESIONES_DIAGNOSTICAS, getDB());
  },
  get sesionesEval() {
    return new BaseRepository<EvaluacionSesion>(STORES.SESIONES_EVAL, getDB());
  },
  get configuracion() {
    return new BaseRepository<ConfigWithId>(STORES.CONFIGURACION, getDB());
  },
  get testResultImports() {
    return new BaseRepository<TestResultImport>(STORES.TEST_RESULT_IMPORTS, getDB());
  },
  get clinicalAlerts() {
    return new BaseRepository<ClinicalAlert>(STORES.CLINICAL_ALERTS, getDB());
  },
};

// ─── FUNCIONES DE ALTO NIVEL ────────────────────────────────────────────────

/**
 * Obtiene TODOS los datos de un expediente (expediente + todas sus sub-entidades).
 * Es la funcion principal para cargar la vista completa de un expediente.
 */
async function getExpedienteCompleto(expedienteId: string): Promise<{
  expediente: Expediente | undefined;
  clinicalAssessments: ClinicalAssessment[];
  functionalAnalyses: FunctionalAnalysis[];
  soapNotes: SOAPNote[];
  treatmentPlans: TreatmentPlan[];
  progressRecords: ProgressRecord[];
  safetyPlans: SafetyPlan[];
  wiscProfiles: WiscProfile[];
  pieiPlans: PIEIPlan[];
  pieiFeedbacks: PIEIFeedback[];
  educationalAssessments: EducationalAssessment[];
  impresionesDiagnosticas: ImpresionDiagnostica[];
  clinicalAlerts: ClinicalAlert[];
  testResultImports: TestResultImport[];
}> {
  const expediente = await repositorios.expedientes.getById(expedienteId);

  if (!expediente) {
    return {
      expediente: undefined,
      clinicalAssessments: [],
      functionalAnalyses: [],
      soapNotes: [],
      treatmentPlans: [],
      progressRecords: [],
      safetyPlans: [],
      wiscProfiles: [],
      pieiPlans: [],
      pieiFeedbacks: [],
      educationalAssessments: [],
      impresionesDiagnosticas: [],
      clinicalAlerts: [],
      testResultImports: [],
    };
  }

  // Buscar tambien por studentId como fallback (compatibilidad)
  const studentId = expediente.studentId;

  const [
    clinicalAssessments,
    functionalAnalyses,
    soapNotes,
    treatmentPlans,
    progressRecords,
    safetyPlans,
    wiscProfiles,
    pieiPlans,
    pieiFeedbacks,
    educationalAssessments,
    impresionesDiagnosticas,
    clinicalAlerts,
    testResultImports,
  ] = await Promise.all([
    repositorios.clinicalAssessments.getByIndex('expedienteId', expedienteId),
    repositorios.functionalAnalyses.getByIndex('expedienteId', expedienteId),
    repositorios.soapNotes.getByIndex('expedienteId', expedienteId),
    repositorios.treatmentPlans.getByIndex('expedienteId', expedienteId),
    repositorios.progressRecords.getByIndex('expedienteId', expedienteId),
    repositorios.safetyPlans.getByIndex('expedienteId', expedienteId),
    repositorios.wiscProfiles.getByIndex('expedienteId', expedienteId),
    repositorios.pieiPlans.getByIndex('expedienteId', expedienteId),
    repositorios.pieiFeedbacks.getByIndex('expedienteId', expedienteId),
    repositorios.educationalAssessments.getByIndex('expedienteId', expedienteId),
    repositorios.impresionesDiagnosticas.getByIndex('expedienteId', expedienteId),
    repositorios.clinicalAlerts.filter(a => !a.revisada),
    repositorios.testResultImports.getByIndex('expedienteId', expedienteId),
  ]);

  // Ordenar por fecha descendente
  const sortByDateDesc = (a: { fecha?: string; createdAt?: string; fecha_evaluacion?: string; fecha_sesion?: string; fecha_aprobacion?: string; fecha_generacion?: string; fecha_registro?: string }, b: typeof a) => {
    const dateA = a.fecha || a.createdAt || a.fecha_evaluacion || a.fecha_sesion || a.fecha_aprobacion || a.fecha_generacion || a.fecha_registro || '';
    const dateB = b.fecha || b.createdAt || b.fecha_evaluacion || b.fecha_sesion || b.fecha_aprobacion || b.fecha_generacion || b.fecha_registro || '';
    return dateB.localeCompare(dateA);
  };

  return {
    expediente,
    clinicalAssessments: clinicalAssessments.sort(sortByDateDesc as any),
    functionalAnalyses: functionalAnalyses.sort(sortByDateDesc as any),
    soapNotes: soapNotes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    treatmentPlans: treatmentPlans.sort(sortByDateDesc as any),
    progressRecords: progressRecords.sort((a, b) => a.semana_numero - b.semana_numero),
    safetyPlans: safetyPlans.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    wiscProfiles: wiscProfiles.sort(sortByDateDesc as any),
    pieiPlans: pieiPlans.sort((a, b) => (b.approved_at || '').localeCompare(a.approved_at || '')),
    pieiFeedbacks: pieiFeedbacks.sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || '')),
    educationalAssessments: educationalAssessments.sort(sortByDateDesc as any),
    impresionesDiagnosticas: impresionesDiagnosticas.sort(sortByDateDesc as any),
    clinicalAlerts: clinicalAlerts.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')),
    testResultImports: testResultImports.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
  };
}

/**
 * Elimina TODOS los datos de un expediente y todas sus sub-entidades asociadas.
 * Usar con precaucion.
 */
async function deleteExpedienteCompleto(expedienteId: string): Promise<void> {
  const data = await getExpedienteCompleto(expedienteId);
  if (!data.expediente) return;

  await Promise.all([
    repositorios.expedientes.delete(expedienteId),
    ...data.clinicalAssessments.map(a => repositorios.clinicalAssessments.delete(a.id)),
    ...data.functionalAnalyses.map(a => repositorios.functionalAnalyses.delete(a.id)),
    ...data.soapNotes.map(a => repositorios.soapNotes.delete(a.id)),
    ...data.treatmentPlans.map(a => repositorios.treatmentPlans.delete(a.id)),
    ...data.progressRecords.map(a => repositorios.progressRecords.delete(a.id)),
    ...data.safetyPlans.map(a => repositorios.safetyPlans.delete(a.id)),
    ...data.wiscProfiles.map(a => repositorios.wiscProfiles.delete(a.id)),
    ...data.pieiPlans.map(a => repositorios.pieiPlans.delete(a.id)),
    ...data.pieiFeedbacks.map(a => repositorios.pieiFeedbacks.delete(a.id)),
    ...data.educationalAssessments.map(a => repositorios.educationalAssessments.delete(a.id)),
    ...data.impresionesDiagnosticas.map(a => repositorios.impresionesDiagnosticas.delete(a.id)),
    ...data.clinicalAlerts.map(a => repositorios.clinicalAlerts.delete(a.id)),
    ...data.testResultImports.map(a => repositorios.testResultImports.delete(a.id)),
  ]);
}

/**
 * Genera un respaldo completo de todos los datos almacenados.
 */
async function generateBackup(especialistaName: string): Promise<BackupSnapshot> {
  const [
    expedientes,
    clinicalAssessments,
    functionalAnalyses,
    soapNotes,
    treatmentPlans,
    progressRecords,
    safetyPlans,
    wiscProfiles,
    pieiPlans,
    pieiFeedbacks,
    educationalAssessments,
    impresionesDiagnosticas,
    sesionesEval,
    configuracion,
  ] = await Promise.all([
    repositorios.expedientes.getAll(),
    repositorios.clinicalAssessments.getAll(),
    repositorios.functionalAnalyses.getAll(),
    repositorios.soapNotes.getAll(),
    repositorios.treatmentPlans.getAll(),
    repositorios.progressRecords.getAll(),
    repositorios.safetyPlans.getAll(),
    repositorios.wiscProfiles.getAll(),
    repositorios.pieiPlans.getAll(),
    repositorios.pieiFeedbacks.getAll(),
    repositorios.educationalAssessments.getAll(),
    repositorios.impresionesDiagnosticas.getAll(),
    repositorios.sesionesEval.getAll(),
    repositorios.configuracion.getAll(),
  ]);

  return {
    version: '1.0.0',
    fecha_respaldo: new Date().toISOString(),
    especialista: especialistaName,
    expedientes,
    evaluaciones_clinicas: clinicalAssessments,
    analisis_funcionales: functionalAnalyses,
    notas_soap: soapNotes,
    planes_tratamiento: treatmentPlans,
    registros_seguimiento: progressRecords,
    planes_seguridad: safetyPlans,
    perfiles_wisc: wiscProfiles,
    planes_piei: pieiPlans,
    feedbacks_piei: pieiFeedbacks,
    evaluaciones_educativas: educationalAssessments,
    impresiones_diagnosticas: impresionesDiagnosticas,
    sesiones_evaluacion: sesionesEval,
    configuracion: configuracion,
  };
}

/**
 * Restaura datos desde un archivo de respaldo.
 * modo 'reemplazar': elimina todo y carga desde respaldo
 * modo 'fusionar': agrega nuevos registros sin sobreescribir existentes
 */
async function restoreBackup(snapshot: BackupSnapshot, modo: 'reemplazar' | 'fusionar' = 'fusionar'): Promise<void> {
  if (modo === 'reemplazar') {
    await clearAllData();
  }

  if (snapshot.expedientes?.length) {
    await repositorios.expedientes.saveMany(snapshot.expedientes);
  }
  if (snapshot.evaluaciones_clinicas?.length) {
    await repositorios.clinicalAssessments.saveMany(snapshot.evaluaciones_clinicas);
  }
  if (snapshot.analisis_funcionales?.length) {
    await repositorios.functionalAnalyses.saveMany(snapshot.analisis_funcionales);
  }
  if (snapshot.notas_soap?.length) {
    await repositorios.soapNotes.saveMany(snapshot.notas_soap);
  }
  if (snapshot.planes_tratamiento?.length) {
    await repositorios.treatmentPlans.saveMany(snapshot.planes_tratamiento);
  }
  if (snapshot.registros_seguimiento?.length) {
    await repositorios.progressRecords.saveMany(snapshot.registros_seguimiento);
  }
  if (snapshot.planes_seguridad?.length) {
    await repositorios.safetyPlans.saveMany(snapshot.planes_seguridad);
  }
  if (snapshot.perfiles_wisc?.length) {
    await repositorios.wiscProfiles.saveMany(snapshot.perfiles_wisc);
  }
  if (snapshot.planes_piei?.length) {
    await repositorios.pieiPlans.saveMany(snapshot.planes_piei);
  }
  if (snapshot.feedbacks_piei?.length) {
    await repositorios.pieiFeedbacks.saveMany(snapshot.feedbacks_piei);
  }
  if (snapshot.evaluaciones_educativas?.length) {
    await repositorios.educationalAssessments.saveMany(snapshot.evaluaciones_educativas);
  }
  if (snapshot.impresiones_diagnosticas?.length) {
    await repositorios.impresionesDiagnosticas.saveMany(snapshot.impresiones_diagnosticas);
  }
  if (snapshot.sesiones_evaluacion?.length) {
    await repositorios.sesionesEval.saveMany(snapshot.sesiones_evaluacion);
  }
  if (snapshot.configuracion?.length) {
    await repositorios.configuracion.saveMany(snapshot.configuracion.map(c => ({ ...c, id: c.clave })));
  }
}

/**
 * Elimina TODOS los datos de la base de datos.
 * Usar solo para factory reset o antes de un restore con modo 'reemplazar'.
 */
async function clearAllData(): Promise<void> {
  await Promise.all([
    repositorios.expedientes.clear(),
    repositorios.clinicalAssessments.clear(),
    repositorios.functionalAnalyses.clear(),
    repositorios.soapNotes.clear(),
    repositorios.treatmentPlans.clear(),
    repositorios.progressRecords.clear(),
    repositorios.safetyPlans.clear(),
    repositorios.wiscProfiles.clear(),
    repositorios.pieiPlans.clear(),
    repositorios.pieiFeedbacks.clear(),
    repositorios.educationalAssessments.clear(),
    repositorios.impresionesDiagnosticas.clear(),
    repositorios.sesionesEval.clear(),
    repositorios.configuracion.clear(),
    repositorios.testResultImports.clear(),
    repositorios.clinicalAlerts.clear(),
  ]);
}

/**
 * Migrar expedientes existentes de localStorage a IndexedDB.
 * Ejecutar una sola vez durante la transicion.
 */
async function migrateFromLocalStorage(): Promise<{
  expedientesMigrados: number;
  sesionesMigradas: number;
  testResultsMigrados: number;
}> {
  if (!isBrowser()) return { expedientesMigrados: 0, sesionesMigradas: 0, testResultsMigrados: 0 };

  const MIGRATION_FLAG = 'pigec_idb_migration_v1_done';
  const flag = localStorage.getItem(MIGRATION_FLAG);
  if (flag) {
    console.log('[DB] Migracion desde localStorage ya completada previamente.');
    return { expedientesMigrados: 0, sesionesMigradas: 0, testResultsMigrados: 0 };
  }

  let expedientesMigrados = 0;
  let sesionesMigradas = 0;
  let testResultsMigrados = 0;

  try {
    // 1. Migrar expedientes
    const rawExpedientes = localStorage.getItem('pigec_expedientes');
    if (rawExpedientes) {
      const expedientes: any[] = JSON.parse(rawExpedientes);
      if (Array.isArray(expedientes) && expedientes.length > 0) {
        // Normalizar y guardar cada expediente
        for (const exp of expedientes) {
          if (!exp.id) {
            exp.id = exp.studentId ? `exp-${exp.studentId}` : generateId('exp');
          }
          if (!exp.fechaActualizacion) {
            exp.fechaActualizacion = new Date().toISOString();
          }
          await repositorios.expedientes.save(exp);
          expedientesMigrados++;
        }
        console.log(`[DB] Migrados ${expedientesMigrados} expedientes desde localStorage`);
      }
    }

    // 2. Migrar sesiones de evaluacion
    const rawSessions = localStorage.getItem('pigec_evaluation_sessions');
    if (rawSessions) {
      const sessions: any[] = JSON.parse(rawSessions);
      if (Array.isArray(sessions) && sessions.length > 0) {
        for (const session of sessions) {
          if (!session.id) session.id = generateId('ses');
          await repositorios.sesionesEval.save({
            id: session.id,
            tokenId: session.tokenId || session.id,
            estado: session.estado || 'activa',
            createdAt: session.createdAt || new Date().toISOString(),
            updatedAt: session.updatedAt,
            studentId: session.studentId,
            studentName: session.studentName,
            modo: session.modo || 'individual',
            pruebas: session.pruebas || session.tests || [],
            resultados: session.resultados || session.results,
          });
          sesionesMigradas++;
        }
        console.log(`[DB] Migradas ${sesionesMigradas} sesiones desde localStorage`);
      }
    }

    // 3. Migrar resultados de test
    const rawTestResults = localStorage.getItem('pigec_test_results');
    if (rawTestResults) {
      const results: any[] = JSON.parse(rawTestResults);
      if (Array.isArray(results) && results.length > 0) {
        for (const result of results) {
          if (!result.id) result.id = generateId('tr');
          await repositorios.testResultImports.save({
            id: result.id,
            expedienteId: result.expedienteId || '',
            studentId: result.studentId || '',
            testType: result.testType || result.tipo || 'Desconocido',
            canonicalType: result.canonicalType,
            score: Number(result.score) || 0,
            interpretation: result.interpretation || '',
            severity: result.severity || result.interpretation || '',
            date: result.submittedAt || result.fecha || result.date || new Date().toISOString(),
            source: result.source || 'grupo_evaluacion',
            importId: result.importId,
          });
          testResultsMigrados++;
        }
        console.log(`[DB] Migrados ${testResultsMigrados} resultados de test desde localStorage`);
      }
    }

    // Marcar migracion como completada
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
    console.log(`[DB] Migracion completada: ${expedientesMigrados} expedientes, ${sesionesMigradas} sesiones, ${testResultsMigrados} resultados`);

  } catch (error) {
    console.error('[DB] Error durante migracion desde localStorage:', error);
  }

  return { expedientesMigrados, sesionesMigradas, testResultsMigrados };
}

/**
 * Exporta la base de datos completa como archivo JSON descargable.
 */
async function exportBackupAsFile(especialistaName: string): Promise<void> {
  const backup = await generateBackup(especialistaName);
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const fecha = new Date().toISOString().split('T')[0];
  const nombre = `PIGEC-130_Respaldo_${fecha}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo JSON de respaldo y ejecuta la restauracion.
 */
async function importBackupFromFile(
  file: File,
  modo: 'reemplazar' | 'fusionar' = 'fusionar'
): Promise<{ exito: boolean; registrosImportados: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const snapshot: BackupSnapshot = JSON.parse(content);

        if (!snapshot.version || !snapshot.fecha_respaldo) {
          resolve({ exito: false, registrosImportados: 0 });
          return;
        }

        await restoreBackup(snapshot, modo);

        const total = [
          snapshot.expedientes?.length || 0,
          snapshot.evaluaciones_clinicas?.length || 0,
          snapshot.analisis_funcionales?.length || 0,
          snapshot.notas_soap?.length || 0,
          snapshot.planes_tratamiento?.length || 0,
          snapshot.registros_seguimiento?.length || 0,
          snapshot.planes_seguridad?.length || 0,
          snapshot.perfiles_wisc?.length || 0,
          snapshot.planes_piei?.length || 0,
          snapshot.feedbacks_piei?.length || 0,
          snapshot.evaluaciones_educativas?.length || 0,
          snapshot.impresiones_diagnosticas?.length || 0,
        ].reduce((sum, n) => sum + n, 0);

        resolve({ exito: true, registrosImportados: total });
      } catch (error) {
        console.error('[DB] Error al importar respaldo:', error);
        resolve({ exito: false, registrosImportados: 0 });
      }
    };
    reader.onerror = () => resolve({ exito: false, registrosImportados: 0 });
    reader.readAsText(file);
  });
}

// ─── EXPORTACION ─────────────────────────────────────────────────────────────

/**
 * Objeto principal de acceso a la base de datos.
 *
 * @example
 * import { db } from '@/lib/db-service';
 *
 * // Leer expediente completo
 * const datos = await db.getExpedienteCompleto('exp-001');
 *
 * // Guardar nota SOAP
 * await db.soapNotes.save({
 *   id: db.soapNotes.newId('soap'),
 *   expedienteId: 'exp-001',
 *   studentId: 'S001',
 *   sessionId: 'session-1',
 *   createdAt: new Date().toISOString(),
 *   subjective: '...',
 *   objective: '...',
 *   assessment: '...',
 *   plan: '...',
 * });
 *
 * // Buscar por expediente
 * const planes = await db.treatmentPlans.getByIndex('expedienteId', 'exp-001');
 *
 * // Exportar respaldo
 * await db.exportBackupAsFile('Dr. Perez');
 *
 * // Migrar desde localStorage (ejecutar una vez)
 * await db.migrateFromLocalStorage();
 */
export const db = {
  // Repositorios tipados
  expedientes: repositorios.expedientes,
  clinicalAssessments: repositorios.clinicalAssessments,
  functionalAnalyses: repositorios.functionalAnalyses,
  soapNotes: repositorios.soapNotes,
  treatmentPlans: repositorios.treatmentPlans,
  progressRecords: repositorios.progressRecords,
  safetyPlans: repositorios.safetyPlans,
  wiscProfiles: repositorios.wiscProfiles,
  pieiPlans: repositorios.pieiPlans,
  pieiFeedbacks: repositorios.pieiFeedbacks,
  educationalAssessments: repositorios.educationalAssessments,
  impresionesDiagnosticas: repositorios.impresionesDiagnosticas,
  sesionesEval: repositorios.sesionesEval,
  configuracion: repositorios.configuracion,
  testResultImports: repositorios.testResultImports,
  clinicalAlerts: repositorios.clinicalAlerts,

  // Funciones de alto nivel
  getExpedienteCompleto,
  deleteExpedienteCompleto,
  generateBackup,
  restoreBackup,
  clearAllData,
  migrateFromLocalStorage,
  exportBackupAsFile,
  importBackupFromFile,
};

export default db;
