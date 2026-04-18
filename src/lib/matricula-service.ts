// ============================================================================
// MATRICULA SERVICE — 100% Local (localStorage)
// ============================================================================

export interface MatriculaRegistro {
  matricula: string;
  nombreCompleto: string;
  nombreNormalizado: string;
  grupoId: string;
  grupoNombre: string;
  semestre: number;
  periodo: string;
  expedienteId?: string;
  fechaAsignacion: string;
  fechaUltimaEvaluacion?: string;
  evaluacionesCompletadas: number;
  activo: boolean;
  telefono?: string;
  email?: string;
}

export interface GenerarMatriculasResult {
  success: boolean;
  matriculas: MatriculaRegistro[];
  errores: string[];
  totalGenerados: number;
  totalRecuperados: number;
}

export interface ListaMatriculasGrupo {
  grupoId: string;
  grupoNombre: string;
  periodo: string;
  fechaGeneracion: Date;
  estudiantes: MatriculaRegistro[];
  resumen: {
    total: number;
    conExpediente: number;
    sinExpediente: number;
    evaluados: number;
    pendientes: number;
  };
}

const PLANTEL = 'CBTA';
const PERIODO_ACTUAL = '2026-1';
const MATRICULAS_KEY = 'pigec_matriculas';

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

function normalizarNombre(nombre: string): string {
  return nombre.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().split(' ').reverse().join(' ');
}

function extraerSemestre(grupoNombre: string): number {
  const match = grupoNombre.match(/semestre\s*(\d)/i);
  return match ? parseInt(match[1]) : 1;
}

function generarCodigoGrupo(grupoNombre: string): string {
  const match = grupoNombre.match(/Grupo\s*(\d+)([A-Z])/i);
  return match ? `G${match[1]}${match[2].toUpperCase()}` : 'G00';
}

function generarMatricula(grupoNombre: string, numeroSecuencial: number, periodo: string = PERIODO_ACTUAL): string {
  const codigoGrupo = generarCodigoGrupo(grupoNombre);
  const año = periodo.split('-')[0];
  const numero = numeroSecuencial.toString().padStart(3, '0');
  return `${PLANTEL}-${año}-${codigoGrupo}-${numero}`;
}

function getAll(): MatriculaRegistro[] {
  return safeParse<MatriculaRegistro>(MATRICULAS_KEY);
}

function saveAll(matriculas: MatriculaRegistro[]): void {
  safeSet(MATRICULAS_KEY, matriculas);
}

export async function generarMatriculasGrupo(
  grupoId: string,
  grupoNombre: string,
  estudiantes: { id: string; nombre: string; telefono?: string; email?: string }[]
): Promise<GenerarMatriculasResult> {
  const result: GenerarMatriculasResult = { success: false, matriculas: [], errores: [], totalGenerados: 0, totalRecuperados: 0 };

  try {
    const all = getAll();
    const grupoMatriculas = all.filter(m => m.grupoId === grupoId);
    let siguienteNumero = grupoMatriculas.length + 1;
    const semestre = extraerSemestre(grupoNombre);

    for (const estudiante of estudiantes) {
      try {
        const existente = all.find(m => m.grupoId === grupoId && m.nombreNormalizado === normalizarNombre(estudiante.nombre));
        if (existente) {
          result.matriculas.push({ ...existente, telefono: existente.telefono || estudiante.telefono, email: existente.email || estudiante.email });
          result.totalRecuperados++;
          continue;
        }

        const matricula = generarMatricula(grupoNombre, siguienteNumero);
        const registro: MatriculaRegistro = {
          matricula, nombreCompleto: estudiante.nombre, nombreNormalizado: normalizarNombre(estudiante.nombre),
          grupoId, grupoNombre, semestre, periodo: PERIODO_ACTUAL, fechaAsignacion: new Date().toISOString(),
          evaluacionesCompletadas: 0, activo: true, telefono: estudiante.telefono, email: estudiante.email,
        };

        all.push(registro);
        result.matriculas.push(registro);
        result.totalGenerados++;
        siguienteNumero++;
      } catch (error) {
        result.errores.push(`Error con estudiante ${estudiante.nombre}: ${error}`);
      }
    }

    saveAll(all);
    result.success = true;
  } catch (error) {
    result.errores.push(`Error general: ${error}`);
  }
  return result;
}

export async function obtenerMatriculasGrupo(grupoId: string): Promise<ListaMatriculasGrupo | null> {
  const all = getAll().filter(m => m.grupoId === grupoId).sort((a, b) => a.nombreNormalizado.localeCompare(b.nombreNormalizado));
  if (all.length === 0) return null;

  const primero = all[0];
  return {
    grupoId, grupoNombre: primero.grupoNombre, periodo: primero.periodo, fechaGeneracion: new Date(), estudiantes: all,
    resumen: {
      total: all.length,
      conExpediente: all.filter(e => e.expedienteId).length,
      sinExpediente: all.filter(e => !e.expedienteId).length,
      evaluados: all.filter(e => e.evaluacionesCompletadas > 0).length,
      pendientes: all.filter(e => e.evaluacionesCompletadas === 0).length,
    },
  };
}

export async function validarMatricula(matricula: string): Promise<MatriculaRegistro | null> {
  return getAll().find(m => m.matricula === matricula.toUpperCase() && m.activo) || null;
}

export async function vincularExpediente(matricula: string, expedienteId: string): Promise<boolean> {
  const all = getAll();
  const idx = all.findIndex(m => m.matricula === matricula.toUpperCase());
  if (idx === -1) return false;

  all[idx].expedienteId = expedienteId;
  all[idx].fechaUltimaEvaluacion = new Date().toISOString();
  all[idx].evaluacionesCompletadas++;
  saveAll(all);
  return true;
}

export function generarTextoListaMatriculas(lista: ListaMatriculasGrupo): string {
  const lineas: string[] = [];
  lineas.push(`LISTA DE MATRICULAS`);
  lineas.push(`${lista.grupoNombre}`);
  lineas.push(`Periodo: ${lista.periodo}`);
  lineas.push(`Total: ${lista.resumen.total} estudiantes`);
  lineas.push('---');
  lineas.push('');
  lista.estudiantes.forEach((est) => {
    const estado = est.evaluacionesCompletadas > 0 ? '[OK]' : '[PEND]';
    lineas.push(`${estado} ${est.matricula} - ${est.nombreCompleto}`);
  });
  lineas.push('');
  lineas.push('---');
  lineas.push(`Evaluados: ${lista.resumen.evaluados}`);
  lineas.push(`Pendientes: ${lista.resumen.pendientes}`);
  return lineas.join('\n');
}
