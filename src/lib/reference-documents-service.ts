'use client';

// ============================================================================
// REFERENCE DOCUMENTS SERVICE — IndexedDB storage for AI bibliography context
// ============================================================================

const DB_NAME = 'pigec_references';
const DB_VERSION = 1;
const STORE_NAME = 'reference_documents';

export interface ReferenceDocument {
    id: string;
    title: string;
    author: string;
    uploadedAt: string;
    contentText: string;
    fileName: string;
    fileSize: number;
    tags: string[];
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

    const sections = docs.map((doc) => {
        const parts = [`--- ${doc.title} ---`, `Autor: ${doc.author}`, `Archivo: ${doc.fileName}`];
        if (doc.tags.length > 0) {
            parts.push(`Etiquetas: ${doc.tags.join(', ')}`);
        }
        parts.push('', doc.contentText);
        return parts.join('\n');
    });

    return `=== BIBLIOGRAFÍA DE REFERENCIA (${docs.length} documentos) ===\n\n` + sections.join('\n\n');
}

// ─── Text Extraction from Files ───────────────────────────────────────────

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

    // For PDF, DOCX, etc. — return a placeholder indicating manual extraction is needed
    if (fileName.endsWith('.pdf')) {
        return `[Contenido PDF: "${file.name}"]\n\nNOTA: La extracción automática de PDF no está disponible. Por favor, extraiga el texto manualmente y guárdelo como archivo .txt para incluirlo como referencia.`;
    }

    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        return `[Contenido Word: "${file.name}"]\n\nNOTA: La extracción automática de documentos Word no está disponible. Por favor, extraiga el texto manualmente y guárdelo como archivo .txt para incluirlo como referencia.`;
    }

    // Attempt to read as text for other file types
    try {
        return await file.text();
    } catch {
        return `[Archivo no compatible: "${file.name}"]\n\nNo se pudo extraer el texto de este archivo. Los formatos compatibles son: .txt, .md, .csv, .json`;
    }
}
