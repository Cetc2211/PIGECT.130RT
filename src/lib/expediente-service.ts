// ============================================================================
// EXPEDIENTE SERVICE — Arquitectura centralizada de expedientes
// ============================================================================
// Este servicio gestiona:
// 1. Los expedientes de ejemplo (demo) que ya existen en store.ts
// 2. Los expedientes dinámicos que se crean al evaluar grupos/estudiantes
// 3. Las estadísticas generales para el Dashboard
// 4. La lógica de niveles MTSS (Nivel 1, 2, 3)
// ============================================================================

import {
  Student,
  getStudents,
  getClinicalAssessmentByStudentId,
  getFunctionalAnalysisByStudentId,
  getTreatmentPlanByStudentId,
  getProgressTrackingByStudentId,
  getEducationalAssessmentByStudentId,
  ClinicalAssessment,
  FunctionalAnalysis,
  TreatmentPlan,
  ProgressData,
  EducationalAssessment,
} from './store';
import {
  getExpedientes as getExpedientesLocal,
  saveExpediente as saveExpedienteLocal,
} from './storage-local';
import type { StoredExpediente } from './storage-local';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

/** Niveles del protocolo MTSS */
export type NivelMTSS = 'nivel_1' | 'nivel_2' | 'nivel_3';

/** Estado del expediente */
export type EstadoExpediente = 'abierto' | 'en_seguimiento' | 'concluido' | 'inactivo';

/** Origen de la creación del expediente */
export type OrigenExpediente = 'demo' | 'tamizaje_grupal' | 'derivacion_orientacion' | 'evaluacion_clinica' | 'registro_manual';

/** Datos de la Ficha de Identificación (instrumento de Gestión de Pruebas) */
export interface FichaIdentificacionData {
  // I. Datos del Estudiante
  fullName: string;
  birthDate: string;
  sexo: 'femenino' | 'masculino' | '';
  genderIdentity: string;
  group: string;
  semester: string;

  // II. Datos de Contacto
  domicilio: string;
  celular: string;
  whatsapp: string;
  email: string;

  // III. Datos Sociofamiliares
  livingWith: 'ambos' | 'mama' | 'papa' | 'abuelos' | 'otro' | '';
  motherName: string;
  motherPhone: string;
  fatherName: string;
  fatherPhone: string;

  // IV. Antecedentes Personales
  backgroundInfo: string;
}

/** Valores por defecto para un nuevo formulario de Ficha de Identificación */
export const defaultFichaIdentificacion: FichaIdentificacionData = {
  fullName: '',
  birthDate: '',
  sexo: '',
  genderIdentity: '',
  group: '',
  semester: '',
  domicilio: '',
  celular: '',
  whatsapp: '',
  email: '',
  livingWith: '',
  motherName: '',
  motherPhone: '',
  fatherName: '',
  fatherPhone: '',
  backgroundInfo: '',
};

/** Expediente completo */
export interface Expediente {
  id: string;
  studentId: string;
  studentName: string;
  groupName: string;
  semester: number;

  // Metadata
  nivel: NivelMTSS;
  estado: EstadoExpediente;
  origen: OrigenExpediente;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor: string; // email del usuario que lo creó

  // Datos académicos base (para cálculo de riesgo)
  academicData: {
    gpa: number;
    absences: number;
  };

  // Ficha de Identificación (se llena al crear expediente individual)
  fichaIdentificacion?: FichaIdentificacionData;

  // Datos clínicos (se llenan progresivamente)
  ansiedadScore?: number;
  suicideRiskLevel?: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  irc?: number;
  nivelRiesgo?: string;

  // Evaluaciones registradas
  evaluaciones: EvaluacionRegistro[];

  // Notas y observaciones
  notas: NotaExpediente[];
}

/** Registro de una evaluación aplicada al estudiante */
export interface EvaluacionRegistro {
  id: string;
  tipo: string; // 'GAD-7', 'PHQ-9', 'BDI-II', 'WISC-V', 'CHTE', 'Neuropsicológico', etc.
  score: number;
  fecha: string;
  aplicadaPor: string;
  observaciones?: string;
}

/** Nota clínica/educativa dentro del expediente */
export interface NotaExpediente {
  id: string;
  fecha: string;
  autor: string;
  tipo: 'clinica' | 'educativa' | 'derivacion' | 'seguimiento';
  contenido: string;
}

