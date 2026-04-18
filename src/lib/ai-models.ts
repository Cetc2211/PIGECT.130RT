// Fixed model: gemini-2.0-flash (current stable model)
export const DEFAULT_MODEL = 'gemini-2.0-flash';

// Model aliases - map older model names to current model
const ALIAS_PAIRS: Array<[string, string]> = [
  ['gemini-1.0-pro', 'gemini-2.0-flash'],
  ['gemini-pro', 'gemini-2.0-flash'],
  ['gemini-1.5-pro', 'gemini-2.0-flash'],
  ['gemini-1.5-flash', 'gemini-2.0-flash'],
  ['gemini-2.0-flash', 'gemini-2.0-flash'],
];

const aliasMap = ALIAS_PAIRS.reduce<Record<string, string>>((acc, [alias, canonical]) => {
  acc[alias.toLowerCase()] = canonical;
  return acc;
}, {});

export function normalizeModel(model?: string | null): string {
  if (!model) return DEFAULT_MODEL;
  const key = model.trim().toLowerCase();
  return aliasMap[key] || model;
}

export function describeModel(model: string): string {
  const key = normalizeModel(model);
  switch (key) {
    case 'gemini-1.5-pro':
      return 'Gemini 1.5 Pro';
    case 'gemini-1.5-flash':
      return 'Gemini 1.5 Flash';
    case 'gemini-1.5-flash-8b':
      return 'Gemini 1.5 Flash 8B';
    case 'gemini-1.5-flash':
      return 'Gemini 1.5 Flash';
    default:
      return model;
  }
}

export const FALLBACK_MODELS: string[] = [
  'gemini-2.0-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-1.5-flash',
];

export const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (recomendado)' },
  { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash (experimental)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];
