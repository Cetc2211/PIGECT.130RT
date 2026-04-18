// ============================================================================
// ULTRA REST UPLOAD — No-op stubs (100% local mode)
// ============================================================================

export async function ultraUploadAll(
  _userId: string,
  _items: { key: string; data: any; name?: string }[],
  _onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; uploadedItems: number; totalItems: number; errors: string[] }> {
  return { success: false, uploadedItems: 0, totalItems: 0, errors: [] };
}

export async function ultraDownload<T = unknown>(
  _userId: string,
  _key: string
): Promise<{ success: boolean; data?: T }> {
  return { success: false };
}
