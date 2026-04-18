import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Grupo {
  id: string;
  nombre: string;
  semestre: number;
  carrera: string;
  turno: 'Matutino' | 'Vespertino';
  periodo: string;
  totalEstudiantes: number;
  tutorId?: string;
  tutorEmail?: string;
  activo: boolean;
  fechaCreacion?: Date;
}

export interface EstudianteGrupo {
  id: string;
  nombre: string;
  matricula?: string;
  grupo: string;
  grupoId: string;
  semestre: number;
  telefono?: string;
  email?: string;
}

export interface GruposResult {
  success: boolean;
  grupos: Grupo[];
  error?: string;
}

export interface EstudiantesGrupoResult {
  success: boolean;
  estudiantes: EstudianteGrupo[];
  error?: string;
}

// ============================================
// CONFIGURACIÓN
// ============================================

const COLECCIONES_GRUPOS = ['official_groups', 'groups'];
const COLECCIONES_ESTUDIANTES = ['students', 'alumnos'];
const PERIODO_ACTUAL = '2026-1';

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function extraerSemestre(grupoNombre: string): number {
  const match = grupoNombre.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function extraerCarrera(grupoNombre: string): string {
  const match = grupoNombre.match(/\s+([A-Z]+)\s*$/);
  return match ? match[1] : 'Tecnólogo';
}

function extraerTurno(grupoNombre: string): 'Matutino' | 'Vespertino' {
  if (grupoNombre.toLowerCase().includes('vespertino') || grupoNombre.toLowerCase().includes('vesp')) {
    return 'Vespertino';
  }
  return 'Matutino';
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtiene todos los grupos oficiales de Firestore
 */
export async function obtenerGrupos(): Promise<GruposResult> {
  if (!db) {
    return { success: false, grupos: [], error: 'Base de datos no disponible' };
  }

  try {
    let gruposSnapshot = null as Awaited<ReturnType<typeof getDocs>> | null;
    let coleccionUsada = '';

    for (const nombreColeccion of COLECCIONES_GRUPOS) {
      try {
        const gruposRef = collection(db, nombreColeccion);
        const snapshot = await getDocs(gruposRef);
        gruposSnapshot = snapshot;
        coleccionUsada = nombreColeccion;
        break;
      } catch (error) {
        console.warn(`[grupos-service] No se pudo leer ${nombreColeccion}:`, error);
      }
    }

    if (!gruposSnapshot) {
      return {
        success: false,
        grupos: [],
        error: 'No se pudo leer ninguna colección de grupos (official_groups/groups).'
      };
    }

    if (gruposSnapshot.empty) {
      console.log(`[grupos-service] No se encontraron grupos en ${coleccionUsada}`);
      return { success: true, grupos: [] };
    }

    const grupos: Grupo[] = gruposSnapshot.docs.map(doc => {
      const data = doc.data();
      const nombre = data.name || `Grupo ${doc.id}`;
      
      return {
        id: doc.id,
        nombre: nombre,
        semestre: extraerSemestre(nombre),
        carrera: extraerCarrera(nombre),
        turno: extraerTurno(nombre),
        periodo: PERIODO_ACTUAL,
        totalEstudiantes: 0,
        tutorEmail: data.tutorEmail,
        activo: true,
        fechaCreacion: data.createdAt ? new Date(data.createdAt) : undefined
      };
    });

    // Obtener conteo de estudiantes por grupo
    let conteoPorGrupo = new Map<string, number>();
    try {
      conteoPorGrupo = await obtenerConteoEstudiantesPorGrupo();
    } catch (error) {
      console.warn('[grupos-service] Sin conteo de estudiantes por permisos o conectividad:', error);
    }
    
    grupos.forEach(grupo => {
      grupo.totalEstudiantes = conteoPorGrupo.get(grupo.id) || 0;
    });

    grupos.sort((a, b) => {
      if (a.semestre !== b.semestre) return a.semestre - b.semestre;
      return a.nombre.localeCompare(b.nombre);
    });

    console.log(`[grupos-service] Cargados ${grupos.length} grupos desde ${coleccionUsada}`);
    return { success: true, grupos };

  } catch (error) {
    console.error('Error obteniendo grupos:', error);
    return { 
      success: false, 
      grupos: [], 
      error: `Error al obtener grupos: ${error}` 
    };
  }
}

/**
 * Obtiene todos los estudiantes de un grupo específico
 * IMPORTANTE: Filtra en memoria para evitar problemas de índices de Firestore
 */
export async function obtenerEstudiantesGrupo(grupoId: string): Promise<EstudiantesGrupoResult> {
  if (!db) {
    return { success: false, estudiantes: [], error: 'Base de datos no disponible' };
  }

  try {
    console.log(`[grupos-service] ========== BUSCANDO ESTUDIANTES ==========`);
    console.log(`[grupos-service] Grupo ID buscado: "${grupoId}"`);
    console.log(`[grupos-service] Tipo de grupoId: ${typeof grupoId}`);
    
    // Obtener TODOS los estudiantes y filtrar en memoria (evita problemas de índices)
    let estudiantesSnapshot = null as Awaited<ReturnType<typeof getDocs>> | null;

    for (const nombreColeccion of COLECCIONES_ESTUDIANTES) {
      try {
        const estudiantesRef = collection(db, nombreColeccion);
        const snapshot = await getDocs(estudiantesRef);
        estudiantesSnapshot = snapshot;
        break;
      } catch (error) {
        console.warn(`[grupos-service] No se pudo leer ${nombreColeccion}:`, error);
      }
    }

    if (!estudiantesSnapshot) {
      return {
        success: false,
        estudiantes: [],
        error: 'No se pudo leer ninguna colección de estudiantes (students/alumnos).'
      };
    }

    console.log(`[grupos-service] Total documentos en 'students': ${estudiantesSnapshot.docs.length}`);

    if (estudiantesSnapshot.empty) {
      console.log('[grupos-service] No hay estudiantes en la base de datos');
      return { success: true, estudiantes: [] };
    }

    // Debug: mostrar todos los grupos encontrados en estudiantes
    const gruposEncontrados = new Set<string>();
    estudiantesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const gid = data.official_group_id || data.groupId || data.grupoId;
      if (gid) {
        gruposEncontrados.add(gid);
      }
    });
    console.log(`[grupos-service] Grupos encontrados en estudiantes:`, Array.from(gruposEncontrados));

    // Filtrar manualmente por official_group_id
    const estudiantesFiltrados = estudiantesSnapshot.docs.filter(doc => {
      const data = doc.data();
      const estudianteGrupoId = data.official_group_id || data.groupId || data.grupoId;
      const coincide = estudianteGrupoId === grupoId;
      return coincide;
    });

    console.log(`[grupos-service] Estudiantes filtrados para grupo "${grupoId}": ${estudiantesFiltrados.length}`);

    if (estudiantesFiltrados.length === 0) {
      return { success: true, estudiantes: [] };
    }

    // Obtener el nombre del grupo
    const gruposResult = await obtenerGrupos();
    const grupo = gruposResult.grupos.find(g => g.id === grupoId);
    const grupoNombre = grupo?.nombre || 'Grupo';

    const estudiantes: EstudianteGrupo[] = estudiantesFiltrados.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.name || 'Sin nombre',
        matricula: data.matricula,
        grupo: grupoNombre,
        grupoId: grupoId,
        semestre: extraerSemestre(grupoNombre),
        telefono: data.phone || data.telefono,
        email: data.email
      };
    });

    // Ordenar por nombre
    estudiantes.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return { success: true, estudiantes };

  } catch (error) {
    console.error('[grupos-service] Error obteniendo estudiantes del grupo:', error);
    return { 
      success: false, 
      estudiantes: [], 
      error: `Error al obtener estudiantes: ${error}` 
    };
  }
}

