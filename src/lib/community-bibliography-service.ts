'use client';

// ============================================================================
// COMMUNITY BIBLIOGRAPHY SERVICE
// ============================================================================
// Stores bibliography additions from clinicians in localStorage.
// These entries persist across browser sessions and are automatically
// included in all AI treatment plan generations alongside the built-in library.
//
// To share between clinicians:
// - Use "Exportar Biblioteca Comunitaria" to download as JSON
// - Other clinicians use "Importar Biblioteca Comunitaria" to load it
// - For permanent inclusion, use "Exportar como Codigo" to generate TypeScript
//   that can be added to built-in-bibliography.ts
// ============================================================================

import type { BibliographyEntry } from './built-in-bibliography';

const COMMUNITY_BIB_KEY = 'pigec_community_bibliography';

export interface CommunityBibliographyEntry extends BibliographyEntry {
    id: string;
    addedBy?: string;  // Clinician identifier
    addedAt: string;   // ISO timestamp
}

// ─── CRUD Operations ──────────────────────────────────────────────────────

export function getCommunityBibliography(): CommunityBibliographyEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(COMMUNITY_BIB_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as CommunityBibliographyEntry[];
    } catch {
        return [];
    }
}

export function saveCommunityBibliography(entries: CommunityBibliographyEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(COMMUNITY_BIB_KEY, JSON.stringify(entries));
    } catch (err) {
        console.error('Error saving community bibliography:', err);
    }
}

export function addCommunityBibliographyEntry(entry: Omit<CommunityBibliographyEntry, 'id' | 'addedAt'>): CommunityBibliographyEntry {
    const entries = getCommunityBibliography();
    const newEntry: CommunityBibliographyEntry = {
        ...entry,
        id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        addedAt: new Date().toISOString(),
    };
    entries.push(newEntry);
    saveCommunityBibliography(entries);
    return newEntry;
}

export function deleteCommunityBibliographyEntry(id: string): void {
    const entries = getCommunityBibliography().filter(e => e.id !== id);
    saveCommunityBibliography(entries);
}

// ─── Text Assembly for AI Context ─────────────────────────────────────────

export function getCommunityBibliographyText(): string {
    const entries = getCommunityBibliography();
    if (entries.length === 0) return '';

    const sections = entries.map((entry, index) => {
        return [
            `REFERENCIA COMUNITARIA ${index + 1}: ${entry.title}`,
            `Autor: ${entry.author} (${entry.year})`,
            `Modelo/Enfoque: ${entry.model}`,
            `Agregada por: ${entry.addedBy || 'Clinico'} el ${entry.addedAt ? new Date(entry.addedAt).toLocaleDateString('es-MX') : 'N/A'}`,
            '',
            entry.content,
        ].join('\n');
    });

    return `=== BIBLIOTECA COMUNITARIA (${entries.length} fuentes agregadas por clinicos) ===\n\n` + sections.join('\n\n---\n\n');
}

// ─── Export / Import ──────────────────────────────────────────────────────

/**
 * Export the entire community bibliography as a JSON file for sharing.
 */
export function exportCommunityBibliographyJSON(): string {
    const entries = getCommunityBibliography();
    return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        source: 'PIGEC-130 Community Bibliography',
        entries: entries.map(({ id, ...rest }) => rest), // Remove IDs for clean import
    }, null, 2);
}

/**
 * Import community bibliography entries from a JSON string (shared by another clinician).
 * Merges with existing entries (no duplicates by title+author).
 */
export function importCommunityBibliographyJSON(jsonString: string): { imported: number; skipped: number } {
    const existing = getCommunityBibliography();
    const existingKeys = new Set(existing.map(e => `${e.title}|||${e.author}`));

    let imported = 0;
    let skipped = 0;

    try {
        const data = JSON.parse(jsonString);
        const entries = data.entries || data;

        if (!Array.isArray(entries)) {
            return { imported: 0, skipped: 0 };
        }

        for (const entry of entries) {
            const key = `${entry.title}|||${entry.author}`;
            if (existingKeys.has(key)) {
                skipped++;
                continue;
            }

            const newEntry: CommunityBibliographyEntry = {
                id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                title: entry.title || 'Sin titulo',
                author: entry.author || 'No especificado',
                year: entry.year || new Date().getFullYear(),
                model: entry.model || 'General',
                content: entry.content || '',
                addedBy: entry.addedBy || 'Importado',
                addedAt: entry.addedAt || new Date().toISOString(),
            };

            existing.push(newEntry);
            existingKeys.add(key);
            imported++;
        }

        saveCommunityBibliography(existing);
    } catch {
        // Invalid JSON
    }

    return { imported, skipped };
}

/**
 * Generate TypeScript code snippet for adding entries to built-in-bibliography.ts
 * This allows clinicians to contribute their best references for permanent inclusion.
 */
export function generateCodeExportForBuiltIn(): string {
    const entries = getCommunityBibliography();
    if (entries.length === 0) return '// No hay entradas en la biblioteca comunitaria para exportar.';

    const codeLines = entries.map(entry => {
        // Escape backticks and ${} in template literals
        const safeContent = entry.content
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${');

        return `    {
        title: '${entry.title.replace(/'/g, "\\'")}',
        author: '${entry.author.replace(/'/g, "\\'")}',
        year: ${entry.year},
        model: '${entry.model.replace(/'/g, "\\'")}',
        content: \`${safeContent}\`
    }`;
    });

    return `// Community bibliography entries — generated ${new Date().toISOString()}
// Paste these entries into the BUILT_IN_BIBLIOGRAPHY array in src/lib/built-in-bibliography.ts
// Then remove them from the community library via the /tools page.

${codeLines.join(',\n\n')}`;
}
