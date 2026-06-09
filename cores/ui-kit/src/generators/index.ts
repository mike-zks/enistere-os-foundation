/** Générateurs d'artefacts (internes au package). Sortie déterministe. */
import { generateTokensCss } from './css.js';
import { generateTokensJson } from './json.js';
import { generateTokensTs } from './typescript.js';

export { generateTokensJson } from './json.js';
export { generateTokensTs } from './typescript.js';
export { generateTokensCss } from './css.js';

export interface GeneratedArtifacts {
  json: string;
  typescript: string;
  css: string;
}

export function generateAll(): GeneratedArtifacts {
  return {
    json: generateTokensJson(),
    typescript: generateTokensTs(),
    css: generateTokensCss(),
  };
}
