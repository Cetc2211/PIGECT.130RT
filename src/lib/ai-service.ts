'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBuiltInBibliographyText } from './built-in-bibliography';

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
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

ESTRUCTURA DEL PLAN - El documento debe contener las siguientes secciones, escritas con títulos claros en mayúsculas seguidos del contenido narrativo:

I. ANALISIS CLINICO INTEGRAL
Analiza en profundidad los resultados de todos los instrumentos, el análisis funcional y la formulación cognitiva. Describe el perfil clínico del estudiante de forma integrada en prosa narrativa. NO repitas datos numéricos de forma aislada; integralos en un análisis interpretativo coherente.

II. FORMULACION DEL CASO
Sintetiza la comprensión clínica del caso en una formulación que incluya: factores predisponentes, factores precipitantes, factores de mantenimiento y factores protectores. Conecta la formulación cognitiva con los patrones conductuales observados.

III. PLAN DE INTERVENCION
Define objetivos terapéuticos SMART organizados por:
a) Objetivos de estabilizacion (inmediatos, 1-2 semanas)
b) Objetivos de intervencion (corto plazo, 3-6 semanas)
c) Objetivos de consolidacion (mediano plazo, 7-12 semanas)

Para cada objetivo incluye la tecnica terapeutica, la justificacion basada en los datos clinicos, la estrategia de implementacion concreta y los criterios de medicion del progreso.

IV. ESTRATEGIAS ESPECIFICAS
Describe estrategias concretas de intervencion derivadas del analisis, conectando cada una con la evidencia clinica que la respalda (puntuaciones, analisis funcional, bibliografia).

V. CRITERIOS DE ALTA Y SEGUIMIENTO
Define criterios claros para: alta del programa, escalamiento a Nivel 3, derivacion externa y frecuencia de sesiones de seguimiento.

REGLAS DE FORMATO OBLIGATORIAS (CRITICAS):
- Escribe TODO el texto en prosa narrativa natural, como lo redactaria un profesional clinico en un expediente real.
- NO uses asteriscos (*), signos de numero (#), guiones dobles (--) ni caracteres de formato markdown en ningun momento.
- NO uses viñetas con simbolos como *, -, o >. Si necesitas enumerar elementos, hazlo en prosa: "En primer lugar...", "Asimismo...", "Adicionalmente...", "Por ultimo...".
- Los titulos de seccion se escriben UNICAMENTE en mayusculas, en una sola linea, sin subrayar ni decorar.
- Cada parrafo debe tener al menos 3 oraciones completas. Evita parrafos de una sola linea.
- Usa un tono formal, profesional y objetivo, como el de un informe clinico institucional.
- Utiliza terminologia tecnica clinica adecuada (TCC, DBT, activacion conductual, reestructuracion cognitiva, formulacion cognitiva, etc.) de forma natural dentro del texto.
- Evita repetir la misma estructura oracional. Alterna entre oraciones simples y compuestas.
- NO uses negritas, cursivas ni cualquier formato especial. Solo texto plano con titulos en mayusculas.
- NUNCA menciones que eres una IA, un modelo de lenguaje, una inteligencia artificial ni nada similar.
- Escribe como si el informe fuera a ser firmado por un psicologo clinico real.

REGLAS CLINICAS:
- El plan debe ser PERSONALIZADO para cada caso. Si los datos muestran depresion severa con ideacion suicida, prioriza la seguridad y la intervencion en crisis. Si muestran ansiedad generalizada, prioriza tecnicas de manejo de ansiedad. NO generes un plan generico.
- Si no hay datos para una seccion, indicalo explícitamente y sugiere que evaluaciones complementarias serian necesarias.
- RESPETA el nivel de intervencion MTSS asignado (Nivel 1, 2 o 3) y ajusta la intensidad del plan en consecuencia.`;

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
        model: 'gemini-2.5-flash',
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

    // Build the text prompt combining clinical data, built-in bibliography, and user references
    let userPrompt = `A continuacion se presentan los datos clinicos completos del estudiante y la bibliografia clinica de referencia. Genera un Plan de Tratamiento Narrativo personalizado siguiendo las instrucciones del sistema.\n\n`;
    userPrompt += `--- INICIO DE DATOS CLINICOS ---\n\n${clinicalContext}\n\n`;

    // Always include built-in clinical bibliography (hardcoded in the application)
    const builtInText = getBuiltInBibliographyText();
    if (builtInText) {
        userPrompt += `--- BIBLIOTECA CLINICA DE REFERENCIA (integrada en la aplicacion) ---\n\n${builtInText}\n\n`;
        userPrompt += `Utiliza la biblioteca clinica anterior como fundamento teorico principal para tus intervenciones. Cita las fuentes relevantes cuando apliques una estrategia o tecnica especifica.\n\n`;
    }

    // Include PDF file references info
    if (options?.pdfFiles && options.pdfFiles.length > 0) {
        userPrompt += `--- BIBLIOGRAFIA EN ARCHIVOS PDF ADICIONALES ---\n\n`;
        userPrompt += `Se han adjuntado ${options.pdfFiles.length} archivo(s) PDF como referencia bibliografica adicional:\n`;
        options.pdfFiles.forEach((pdf, i) => {
            userPrompt += `  ${i + 1}. "${pdf.title}"\n`;
        });
        userPrompt += `\nLee y analiza estos documentos PDF para complementar las estrategias clinicas.\n\n`;
    }

    // Include user-uploaded text references
    if (referenceText && referenceText.trim().length > 0) {
        userPrompt += `--- BIBLIOGRAFIA ADICIONAL CARGADA POR EL ESPECIALISTA ---\n\n${referenceText}\n\n`;
        userPrompt += `Integra la bibliografia anterior como base teorica complementaria.\n\n`;
    }

    userPrompt += `--- FIN DE DATOS ---\n\nGenera ahora el Plan de Tratamiento Narrativo completo. Recuerda: escribe en prosa clinica natural, sin asteriscos, sin signos de numero, sin formato markdown, como lo redactaria un profesional en un expediente clinico real.`;

    contentParts.push({ text: userPrompt });

    const response = await model.generateContent(contentParts);
    let text = response.response.text() || '';

    // Post-process: clean up any markdown formatting that might slip through
    text = text.replace(/^#{1,6}\s+/gm, '');           // Remove # headings
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');     // Remove **bold**
    text = text.replace(/\*([^*]+)\*/g, '$1');         // Remove *italic*
    text = text.replace(/---+/g, '');                    // Remove --- separators
    text = text.replace(/^[-*]\s+/gm, '');              // Remove - or * list markers
    text = text.replace(/^\s*\n{3,}/gm, '\n\n');       // Collapse excessive newlines

    return text;
}
