// TODO(v2): eliminar dependencia Firebase — será removido en Fase 1
// Stub for firebase/auth — no-op implementations for 100% local mode
export const getAuth = () => null;
export const signInWithEmailAndPassword = async (_auth: unknown, _email: string, _password: string) => ({ user: null });
export const signOut = async () => undefined;
export const createUserWithEmailAndPassword = async (_auth: unknown, _email: string, _password: string) => ({ user: null });
export const sendPasswordResetEmail = async (_auth: unknown, _email: string) => undefined;
export const getIdToken = async (_user: unknown) => '';
export const onAuthStateChanged = (_auth: unknown, _callback: (...args: unknown[]) => unknown) => (() => {});
export const signInAnonymously = async (_auth: unknown) => ({ user: null });