/**
 * Obtiene el conteo de estudiantes por grupo
 * Filtra en memoria para evitar problemas de índices
 */
export async function obtenerConteoEstudiantesPorGrupo(): Promise<Map<string, number>> {
  if (!db) {
    return new Map();
  }

  try {
    let estudiantesSnapshot = null as Awaited<ReturnType<typeof getDocs>> | null;

    for (const nombreColeccion of COLECCIONES_ESTUDIANTES) {
      try {
        const estudiantesRef = collection(db, nombreColeccion);
        const snapshot = await getDocs(estudiantesRef);
        estudiantesSnapshot = snapshot;
        break;
      } catch (error) {
        console.warn(`[grupos-service] No se pudo leer ${nombreColeccion} para conteo:`, error);
      }
    }

    if (!estudiantesSnapshot) {
      return new Map();
    }

    const conteo = new Map<string, number>();

    estudiantesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const grupoId = data.official_group_id || data.groupId || data.grupoId;
      
      if (grupoId) {
        conteo.set(grupoId, (conteo.get(grupoId) || 0) + 1);
      }
    });

    console.log(`[grupos-service] Conteo de estudiantes por grupo: ${conteo.size} grupos con estudiantes`);
    return conteo;

  } catch (error) {
    console.error('[grupos-service] Error obteniendo conteo de estudiantes:', error);
    return new Map();
  }
}