/** Estadísticas generales del sistema (para el Dashboard) */
export interface AppStatistics {
  // Grupos
  totalGrupos: number;
  gruposEvaluadosNivel1: number;
  gruposEvaluadosNivel2: number;
  gruposEvaluadosNivel3: number;

  // Estudiantes
  totalEstudiantes: number;
  estudiantesEvaluados: number;

  // Necesidades de atención
  estudiantesNivel1: number;
  estudiantesNivel2: number;
  estudiantesNivel3: number;

  // Expedientes
  totalExpedientes: number;
  expedientesAbiertos: number;
  expedientesEnSeguimiento: number;
  expedientesConcluidos: number;
}

/** Filtros para el listado de expedientes */
export type FiltroExpediente = 'todos' | 'nivel_1' | 'nivel_2' | 'nivel_3' | 'abierto' | 'en_seguimiento' | 'concluido';

// ─── ALMACENAMIENTO EN MEMORIA ────────────────────────────────────────────────
// Los expedientes dinámicos se guardan aquí y se sincronizarán con Firestore después

let expedientesDinamicos: Expediente[] = [];
let expedientesLocalHydrated = false;

function normalizeExpediente(raw: Partial<Expediente> & Record<string, any>): Expediente {
  const now = new Date().toISOString();
  const studentId = String(raw.studentId || raw.id || `local-${Date.now()}`);

  return {
    id: String(raw.id || `exp-${studentId}`),
    studentId,
    studentName: String(raw.studentName || raw.fullName || 'Sin nombre'),
    groupName: String(raw.groupName || raw.grupoNombre || 'Sin grupo'),
    semester: Number(raw.semester || raw.semestre || 1),
    nivel: (raw.nivel === 'nivel_1' || raw.nivel === 'nivel_2' || raw.nivel === 'nivel_3') ? raw.nivel : 'nivel_1',
    estado: (raw.estado === 'abierto' || raw.estado === 'en_seguimiento' || raw.estado === 'concluido' || raw.estado === 'inactivo')
      ? raw.estado
      : 'abierto',
    origen: (raw.origen as OrigenExpediente) || 'registro_manual',
    fechaCreacion: String(raw.fechaCreacion || now),
    fechaActualizacion: String(raw.fechaActualizacion || now),
    creadoPor: String(raw.creadoPor || 'sistema@local'),
    academicData: {
      gpa: Number(raw.academicData?.gpa || raw.gpa || 0),
      absences: Number(raw.academicData?.absences || raw.absences || 0),
    },
    fichaIdentificacion: raw.fichaIdentificacion,
    ansiedadScore: typeof raw.ansiedadScore === 'number' ? raw.ansiedadScore : undefined,
    suicideRiskLevel: raw.suicideRiskLevel,
    irc: typeof raw.irc === 'number' ? raw.irc : undefined,
    nivelRiesgo: raw.nivelRiesgo,
    evaluaciones: Array.isArray(raw.evaluaciones) ? raw.evaluaciones : [],
    notas: Array.isArray(raw.notas) ? raw.notas : [],
  };
}

function hydrateExpedientesFromLocalStorage(): void {
  if (expedientesLocalHydrated) return;
  expedientesLocalHydrated = true;

  const localExpedientes = getExpedientesLocal<Partial<Expediente> & Record<string, any>>();
  if (!localExpedientes.length) return;

  expedientesDinamicos = localExpedientes.map(normalizeExpediente);
}

// ─── FUNCIONES DE CONVERSIÓN: Demo Store → Expediente ─────────────────────────
// Convierte los estudiantes de ejemplo del store.ts al formato Expediente

