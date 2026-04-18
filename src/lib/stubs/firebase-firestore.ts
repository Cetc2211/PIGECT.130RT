// Stub for firebase/firestore — no-op implementations for 100% local mode
const noop = async () => undefined;
const noopReturn = () => ({});

export const getFirestore = () => null;
export const collection = (_db: unknown, _path?: string, ..._segments: string[]) => ({ id: 'stub-collection', path: 'stub' });
export const doc = (_db: unknown, _path?: string, _pathSegments?: string) => 'stub-doc-id';
export const getDoc = async (_ref: unknown) => ({ exists: () => false, data: () => null, id: 'stub' });
export const setDoc = async (..._args: unknown[]) => undefined;
export const addDoc = async (..._args: unknown[]) => 'stub-new-doc-id';
export const updateDoc = async (..._args: unknown[]) => undefined;
export const deleteDoc = async (_ref: unknown) => undefined;
export const getDocs = async (_query: unknown) => ({ empty: true, docs: [], forEach: noopReturn, size: 0 });
export const query = (..._constraints: unknown[]) => null;
export const where = (_field: string, _op: string, _value: unknown) => ({});
export const orderBy = (_field: string, _dir?: string) => ({});
export const limit = (_n: number) => ({});
export const onSnapshot = (_ref: unknown, _callback: (...args: unknown[]) => unknown, _errCb?: (...args: unknown[]) => unknown) => noop;
export const writeBatch = (_db: unknown) => ({
  set: (..._args: unknown[]) => {},
  update: (..._args: unknown[]) => {},
  delete: (..._args: unknown[]) => {},
  commit: async () => undefined,
});
export const runTransaction = async (_db: unknown, _fn: (...args: unknown[]) => Promise<unknown>) => null;
export const serverTimestamp = () => ({});
export const increment = (_n: number) => ({});
export const arrayUnion = (..._elements: unknown[]) => ({});
export const arrayRemove = (..._elements: unknown[]) => ({});
export const Timestamp = {
  now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, toDate: () => new Date() }),
  fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date }),
};
export const waitForPendingWrites = async (_db: unknown) => undefined;
export const connectFirestoreEmulator = (_db: unknown, _host: string, _port: number) => {};
