#!/usr/bin/env node
/**
 * Validate the governed prompt registry.
 *
 * Usage:
 *   node factory/ai/core/scripts/validate-prompt-registry.mjs
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatRegistryIssues, validatePromptRegistryFile } from '../src/prompt-registry/validator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../../..');
const REGISTRY_PATH = resolve(REPO_ROOT, 'factory/ai/core/prompt-registry.json');

const result = await validatePromptRegistryFile({
  repoRoot: REPO_ROOT,
  registryPath: REGISTRY_PATH,
});

if (!result.ok) {
  console.error('Prompt registry validation failed:');
  console.error(formatRegistryIssues(result.issues));
  process.exitCode = 1;
} else {
  const count = result.registry.prompts.length;
  console.log(`Prompt registry validation passed (${count} prompts).`);
}