function demoToExpediente(student: Student, nivel: NivelMTSS, estado: EstadoExpediente): Expediente {
  const clinical = getClinicalAssessmentByStudentId(student.id);
  const educational = getEducationalAssessmentByStudentId(student.id);

  const evaluaciones: EvaluacionRegistro[] = [];

  // Si hay evaluación clínica, agregar las evaluaciones correspondientes
  if (clinical) {
    if (clinical.bdi_ii_score > 0) {
      evaluaciones.push({
        id: `eval-bdi-${student.id}`,
        tipo: 'BDI-II',
        score: clinical.bdi_ii_score,
        fecha: clinical.fecha_evaluacion,
        aplicadaPor: 'Sistema Demo',
      });
    }
    if (clinical.bai_score > 0) {
      evaluaciones.push({
        id: `eval-bai-${student.id}`,
        tipo: 'BAI',
        score: clinical.bai_score,
        fecha: clinical.fecha_evaluacion,
        aplicadaPor: 'Sistema Demo',
      });
    }
    if (clinical.riesgo_suicida_beck_score > 0) {
      evaluaciones.push({
        id: `eval-bhs-${student.id}`,
        tipo: 'Riesgo Suicida (Beck)',
        score: clinical.riesgo_suicida_beck_score,
        fecha: clinical.fecha_evaluacion,
        aplicadaPor: 'Sistema Demo',
      });
    }
    evaluaciones.push({
      id: `eval-gad7-${student.id}`,
      tipo: 'GAD-7',
      score: student.ansiedadScore || 0,
      fecha: clinical.fecha_evaluacion,
      aplicadaPor: 'Sistema Demo',
    });
  }

  // Si hay evaluación educativa
  if (educational) {
    evaluaciones.push({
      id: `eval-chte-${student.id}`,
      tipo: 'CHTE',
      score: educational.totalScore,
      fecha: educational.fecha_evaluacion,
      aplicadaPor: 'Sistema Demo',
      observaciones: `Interpretación: ${educational.interpretation}`,
    });
  }

  // Determinar nivel basado en los datos existentes
  const tieneEvaluacionClinica = !!clinical;
  const tienePlanTratamiento = !!getTreatmentPlanByStudentId(student.id);
  const esRiesgoAlto = student.suicideRiskLevel === 'Alto' || student.suicideRiskLevel === 'Crítico';

  let nivelCalculado: NivelMTSS = 'nivel_1';
  if (tieneEvaluacionClinica && esRiesgoAlto) {
    nivelCalculado = 'nivel_3';
  } else if (tieneEvaluacionClinica || tienePlanTratamiento) {
    nivelCalculado = 'nivel_2';
  }

  return {
    id: `demo-${student.id}`,
    studentId: student.id,
    studentName: student.name,
    groupName: student.demographics.group,
    semester: student.demographics.semester,
    nivel: nivelCalculado,
    estado: estado,
    origen: 'demo',
    fechaCreacion: '2024-05-15T10:00:00.000Z',
    fechaActualizacion: tienePlanTratamiento ? '2024-05-17T10:00:00.000Z' : '2024-05-15T10:00:00.000Z',
    creadoPor: 'sistema@demo.com',
    academicData: {
      gpa: student.academicData.gpa,
      absences: student.academicData.absences,
    },
    ansiedadScore: student.ansiedadScore,
    suicideRiskLevel: student.suicideRiskLevel,
    evaluaciones,
    notas: [],
  };
}

// ─── FUNCIONES CRUD ───────────────────────────────────────────────────────────

/**
 * Obtiene TODOS los expedientes (demo + dinámicos)
 */
export function getExpedientes(filtro?: FiltroExpediente): Expediente[] {
  hydrateExpedientesFromLocalStorage();

  // Generar expedientes demo a partir de store.ts
  const demoStudents = getStudents();
  const demoExpedientes: Expediente[] = demoStudents.map(student => {
    const tieneEvaluacionProfunda = !!getClinicalAssessmentByStudentId(student.id);
    const tienePlan = !!getTreatmentPlanByStudentId(student.id);
    const estado: EstadoExpediente = tienePlan ? 'en_seguimiento' : 'abierto';
    return demoToExpediente(student, 'nivel_1', estado);
  });

  const todos = [...demoExpedientes, ...expedientesDinamicos.map(normalizeExpediente)];

  if (!filtro || filtro === 'todos') return todos;

  return todos.filter(exp => {
    if (filtro === 'nivel_1' || filtro === 'nivel_2' || filtro === 'nivel_3') {
      return exp.nivel === filtro;
    }
    return exp.estado === filtro;
  });
}

/**
 * Obtiene un expediente por ID (busca en demo y dinámicos)
 */
export function getExpedienteById(id: string): Expediente | undefined {
  const todos = getExpedientes();
  return todos.find(exp => exp.id === id || exp.studentId === id);
}

/**
 * Crea un nuevo expediente (con o sin Ficha de Identificación)
 */
