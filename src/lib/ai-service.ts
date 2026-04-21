'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

export const USER_GEMINI_API_KEY_STORAGE_KEY = 'USER_GEMINI_API_KEY';
export const AI_KEY_MISSING_MESSAGE = 'Configura tu API Key en Ajustes para activar la IA';

const CLINICAL_MODEL = 'gemini-2.5-flash';

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

export async function generateTextWithUserKey(prompt: string): Promise<string> {
  const apiKey = getUserGeminiApiKey();
  if (!apiKey) throw new Error(AI_KEY_MISSING_MESSAGE);
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: CLINICAL_MODEL });
  const response = await model.generateContent(prompt);
  return response.response.text() || '';
}

// ─── Clinical Treatment Plan Generation — "Modo Cirujano" ─────────────────────

const CLINICAL_SYSTEM_PROMPT = `Actua como un psicologo clinico breve. Analiza el caso y responde UNICAMENTE con 3 parrafos concisos:

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
- Escribe como si el informe fuera firmado por un psicologo clinico real.`;

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

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
        model: CLINICAL_MODEL,
        systemInstruction: CLINICAL_SYSTEM_PROMPT,
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1600,
        },
    });

    const contentParts: any[] = [];

    if (options?.pdfFiles && options.pdfFiles.length > 0) {
        for (const pdfFile of options.pdfFiles) {
            contentParts.push({
                fileData: {
                    mimeType: pdfFile.mimeType,
                    fileUri: pdfFile.fileUri,
                },
            });
        }
    }

    let userPrompt = `DATOS DEL CASO:\n\n${leanContext}\n\n`;
    userPrompt += `Genera ahora el Plan de Intervencion de 3 parrafos.`;

    contentParts.push({ text: userPrompt });

    const response = await model.generateContent(contentParts);
    let text = response.response.text() || '';

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