/**
 * Suscribe a cambios en tiempo real en los grupos
 */
export function subscribeToGrupos(callback: (grupos: Grupo[]) => void): () => void {
  if (!db) {
    callback([]);
    return () => {};
  }

  const gruposRef = collection(db, COLECCIONES_GRUPOS[0]);
  
  const unsubscribe = onSnapshot(gruposRef, async (snapshot) => {
    const grupos: Grupo[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const nombre = data.name || `Grupo ${doc.id}`;
      
      return {
        id: doc.id,
        nombre: nombre,
        semestre: extraerSemestre(nombre),
        carrera: extraerCarrera(nombre),
        turno: extraerTurno(nombre),
        periodo: PERIODO_ACTUAL,
        totalEstudiantes: 0,
        tutorEmail: data.tutorEmail,
        activo: true,
        fechaCreacion: data.createdAt ? new Date(data.createdAt) : undefined
      };
    });

    const conteoPorGrupo = await obtenerConteoEstudiantesPorGrupo();
    grupos.forEach(grupo => {
      grupo.totalEstudiantes = conteoPorGrupo.get(grupo.id) || 0;
    });

    grupos.sort((a, b) => {
      if (a.semestre !== b.semestre) return a.semestre - b.semestre;
      return a.nombre.localeCompare(b.nombre);
    });

    callback(grupos);
  }, (error) => {
    console.error('[grupos-service] Error en suscripción a grupos:', error);
  });

  return unsubscribe;
}

/**
 * Formatea el nombre del grupo para mostrar
 */
export function formatearNombreGrupo(grupo: Grupo): string {
  return `${grupo.nombre} (${grupo.totalEstudiantes} estudiantes)`;
}

/**
 * Filtra grupos por semestre
 */
export function filtrarGruposPorSemestre(grupos: Grupo[], semestre: number | 'all'): Grupo[] {
  if (semestre === 'all') return grupos;
  return grupos.filter(g => g.semestre === semestre);
}

/**
 * Busca grupos por nombre
 */
export function buscarGrupos(grupos: Grupo[], termino: string): Grupo[] {
  const terminoLower = termino.toLowerCase();
  return grupos.filter(g => 
    g.nombre.toLowerCase().includes(terminoLower) ||
    g.carrera.toLowerCase().includes(terminoLower) ||
    g.tutorEmail?.toLowerCase().includes(terminoLower)
  );
}
