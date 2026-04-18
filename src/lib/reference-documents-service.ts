'use client';

// ============================================================================
// REFERENCE DOCUMENTS SERVICE — IndexedDB storage for AI bibliography context
// Supports: .txt, .md, .csv, .json (text) and .pdf (Gemini File API + pdf.js)
// ============================================================================

import { extractTextFromPDF } from './pdf-text-extractor';
import { uploadFileToGemini, deleteFileFromGemini, waitForFileActive } from './gemini-files-service';

const DB_NAME = 'pigec_references';
const DB_VERSION = 2; // Incremented for file_blob support
const STORE_NAME = 'reference_documents';

export interface ReferenceDocument {
    id: string;
    title: string;
    author: string;
    uploadedAt: string;
    contentText: string;       // Extracted text (for text files) or summary
    fileName: string;
    fileSize: number;
    mimeType: string;
    tags: string[];
    // PDF-specific fields
    isPdf?: boolean;
    pdfPageCount?: number;
    geminiFileName?: string;   // Gemini File API name (e.g., "files/abc123")
    geminiUri?: string;        // Gemini File API URI
    textExtractionMethod?: 'native' | 'pdfjs' | 'none';
    uploadProgress?: number;
}

// ─── IndexedDB Helpers ─────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('IndexedDB no está disponible en el servidor'));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    return openDB().then((db) => {
        const tx = db.transaction(STORE_NAME, mode);
        return tx.objectStore(STORE_NAME);
    });
}

// ─── CRUD Operations ──────────────────────────────────────────────────────

