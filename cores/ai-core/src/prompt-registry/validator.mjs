/**
 * Prompt Registry validator.
 *
 * Reads local JSON and verifies shape + referenced files.
 * No provider, no network, no dependency.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validatePromptRegistryShape } from './model.mjs';

function addIssue(issues, path, message) {
  issues.push({ path, message });
}

function unique(values) {
  return [...new Set(values)];
}

export function formatRegistryIssues(issues) {
  if (issues.length === 0) {
    return 'Prompt registry is valid.';
  }

  return issues.map((issue) => `- ${issue.path}: ${issue.message}`).join('\n');
}

export async function readPromptRegistryFile(registryPath) {
  const raw = await readFile(registryPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {
      __parseError: error instanceof Error ? error.message : 'invalid JSON',
    };
  }
}

export function validatePromptRegistryReferences(registry, repoRoot) {
  const issues = [];

  if (!registry || !Array.isArray(registry.prompts)) {
    return issues;
  }

  registry.prompts.forEach((prompt, index) => {
    if (!prompt || typeof prompt !== 'object') {
      return;
    }

    const promptPath = typeof prompt.path === 'string' ? prompt.path : '';
    if (promptPath && !existsSync(resolve(repoRoot, promptPath))) {
      addIssue(issues, `prompts[${index}].path`, `referenced prompt file does not exist: ${promptPath}`);
    }

    const referencedDocs = unique([
      ...(Array.isArray(prompt.requiredDocuments) ? prompt.requiredDocuments : []),
      ...(Array.isArray(prompt.allowedFiles) ? prompt.allowedFiles : []),
    ]);

    referencedDocs.forEach((docPath) => {
      if (!existsSync(resolve(repoRoot, docPath))) {
        addIssue(issues, `prompts[${index}].requiredDocuments`, `referenced document does not exist: ${docPath}`);
      }
    });
  });

  return issues;
}

export async function validatePromptRegistryFile(options) {
  const { repoRoot, registryPath } = options;
  const registry = await readPromptRegistryFile(registryPath);

  if (registry && registry.__parseError) {
    return {
      ok: false,
      registry: null,
      issues: [{ path: registryPath, message: `invalid JSON: ${registry.__parseError}` }],
    };
  }

  const issues = [
    ...validatePromptRegistryShape(registry),
    ...validatePromptRegistryReferences(registry, repoRoot),
  ];

  return {
    ok: issues.length === 0,
    registry,
    issues,
  };
}
