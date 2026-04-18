// ============================================================================
// CHUNKED UPLOAD — No-op stubs (100% local mode)
// ============================================================================

export async function chunkedUpload<T = unknown>(
  _userId: string,
  _key: string,
  _data: T,
  _chunkSize?: number
): Promise<{ success: boolean; chunks?: number }> {
  return { success: false };
}

export async function chunkedDownload<T = unknown>(
  _userId: string,
  _key: string
): Promise<{ success: boolean; data?: T }> {
  return { success: false };
}

export async function smartDownload<T = unknown>(
  _userId: string,
  _key: string
): Promise<T | null> {
  return null;
}

export async function deleteChunkedData(_userId: string, _key: string): Promise<boolean> {
  return false;
}
