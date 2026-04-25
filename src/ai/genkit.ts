'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const plugins: any[] = [];
if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI({apiVersion: 'v1beta'}));
} else {
  console.warn("⚠️ ADVERTENCIA: GEMINI_API_KEY no encontrada. La IA no funcionará correctamente.");
}

export const ai = genkit({
  plugins,
  // @ts-expect-error enableTracingAndMetrics not in current genkit version
  enableTracingAndMetrics: true,
});
