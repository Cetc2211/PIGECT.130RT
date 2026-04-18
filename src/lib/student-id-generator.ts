// ============================================================================
// STUDENT ID GENERATOR — 100% Local (localStorage)
// ============================================================================

const IDENTITIES_KEY = 'pigec_student_identities';

export interface StudentIdentity {
  id: string;
  matricula: string;
  nombre: string;
  email?: string;
  groupId?: string;
  createdAt: string;
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

export async function generateStudentId(nombre: string, groupId?: string): Promise<StudentIdentity> {
  const all = safeParse<StudentIdentity>(IDENTITIES_KEY);
  const existing = all.find(s => s.nombre === nombre && s.groupId === groupId);
  if (existing) return existing;

  const identity: StudentIdentity = {
    id: `sid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    matricula: `CBTA-2026-${Date.now().toString(36).toUpperCase().slice(-4)}`,
    nombre,
    groupId,
    createdAt: new Date().toISOString(),
  };

  all.push(identity);
  safeSet(IDENTITIES_KEY, all);
  return identity;
}

export async function getStudentById(id: string): Promise<StudentIdentity | null> {
  return safeParse<StudentIdentity>(IDENTITIES_KEY).find(s => s.id === id) || null;
}

export async function getAllStudents(): Promise<StudentIdentity[]> {
  return safeParse<StudentIdentity>(IDENTITIES_KEY);
}