export function crearExpediente(data: {
  studentId: string;
  studentName: string;
  groupName: string;
  semester: number;
  gpa: number;
  absences: number;
  origen: OrigenExpediente;
  creadoPor: string;
  nivelInicial?: NivelMTSS;
  fichaIdentificacion?: FichaIdentificacionData;
}): Expediente {
  const nuevo: Expediente = {
    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    studentId: data.studentId,
    studentName: data.studentName,
    groupName: data.groupName,
    semester: data.semester,
    nivel: data.nivelInicial || 'nivel_1',
    estado: 'abierto',
    origen: data.origen,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    creadoPor: data.creadoPor,
    academicData: {
      gpa: data.gpa,
      absences: data.absences,
    },
    fichaIdentificacion: data.fichaIdentificacion,
    evaluaciones: [],
    notas: [],
  };

  hydrateExpedientesFromLocalStorage();
  expedientesDinamicos.push(nuevo);
  saveExpedienteLocal({ ...nuevo } as StoredExpediente);
  return nuevo;
}

/**
 * Actualiza el nivel de un expediente
 */
export function actualizarNivelExpediente(id: string, nuevoNivel: NivelMTSS): Expediente | undefined {
  hydrateExpedientesFromLocalStorage();
  const expediente = getExpedienteById(id);
  if (!expediente) return undefined;

  // Buscar en dinámicos
  const idx = expedientesDinamicos.findIndex(e => e.id === id);
  if (idx !== -1) {
    expedientesDinamicos[idx] = {
      ...expedientesDinamicos[idx],
      nivel: nuevoNivel,
      estado: nuevoNivel === 'nivel_3' ? 'en_seguimiento' : expedientesDinamicos[idx].estado,
      fechaActualizacion: new Date().toISOString(),
    };
    saveExpedienteLocal({ ...expedientesDinamicos[idx] } as StoredExpediente);
    return expedientesDinamicos[idx];
  }

  // Para expedientes demo, no se modifican (son de ejemplo)
  return undefined;
}

/**
 * Agrega una evaluación a un expediente
 */
export function agregarEvaluacion(
  expedienteId: string,
  evaluacion: Omit<EvaluacionRegistro, 'id'>
): Expediente | undefined {
  hydrateExpedientesFromLocalStorage();
  const idx = expedientesDinamicos.findIndex(e => e.id === expedienteId);
  if (idx === -1) return undefined;

  const nuevaEvaluacion: EvaluacionRegistro = {
    ...evaluacion,
    id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  };

  expedientesDinamicos[idx] = {
    ...expedientesDinamicos[idx],
    evaluaciones: [...expedientesDinamicos[idx].evaluaciones, nuevaEvaluacion],
    fechaActualizacion: new Date().toISOString(),
  };

  saveExpedienteLocal({ ...expedientesDinamicos[idx] } as StoredExpediente);

  return expedientesDinamicos[idx];
}

/**
 * Agrega una nota a un expediente
 */
