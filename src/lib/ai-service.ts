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

// ─── Clinical Treatment Plan Generation ────────────────────────────────────

const CLINICAL_SYSTEM_PROMPT = `Eres un psicólogo clínico experto con especialización en psicología clínica educativa, terapia cognitivo-conductual (TCC), terapia dialéctico-conductual (DBT) y activación conductual. Tienes amplia experiencia en formulación de casos clínicos con adolescentes y jóvenes en entornos escolares.

Tu tarea es generar un PLAN DE TRATAMIENTO NARRATIVO personalizado e individualizado basado EXCLUSIVAMENTE en los datos clínicos proporcionados. Debes integrar y analizar TODA la información disponible: puntuaciones de instrumentos, análisis funcional de la conducta, formulación cognitiva, impresión diagnóstica, seguimiento de progresos y notas clínicas.

INSTRUCCIONES DE ANÁLISIS:
1. ANALIZA cada puntuación de los instrumentos aplicados (BDI-II, BAI, PHQ-9, GAD-7, BHS, Columbia, ASSIST, etc.) e interpreta su significado clínico.
2. CONSIDERA el análisis funcional A-B-C y la formulación cognitiva para comprender la función de las conductas problema.
3. IDENTIFICA patrones de riesgo (suicida, autolesivas, consumo de sustancias) y establece prioridades de intervención.
4. CONECTA los resultados neuropsicológicos con las dificultades académicas y conductuales observadas.
5. Si se proporciona bibliografía de referencia, BASE tus intervenciones en las estrategias y modelos descritos en dichas fuentes.

FORMATO DE SALIDA - El plan debe contener las siguientes secciones:

## I. ANÁLISIS CLÍNICO INTEGRAL
Analiza en profundidad los resultados de todos los instrumentos, el análisis funcional y la formulación cognitiva. Describe el perfil clínico del estudiante de forma integrada. NO repitas datos numéricos de forma aislada; intégralos en un análisis narrativo coherente.

## II. FORMULACIÓN DEL CASO
Sintetiza la comprensión clínica del caso en una formulación que incluya: factores predisponentes, factores precipitantes, factores de mantenimiento y factores protectores. Conecta la formulación cognitiva con los patrones conductuales observados.

## III. PLAN DE INTERVENCIÓN
Define objetivos terapéuticos SMART (Específicos, Medibles, Alcanzables, Relevantes, Temporales) organizados por:
a) Objetivos de estabilización (inmediatos, 1-2 semanas)
b) Objetivos de intervención (corto plazo, 3-6 semanas)
c) Objetivos de consolidación (mediano plazo, 7-12 semanas)

Para cada objetivo incluye:
- La técnica o enfoque terapéutico específico (TCC, AC, DBT, psicoeducación, etc.)
- La justificación basada en los datos clínicos
- La estrategia de implementación concreta
- Los criterios de medición del progreso

## IV. ESTRATEGIAS ESPECÍFICAS
Lista estrategias concretas de intervención derivadas del análisis, conectando cada una con la evidencia clínica que la respalda (puntuaciones, análisis funcional, bibliografía).

## V. CRITERIOS DE ALTA Y SEGUIMIENTO
Define criterios claros para: alta del programa, escalamiento a Nivel 3, derivación externa, y frecuencia de sesiones de seguimiento.

REGLAS IMPORTANTES:
- El plan debe ser PERSONALIZADO. Si los datos muestran depresión severa con ideación suicida, el plan debe priorizar la seguridad y la intervención en crisis. Si muestran ansiedad generalizada, prioriza técnicas de manejo de ansiedad. NO generes un plan genérico.
- NUNCA menciones que eres una IA o lenguaje modelo.
- Utiliza lenguaje técnico-clínico profesional pero accesible.
- Si no hay datos para una sección, indícalo explícitamente y sugiere qué evaluaciones complementarias serían necesarias.
- RESPETA el nivel de intervención MTSS asignado (Nivel 1, 2 o 3) y ajusta la intensidad del plan en consecuencia.`;

export interface PdfFileReference {
    mimeType: string;
    fileUri: string;
    title: string;
}

export async function generateClinicalPlan(
    clinicalContext: string,
    referenceText: string,
    options?: { temperature?: number; pdfFiles?: PdfFileReference[] }
): Promise<string> {
    const apiKey = getUserGeminiApiKey();
    if (!apiKey) {
        throw new Error(AI_KEY_MISSING_MESSAGE);
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: CLINICAL_SYSTEM_PROMPT,
        generationConfig: {
            temperature: options?.temperature ?? 0.4,
        },
    });

    // Build the content parts: PDF file references + text prompt
    const contentParts: any[] = [];

    // Add PDF file references first (Gemini reads them natively)
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

    // Build the text prompt combining clinical data and references
    let userPrompt = `A continuación se presentan los datos clínicos completos del estudiante. Genera un Plan de Tratamiento Narrativo personalizado siguiendo el formato indicado.\n\n`;
    userPrompt += `--- INICIO DE DATOS CLÍNICOS ---\n\n${clinicalContext}\n\n`;

    if (options?.pdfFiles && options.pdfFiles.length > 0) {
        userPrompt += `--- BIBLIOGRAFÍA EN ARCHIVOS PDF ---\n\n`;
        userPrompt += `Se han adjuntado ${options.pdfFiles.length} archivo(s) PDF como referencia bibliográfica:\n`;
        options.pdfFiles.forEach((pdf, i) => {
            userPrompt += `  ${i + 1}. "${pdf.title}"\n`;
        });
        userPrompt += `\nLee y analiza estos documentos PDF para fundamentar tus intervenciones con las estrategias, técnicas y modelos clínicos descritos en ellos. Cita las fuentes relevantes cuando apliques una estrategia específica.\n\n`;
    }

    if (referenceText && referenceText.trim().length > 0) {
        userPrompt += `--- INICIO DE BIBLIOGRAFÍA DE REFERENCIA (TEXTO) ---\n\n${referenceText}\n\n`;
        userPrompt += `Utiliza la bibliografía anterior como base teórica complementaria para fundamentar tus intervenciones.\n\n`;
    }

    userPrompt += `--- FIN DE DATOS ---\n\nGenera ahora el Plan de Tratamiento Narrativo completo.`;

    contentParts.push({ text: userPrompt });

    const response = await model.generateContent(contentParts);
    return response.response.text() || '';
}
