// ============================================================================
// GRUPOS SERVICE — 100% Local (localStorage)
// ============================================================================

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

const GRUPOS_KEY = 'pigec_grupos';
const ESTUDIANTES_KEY = 'pigec_estudiantes_grupo';
const PERIODO_ACTUAL = '2026-1';

function extraerSemestre(grupoNombre: string): number {
  const match = grupoNombre.match(/semestre\s*(\d)/i);
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

function safeParse<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function safeSet(key: string, data: unknown[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Demo groups for first-time users
function getDemoGrupos(): Grupo[] {
  return [
    { id: 'demo-g1', nombre: 'Grupo 1A - Semestre 1', semestre: 1, carrera: 'Tecnólogo', turno: 'Matutino', periodo: PERIODO_ACTUAL, totalEstudiantes: 5, activo: true, fechaCreacion: new Date() },
    { id: 'demo-g2', nombre: 'Grupo 2A - Semestre 2', semestre: 2, carrera: 'Tecnólogo', turno: 'Matutino', periodo: PERIODO_ACTUAL, totalEstudiantes: 4, activo: true, fechaCreacion: new Date() },
    { id: 'demo-g3', nombre: 'Grupo 3A - Semestre 3', semestre: 3, carrera: 'Tecnólogo', turno: 'Vespertino', periodo: PERIODO_ACTUAL, totalEstudiantes: 6, activo: true, fechaCreacion: new Date() },
  ];
}

export async function obtenerGrupos(): Promise<GruposResult> {
  try {
    let grupos = safeParse<Grupo>(GRUPOS_KEY);

    if (grupos.length === 0) {
      grupos = getDemoGrupos();
      safeSet(GRUPOS_KEY, grupos);
    }

    const estudiantes = safeParse<EstudianteGrupo>(ESTUDIANTES_KEY);
    const conteo = new Map<string, number>();
    estudiantes.forEach(e => {
      conteo.set(e.grupoId, (conteo.get(e.grupoId) || 0) + 1);
    });
    grupos.forEach(g => { g.totalEstudiantes = conteo.get(g.id) || g.totalEstudiantes; });

    grupos.sort((a, b) => a.semestre !== b.semestre ? a.semestre - b.semestre : a.nombre.localeCompare(b.nombre));
    return { success: true, grupos };
  } catch (error) {
    return { success: false, grupos: [], error: `Error: ${error}` };
  }
}

export async function obtenerEstudiantesGrupo(grupoId: string): Promise<EstudiantesGrupoResult> {
  try {
    const estudiantes = safeParse<EstudianteGrupo>(ESTUDIANTES_KEY).filter(e => e.grupoId === grupoId);
    estudiantes.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return { success: true, estudiantes };
  } catch (error) {
    return { success: false, estudiantes: [], error: `Error: ${error}` };
  }
}

export async function obtenerConteoEstudiantesPorGrupo(): Promise<Map<string, number>> {
  const conteo = new Map<string, number>();
  safeParse<EstudianteGrupo>(ESTUDIANTES_KEY).forEach(e => {
    conteo.set(e.grupoId, (conteo.get(e.grupoId) || 0) + 1);
  });
  return conteo;
}

export function subscribeToGrupos(callback: (grupos: Grupo[]) => void): () => void {
  // Local mode — load once and return no-op unsubscribe
  obtenerGrupos().then(result => callback(result.grupos));
  return () => {};
}

export function formatearNombreGrupo(grupo: Grupo): string {
  return `${grupo.nombre} (${grupo.totalEstudiantes} estudiantes)`;
}

export function filtrarGruposPorSemestre(grupos: Grupo[], semestre: number | 'all'): Grupo[] {
  if (semestre === 'all') return grupos;
  return grupos.filter(g => g.semestre === semestre);
}

export function buscarGrupos(grupos: Grupo[], termino: string): Grupo[] {
  const term = termino.toLowerCase();
  return grupos.filter(g =>
    g.nombre.toLowerCase().includes(term) ||
    g.carrera.toLowerCase().includes(term) ||
    g.tutorEmail?.toLowerCase().includes(term)
  );
}

// Save helpers for screening-management and other components
export function saveGrupoLocal(grupo: Grupo): void {
  const current = safeParse<Grupo>(GRUPOS_KEY);
  const idx = current.findIndex(g => g.id === grupo.id);
  if (idx >= 0) current[idx] = grupo; else current.push(grupo);
  safeSet(GRUPOS_KEY, current);
}

export function saveEstudiantesGrupoLocal(estudiantes: EstudianteGrupo[]): void {
  const current = safeParse<EstudianteGrupo>(ESTUDIANTES_KEY);
  const ids = new Set(estudiantes.map(e => e.id));
  const filtered = current.filter(e => !ids.has(e.id));
  filtered.push(...estudiantes);
  safeSet(ESTUDIANTES_KEY, filtered);
}
