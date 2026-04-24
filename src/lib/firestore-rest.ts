// TODO(v2): eliminar dependencia Firebase — será removido en Fase 1
// ============================================================================
// FIRESTORE REST — No-op stubs (100% local mode)
// ============================================================================

export async function firestoreRestGet(_path: string): Promise<Record<string, unknown> | null> {
  return null;
}

export async function firestoreRestSet(_path: string, _data: Record<string, unknown>): Promise<boolean> {
  return false;
}

export async function firestoreRestUpdate(_path: string, _data: Record<string, unknown>): Promise<boolean> {
  return false;
}

export async function firestoreRestDelete(_path: string): Promise<boolean> {
  return false;
}
