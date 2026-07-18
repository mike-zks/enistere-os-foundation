// @ts-check
/** Valide les tokens par défaut (aucune écriture). Code 0 si valide, non nul sinon. */
import { validateDefaultTokens } from '../dist/validation/validate-tokens.js';

const { valid, errors } = validateDefaultTokens();
if (!valid) {
  console.error('Token validation FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'valid' }, null, 2));
