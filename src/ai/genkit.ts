'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

if (!process.env.GEMINI_API_KEY) {
  console.warn("ADVERTENCIA: GEMINI_API_KEY no encontrada. La IA no funcionara correctamente.");
}

export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1beta'})],
});

// Re-export z from genkit for AI flows that need Zod schemas compatible with genkit internals
export { z } from 'genkit';
