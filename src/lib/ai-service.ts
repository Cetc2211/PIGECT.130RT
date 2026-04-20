'use client';

// ============================================================================
// AI SERVICE — Gemini v1 ESTABLE (fetch directo, sin SDK)
// ============================================================================

export const USER_GEMINI_API_KEY_STORAGE_KEY = 'USER_GEMINI_API_KEY';
export const AI_KEY_MISSING_MESSAGE = 'Configura tu API Key en Ajustes para activar la IA';

const GEMINI_V1_BASE = 'https://generativelanguage.googleapis.com/v1';
const CLINICAL_MODEL = 'gemini-1.5-flash';

function safeLocalStorageGet(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(key)?.trim() || '';
  } catch {
    return '';
  }
}

export function getUserGeminiApiKey(): string {
  return safeLocalStorageGet(USER_GEMINI_API_KEY_STORAGE_KEY);
}

export function hasUserGeminiApiKey(): boolean {
  return getUserGeminiApiKey().length > 0;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string; code?: number };
}

async function callGeminiV1(
  apiKey: string,
  model: string,
  prompt: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    fileDataParts?: Array<{ mimeType: string; fileUri: string }>;
  }
): Promise<string> {
  const url = `${GEMINI_V1_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const contents: any[] = [];

  if (options?.fileDataParts && options.fileDataParts.length > 0) {
    const parts: any[] = [];
    for (const fd of options.fileDataParts) {
      parts.push({ fileData: { mimeType: fd.mimeType, fileUri: fd.fileUri } });
    }
    parts.push({ text: prompt });
    contents.push({ role: 'user', parts });
  } else {
    contents.push({ role: 'user', parts: [{ text: prompt }] });
  }

  const body: any = {
    contents,
    generationConfig: {
      temperature: options?.temperature ?? 0.3,
      maxOutputTokens: options?.maxOutputTokens ?? 400,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = (errorData as any)?.error?.message || `Error de API Gemini v1 (${response.status})`;
    throw new Error(msg);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Simple text generation ─────────────────────────────────────────────────

export async function generateTextWithUserKey(prompt: string): Promise<string> {
  const apiKey = getUserGeminiApiKey();
  if (!apiKey) throw new Error(AI_KEY_MISSING_MESSAGE);
  return callGeminiV1(apiKey, CLINICAL_MODEL, prompt);
}

// ─── Clinical Treatment Plan Generation — "Modo Cirujano" ─────────────────────

const CLINICAL_INSTRUCTIONS = `INSTRUCCIONES PARA EL PLAN DE INTERVENCION:
Actua como un psicologo clinico breve. Analiza el caso y responde UNICAMENTE con 3 parrafos concisos:

Parrafo 1: Conducta prioritaria a modificar.
Parrafo 2: Estrategia tecnica a utilizar.
Parrafo 3: Accion concreta inmediata.

NO saludes, NO hagas introducciones, NO repitas datos que ya te envie.

REGLAS DE FORMATO (OBLIGATORIAS):
- Escribe en prosa narrativa natural.
- PROHIBIDO usar asteriscos (*), signos de numero (#), guiones dobles (--) ni markdown.
- PROHIBIDO usar viñetas o listas numeradas.
- Los titulos de seccion se escriben UNICAMENTE en mayusculas, sin subrayar ni decorar.
- PROHIBIDO usar negritas, cursivas ni formato especial.
- NUNCA menciones que eres una IA.
- Escribe como si el informe fuera firmado por un psicologo clinico real.

DATOS DEL CASO:`;

export interface PdfFileReference {
    mimeType: string;
    fileUri: string;
    title: string;
}

export async function generateClinicalPlan(
    leanContext: string,
    options?: { pdfFiles?: PdfFileReference[] }
): Promise<string> {
    const apiKey = getUserGeminiApiKey();
    if (!apiKey) throw new Error(AI_KEY_MISSING_MESSAGE);

    // Embed instructions directly in the prompt (v1 compatible)
    const userPrompt = `${CLINICAL_INSTRUCTIONS}\n\n${leanContext}\n\nGenera ahora el Plan de Intervencion de 3 parrafos.`;

    const fileDataParts = options?.pdfFiles?.map(f => ({
        mimeType: f.mimeType,
        fileUri: f.fileUri,
    }));

    const raw = await callGeminiV1(apiKey, CLINICAL_MODEL, userPrompt, {
        temperature: 0.3,
        maxOutputTokens: 400,
        fileDataParts,
    });

    let text = raw;
    text = text.replace(/^#{1,6}\s+/gm, '');
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/___([^_]+)___/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/---+/g, '');
    text = text.replace(/^[-*]\s+/gm, '');
    text = text.replace(/^\s*[a-z]\)\s+/gm, '');
    text = text.replace(/^\s*\d+[.)]\s+/gm, '');
    text = text.replace(/^\s{2,}/gm, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
}
