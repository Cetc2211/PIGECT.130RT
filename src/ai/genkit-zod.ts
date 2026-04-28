/**
 * @fileoverview Re-export of Zod from genkit for use in AI flow schemas.
 *
 * This file exists separately from genkit.ts because genkit.ts uses the
 * 'use server' directive (Next.js), which only allows async function exports.
 * Importing 'z' from this file avoids the "Only async functions are allowed
 * to be exported in a 'use server' file" build error.
 */
export { z } from 'genkit';
