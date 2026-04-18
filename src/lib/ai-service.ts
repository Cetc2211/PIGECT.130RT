'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

export const USER_GEMINI_API_KEY_STORAGE_KEY = 'USER_GEMINI_API_KEY';
export const AI_KEY_MISSING_MESSAGE = 'Configura tu API Key en Ajustes para activar la IA';

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
  if (!apiKey) {
    throw new Error(AI_KEY_MISSING_MESSAGE);
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const response = await model.generateContent(prompt);
  return response.response.text() || '';
}