export async function saveReferenceDocument(doc: ReferenceDocument): Promise<void> {
    const store = await getStore('readwrite');
    return new Promise((resolve, reject) => {
        const request = store.put(doc);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getReferenceDocuments(): Promise<ReferenceDocument[]> {
    const store = await getStore('readonly');
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

export async function getReferenceDocumentById(id: string): Promise<ReferenceDocument | undefined> {
    const store = await getStore('readonly');
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || undefined);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteReferenceDocument(id: string): Promise<void> {
    // Also try to delete from Gemini if it was uploaded
    try {
        const doc = await getReferenceDocumentById(id);
        if (doc?.geminiFileName) {
            await deleteFileFromGemini(doc.geminiFileName);
        }
    } catch (error) {
        console.warn('Error al eliminar archivo de Gemini:', error);
    }

    const store = await getStore('readwrite');
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ─── Concatenated Text for AI Context ─────────────────────────────────────

export async function getAllReferenceText(): Promise<string> {
    const docs = await getReferenceDocuments();
    if (docs.length === 0) return '';

    const textDocs = docs.filter((d) => !d.isPdf || d.contentText);
    if (textDocs.length === 0) return '';

    const sections = textDocs.map((doc) => {
        const parts = [`--- ${doc.title} ---`, `Autor: ${doc.author}`, `Archivo: ${doc.fileName}`];
        if (doc.tags.length > 0) {
            parts.push(`Etiquetas: ${doc.tags.join(', ')}`);
        }
        if (doc.isPdf) {
            parts.push(`Páginas: ${doc.pdfPageCount || 'N/A'}`);
            parts.push(`Método de extracción: ${doc.textExtractionMethod || 'N/A'}`);
        }
        parts.push('', doc.contentText);
        return parts.join('\n');
    });

    const pdfOnlyDocs = docs.filter((d) => d.isPdf && !d.contentText);
    let pdfNotice = '';
    if (pdfOnlyDocs.length > 0) {
        pdfNotice = `\n\n[NOTA: ${pdfOnlyDocs.length} archivo(s) PDF se procesarán de forma nativa por la IA para mejor calidad de lectura. Estos archivos no se muestran como texto aquí pero están disponibles para la generación del plan.]\n`;
    }

    return `=== BIBLIOGRAFÍA DE REFERENCIA (${docs.length} documentos) ===\n\n` + sections.join('\n\n') + pdfNotice;
}

/**
 * Get all PDF documents that need to be referenced via Gemini File API
 */
export async function getPdfDocumentsForGeneration(): Promise<ReferenceDocument[]> {
    const docs = await getReferenceDocuments();
    return docs.filter((d) => d.isPdf && d.geminiUri);
}

// ─── File Upload & Processing ─────────────────────────────────────────────

export interface UploadProgressCallback {
    onProgress: (percent: number, stage: string) => void;
}

/**
 * Process and upload a reference file.
 * For text files: extract text and store in IndexedDB.
 * For PDFs: upload to Gemini File API + extract text with pdf.js as fallback.
 */
export async function processAndUploadFile(
    file: File,
    onProgress?: UploadProgressCallback
): Promise<ReferenceDocument> {
    const fileName = file.name;
    const isPdf = fileName.toLowerCase().endsWith('.pdf');

    const docId = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const doc: ReferenceDocument = {
        id: docId,
        title: fileName.replace(/\.[^/.]+$/, ''),
        author: 'No especificado',
        uploadedAt: new Date().toISOString(),
        contentText: '',
        fileName,
        fileSize: file.size,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
        tags: [],
        isPdf,
    };

    if (isPdf) {
        // ── PDF Processing ──
        // Step 1: Upload to Gemini File API
        onProgress?.onProgress(10, 'Subiendo PDF a Gemini...');

        try {
            const geminiFile = await uploadFileToGemini(file, (pct) => {
                onProgress?.onProgress(10 + Math.round(pct * 0.6), 'Subiendo PDF a Gemini...');
            });

            doc.geminiFileName = geminiFile.name;
            doc.geminiUri = geminiFile.uri;
            doc.textExtractionMethod = 'native';

            // Step 2: Wait for file to be processed
            onProgress?.onProgress(75, 'Procesando PDF en Gemini...');
            const isActive = await waitForFileActive(geminiFile.name, 60000, 2000);

            if (!isActive) {
                // Gemini processing failed, try pdf.js fallback
                onProgress?.onProgress(80, 'Extrayendo texto localmente (fallback)...');
                const { text, pageCount } = await extractTextFromPDF(file);
                doc.contentText = text;
                doc.pdfPageCount = pageCount;
                doc.textExtractionMethod = 'pdfjs';
                // Clear Gemini data since it failed
                doc.geminiFileName = undefined;
                doc.geminiUri = undefined;
            } else {
                doc.pdfPageCount = undefined; // Will be determined by Gemini
                doc.contentText = `[PDF "${fileName}" procesado por Gemini de forma nativa. El texto se lee directamente durante la generación del plan para máxima calidad.]`;
            }

            onProgress?.onProgress(90, 'Guardando...');
        } catch (geminiError) {
            console.warn('[reference-documents] Gemini upload failed, falling back to pdf.js:', geminiError);
            // Gemini upload failed, try pdf.js extraction
            onProgress?.onProgress(30, 'Extrayendo texto del PDF localmente...');

            try {
                const { text, pageCount } = await extractTextFromPDF(file);
                doc.contentText = text;
                doc.pdfPageCount = pageCount;
                doc.textExtractionMethod = 'pdfjs';
                onProgress?.onProgress(90, 'Guardando...');
            } catch (pdfError) {
                console.error('[reference-documents] pdf.js extraction also failed:', pdfError);
                doc.contentText = `[Error al procesar PDF "${fileName}"]. No se pudo extraer el texto. Intente convertir el PDF a .txt manualmente.]`;
                doc.textExtractionMethod = 'none';
            }
        }
    } else {
        // ── Text File Processing ──
        onProgress?.onProgress(20, 'Leyendo archivo de texto...');

        try {
            if (fileName.toLowerCase().endsWith('.json')) {
                const text = await file.text();
                try {
                    const parsed = JSON.parse(text);
                    doc.contentText = JSON.stringify(parsed, null, 2);
                } catch {
                    doc.contentText = text;
                }
            } else {
                doc.contentText = await file.text();
            }
            onProgress?.onProgress(90, 'Guardando...');
        } catch (error) {
            doc.contentText = `[Error al leer archivo "${fileName}"]: ${error}]`;
        }
    }

    await saveReferenceDocument(doc);
    onProgress?.onProgress(100, 'Completado');

    return doc;
}

// ─── Legacy text extraction (kept for backward compatibility) ─────────────

/**
 * @deprecated Use processAndUploadFile() instead for full PDF support
 */
export async function extractTextFromFile(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
        return file.text();
    }

    if (fileName.endsWith('.json')) {
        const text = await file.text();
        try {
            const parsed = JSON.parse(text);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return text;
        }
    }

    if (fileName.endsWith('.pdf')) {
        try {
            const { text } = await extractTextFromPDF(file);
            return text;
        } catch {
            return `[Error: No se pudo extraer texto del PDF "${file.name}". Utilice el diálogo de Bibliografía para una mejor experiencia con PDFs.]`;
        }
    }

    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        return `[Contenido Word: "${file.name}"]\n\nNOTA: La extracción automática de documentos Word no está disponible. Por favor, extraiga el texto manualmente y guárdelo como archivo .txt.`;
    }

    try {
        return await file.text();
    } catch {
        return `[Archivo no compatible: "${file.name}"]\n\nLos formatos compatibles son: .txt, .md, .csv, .json, .pdf`;
    }
}
