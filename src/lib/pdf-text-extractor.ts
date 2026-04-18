'use client';

// ============================================================================
// PDF TEXT EXTRACTOR — Client-side PDF text extraction using pdf.js
// Falls back gracefully if pdf.js is not available
// ============================================================================

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfJs(): Promise<typeof import('pdfjs-dist') | null> {
    if (pdfjsLib) return pdfjsLib;

    try {
        pdfjsLib = await import('pdfjs-dist');
        // Configure worker using CDN to avoid webpack bundling issues
        const version = pdfjsLib.version;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
        return pdfjsLib;
    } catch (error) {
        console.warn('[pdf-text-extractor] No se pudo cargar pdf.js:', error);
        return null;
    }
}

/**
 * Extract text content from a PDF file.
 * Returns the extracted text string.
 */
export async function extractTextFromPDF(file: File): Promise<{ text: string; pageCount: number }> {
    const pdf = await loadPdfJs();
    if (!pdf) {
        throw new Error('No se pudo cargar la biblioteca de extracción de PDF. Intente con un archivo .txt.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdf.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    const pageCount = pdfDocument.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        textParts.push(`[Página ${i}]\n${pageText}`);
    }

    return {
        text: textParts.join('\n\n'),
        pageCount,
    };
}

/**
 * Check if PDF extraction is available
 */
export async function isPdfExtractionAvailable(): Promise<boolean> {
    const pdf = await loadPdfJs();
    return pdf !== null;
}
