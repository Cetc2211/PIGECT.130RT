'use client';

// ============================================================================
// GEMINI FILES SERVICE — Upload PDFs to Gemini File API for native PDF reading
// Uses the user's API key to upload files, then references them in generation
// ============================================================================

import { getUserGeminiApiKey, AI_KEY_MISSING_MESSAGE } from './ai-service';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/upload/v1beta';
const GEMINI_FILES_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiFileUploadResult {
    name: string;       // "files/abc123"
    uri: string;        // "https://generativelanguage.googleapis.com/v1beta/files/abc123"
    mimeType: string;
    state: string;
}

/**
 * Upload a file to the Gemini File API using the user's API key.
 * Supports PDF, images, and other media types.
 */
export async function uploadFileToGemini(
    file: File,
    onProgress?: (progress: number) => void
): Promise<GeminiFileUploadResult> {
    const apiKey = getUserGeminiApiKey();
    if (!apiKey) {
        throw new Error(AI_KEY_MISSING_MESSAGE);
    }

    const mimeType = file.type || 'application/pdf';

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    resolve({
                        name: result.name,
                        uri: result.uri,
                        mimeType: result.mimeType || mimeType,
                        state: result.state,
                    });
                } catch {
                    reject(new Error('Error al procesar la respuesta del servidor.'));
                }
            } else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    reject(new Error(errorData.error?.message || `Error al subir archivo (${xhr.status})`));
                } catch {
                    reject(new Error(`Error al subir archivo (${xhr.status})`));
                }
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Error de red al subir el archivo. Verifica tu conexión a internet.'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Subida de archivo cancelada.'));
        });

        xhr.open('POST', `${GEMINI_API_BASE}/files?key=${apiKey}`);
        xhr.setRequestHeader('X-Goog-Upload-Protocol', 'multipart');
        xhr.setRequestHeader('X-Goog-Upload-Command', 'start');
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('X-Goog-Upload-Header-Content-Length', file.size.toString());
        xhr.setRequestHeader('X-Goog-Upload-Header-Content-Type', mimeType);
        xhr.setRequestHeader('X-Goog-Upload-Header-Content-Disposition', `attachment; filename="${file.name}"`);

        xhr.send(file);
    });
}

/**
 * Check the status of an uploaded file (active, processing, etc.)
 */
export async function getGeminiFileStatus(fileName: string): Promise<string | null> {
    const apiKey = getUserGeminiApiKey();
    if (!apiKey) return null;

    try {
        const response = await fetch(`${GEMINI_FILES_BASE}/${fileName}?key=${apiKey}`);
        if (response.ok) {
            const data = await response.json();
            return data.state || 'UNKNOWN';
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Wait for a file to finish processing (become ACTIVE)
 */
export async function waitForFileActive(
    fileName: string,
    maxWaitMs: number = 60000,
    pollIntervalMs: number = 2000
): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        const state = await getGeminiFileStatus(fileName);
        if (state === 'ACTIVE') return true;
        if (state === 'FAILED') return false;

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return false; // Timeout
}

/**
 * Delete a file from the Gemini File API
 */
export async function deleteFileFromGemini(fileName: string): Promise<boolean> {
    const apiKey = getUserGeminiApiKey();
    if (!apiKey) return false;

    try {
        const response = await fetch(`${GEMINI_FILES_BASE}/${fileName}?key=${apiKey}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch {
        return false;
    }
}
