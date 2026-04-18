export type WhatsAppBridgePayload = {
  version: string;
  createdAt: string;
  tokenId?: string;
  sessionId?: string;
  mode?: 'group' | 'individual';
  student?: {
    id?: string | null;
    name?: string;
    matricula?: string | null;
    grupoId?: string | null;
    grupoNombre?: string | null;
  };
  tests?: string[];
  completedTests?: string[];
  results?: Record<string, unknown>;
  [key: string]: unknown;
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }

  return Buffer.from(binary, 'binary').toString('base64');
}

function base64ToUint8(base64: string): Uint8Array {
  // Accept multiline and URL-safe base64 payloads copied from chat apps.
  const compact = base64
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padding = compact.length % 4;
  const normalized = padding === 0 ? compact : compact.padEnd(compact.length + (4 - padding), '=');

  const binary = typeof atob !== 'undefined'
    ? atob(normalized)
    : Buffer.from(normalized, 'base64').toString('binary');

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function compressUtf8(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') return data;

  try {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    await writer.write(data);
    await writer.close();

    // Safari/WebView can stall indefinitely here; fallback to raw if it takes too long.
    const compressionPromise = new Response(stream.readable).arrayBuffer();
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 1500);
    });

    const result = await Promise.race([compressionPromise, timeoutPromise]);
    if (!result) return data;

    return new Uint8Array(result);
  } catch {
    return data;
  }
}

async function decompressUtf8(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') return data;

  try {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    await writer.write(data);
    await writer.close();

    const decompressionPromise = new Response(stream.readable).arrayBuffer();
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 1500);
    });

    const result = await Promise.race([decompressionPromise, timeoutPromise]);
    if (!result) return data;

    return new Uint8Array(result);
  } catch {
    return data;
  }
}

export async function encodeEvaluationPayload(payload: WhatsAppBridgePayload): Promise<string> {
  const json = JSON.stringify(payload);
  const utf8 = new TextEncoder().encode(json);
  const compressed = await compressUtf8(utf8);
  const usedCompression = compressed.length < utf8.length;

  if (!usedCompression) {
    return `raw.${uint8ToBase64(utf8)}`;
  }

  return `gz.${uint8ToBase64(compressed)}`;
}

export async function decodeEvaluationPayload(code: string): Promise<WhatsAppBridgePayload> {
  const trimmed = code.trim();
  const withoutPrefix = trimmed.replace(/^PIGEC-WA1:/i, '').trim();

  // Support pasted text that includes labels/messages around the actual bridge code.
  const embeddedMatch = trimmed.match(/(?:PIGEC-WA1:\s*)?((?:raw|gz)\.[A-Za-z0-9+/_=\-.\s]+)/i);
  const normalized = (embeddedMatch?.[1] || withoutPrefix).replace(/\s+/g, '');

  const dotIndex = normalized.indexOf('.');
  const prefix = dotIndex >= 0 ? normalized.slice(0, dotIndex) : 'raw';
  const value = dotIndex >= 0 ? normalized.slice(dotIndex + 1) : normalized;

  const bytes = base64ToUint8(value);
  const decodedBytes = prefix === 'gz' ? await decompressUtf8(bytes) : bytes;
  const json = new TextDecoder().decode(decodedBytes);
  const parsed = JSON.parse(json) as WhatsAppBridgePayload;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Codigo de WhatsApp invalido');
  }

  return parsed;
}
