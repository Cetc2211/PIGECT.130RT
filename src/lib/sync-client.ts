// ============================================================================
// SYNC CLIENT — No-op stubs (100% local mode)
// ============================================================================

export async function robustUpload<T = unknown>(
  _userId: string,
  _key: string,
  _data: T,
  _lastUpdated?: number
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Local mode — sync disabled' };
}

export async function batchUpload(
  _items: { key: string; data: any; lastUpdated: number; name?: string }[],
  _onProgress?: (current: number, total: number, status: string) => void
): Promise<{ success: boolean; succeeded: number; failed: number; results: any[] }> {
  return { success: false, succeeded: 0, failed: 0, results: [] };
}

export async function checkFirebaseHealth(): Promise<{ healthy: boolean; latency?: number }> {
  return { healthy: false };
}