export function agregarNota(
  expedienteId: string,
  nota: Omit<NotaExpediente, 'id'>
): Expediente | undefined {
  hydrateExpedientesFromLocalStorage();
  const idx = expedientesDinamicos.findIndex(e => e.id === expedienteId);
  if (idx === -1) return undefined;

  const nuevaNota: NotaExpediente = {
    ...nota,
    id: `nota-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
  };

  expedientesDinamicos[idx] = {
    ...expedientesDinamicos[idx],
    notas: [...expedientesDinamicos[idx].notas, nuevaNota],
    fechaActualizacion: new Date().toISOString(),
  };

  saveExpedienteLocal({ ...expedientesDinamicos[idx] } as StoredExpediente);

  return expedientesDinamicos[idx];
}

/**
 * Cambia el estado de un expediente
 */
export function cambiarEstadoExpediente(id: string, nuevoEstado: EstadoExpediente): Expediente | undefined {
  hydrateExpedientesFromLocalStorage();
  const idx = expedientesDinamicos.findIndex(e => e.id === id);
  if (idx === -1) return undefined;

  expedientesDinamicos[idx] = {
    ...expedientesDinamicos[idx],
    estado: nuevoEstado,
    fechaActualizacion: new Date().toISOString(),
  };

  saveExpedienteLocal({ ...expedientesDinamicos[idx] } as StoredExpediente);

  return expedientesDinamicos[idx];
}

// ─── ESTADÍSTICAS PARA EL DASHBOARD ────────────────────────────────────────────

/**
 * Calcula las estadísticas generales del sistema.
 * Combina datos de demo + expedientes dinámicos.
 */
export function calcularEstadisticas(): AppStatistics {
  const todos = getExpedientes();

  const stats: AppStatistics = {
    // Grupos (basado en los expedientes existentes)
    totalGrupos: 0,
    gruposEvaluadosNivel1: 0,
    gruposEvaluadosNivel2: 0,
    gruposEvaluadosNivel3: 0,

    // Estudiantes
    totalEstudiantes: todos.length,
    estudiantesEvaluados: todos.filter(e => (Array.isArray(e.evaluaciones) ? e.evaluaciones.length : 0) > 0).length,

    // Necesidades de atención por nivel
    estudiantesNivel1: todos.filter(e => e.nivel === 'nivel_1').length,
    estudiantesNivel2: todos.filter(e => e.nivel === 'nivel_2').length,
    estudiantesNivel3: todos.filter(e => e.nivel === 'nivel_3').length,

    // Expedientes
    totalExpedientes: todos.length,
    expedientesAbiertos: todos.filter(e => e.estado === 'abierto').length,
    expedientesEnSeguimiento: todos.filter(e => e.estado === 'en_seguimiento').length,
    expedientesConcluidos: todos.filter(e => e.estado === 'concluido').length,
  };

  // Calcular grupos únicos
  const gruposUnicos = new Map<string, { nivel: NivelMTSS; tieneEvaluaciones: boolean }>();
  todos.forEach(exp => {
    const groupKey = String(exp.groupName || 'Sin grupo');
    const evalCount = Array.isArray(exp.evaluaciones) ? exp.evaluaciones.length : 0;

    if (!gruposUnicos.has(groupKey)) {
      gruposUnicos.set(groupKey, { nivel: exp.nivel, tieneEvaluaciones: evalCount > 0 });
    }
    // Si el grupo ya existe, actualizar al nivel más alto
    const existente = gruposUnicos.get(groupKey)!;
    if (exp.nivel === 'nivel_3') existente.nivel = 'nivel_3';
    else if (exp.nivel === 'nivel_2' && existente.nivel !== 'nivel_3') existente.nivel = 'nivel_2';
    if (evalCount > 0) existente.tieneEvaluaciones = true;
  });

  stats.totalGrupos = gruposUnicos.size;
  gruposUnicos.forEach(g => {
    if (g.tieneEvaluaciones) {
      if (g.nivel === 'nivel_3') stats.gruposEvaluadosNivel3++;
      else if (g.nivel === 'nivel_2') stats.gruposEvaluadosNivel2++;
      else stats.gruposEvaluadosNivel1++;
    }
  });

  return stats;
}

// ─── FUNCIONES AUXILIARES ──────────────────────────────────────────────────────

/** Genera la etiqueta legible del nivel */
export function getNivelLabel(nivel: NivelMTSS): string {
  const labels: Record<NivelMTSS, string> = {
    nivel_1: 'Nivel 1 — Detección Universal',
    nivel_2: 'Nivel 2 — Intervención Focalizada',
    nivel_3: 'Nivel 3 — Intervención Intensiva',
  };
  return labels[nivel];
}

/** Genera la etiqueta corta del nivel */
export function getNivelShort(nivel: NivelMTSS): string {
  const labels: Record<NivelMTSS, string> = {
    nivel_1: 'Nivel 1',
    nivel_2: 'Nivel 2',
    nivel_3: 'Nivel 3',
  };
  return labels[nivel];
}

/** Genera el color del nivel para badges */
export function getNivelColor(nivel: NivelMTSS): 'green' | 'yellow' | 'red' {
  const colors: Record<NivelMTSS, 'green' | 'yellow' | 'red'> = {
    nivel_1: 'green',
    nivel_2: 'yellow',
    nivel_3: 'red',
  };
  return colors[nivel];
}

/** Genera la etiqueta del estado */
export function getEstadoLabel(estado: EstadoExpediente): string {
  const labels: Record<EstadoExpediente, string> = {
    abierto: 'Abierto',
    en_seguimiento: 'En Seguimiento',
    concluido: 'Concluido',
    inactivo: 'Inactivo',
  };
  return labels[estado];
}
