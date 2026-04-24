// TODO(v2): eliminar dependencia Firebase — será removido en Fase 1
// Stub for firebase/storage — no-op implementations for 100% local mode
export const getStorage = () => null;
export const ref = (_storage: unknown, _path?: string) => ({ fullPath: 'stub/path', name: 'stub' });
export const uploadBytes = async (_ref: unknown, _data: unknown) => ({ ref: { fullPath: 'stub/path' } });
export const uploadBytesResumable = (_ref: unknown, _data: unknown) => ({
  on: (_event: string, _cb: (...args: unknown[]) => unknown) => {},
  then: (cb: (...args: unknown[]) => unknown) => cb({ ref: { fullPath: 'stub/path' } }),
});
export const getDownloadURL = async (_ref: unknown) => 'https://stub.example.com/path';
export const deleteObject = async (_ref: unknown) => undefined;
export const connectStorageEmulator = (_storage: unknown, _host: string, _port: number) => {};
