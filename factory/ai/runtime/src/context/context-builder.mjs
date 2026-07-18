/**
 * Factory AI Context Builder.
 *
 * Builds a minimal local context from an explicit allow-list.
 * Pure Node module. No provider, no network, no dependency.
 */

import { readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { redactText } from '../redaction/index.mjs';

export const DEFAULT_MAX_FILE_BYTES = 24000;
export const DEFAULT_MAX_TOTAL_BYTES = 80000;

const FORBIDDEN_SEGMENTS = new Set([
  '.git',
  '.next',
  '.expo',
  '.dart_tool',
  '.gradle',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'tmp',
]);

const FORBIDDEN_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  '.npmrc',
  '.pypirc',
]);

function unique(values) {
  return [...new Set(values)];
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeContextPath(input) {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 300) {
    return null;
  }

  const normalized = trimmed.replaceAll('\\', '/').replace(/^\.\/+/, '');
  if (
    normalized.startsWith('/') ||
    normalized.includes('\0') ||
    normalized.includes('//') ||
    normalized.split('/').includes('..')
  ) {
    return null;
  }

  return normalized;
}

export function classifyContextPath(input) {
  const normalized = normalizeContextPath(input);
  if (!normalized) {
    return { allowed: false, path: null, reason: 'invalid_path' };
  }

  const segments = normalized.split('/');
  const basename = segments.at(-1);

  if (segments.some((segment) => FORBIDDEN_SEGMENTS.has(segment))) {
    return { allowed: false, path: normalized, reason: 'forbidden_segment' };
  }

  if (FORBIDDEN_BASENAMES.has(basename) || basename?.startsWith('.env.')) {
    return { allowed: false, path: normalized, reason: 'forbidden_secret_file' };
  }

  return { allowed: true, path: normalized, reason: null };
}

function resolveInsideRepo(repoRoot, normalizedPath) {
  const absolutePath = resolve(repoRoot, normalizedPath);
  const rel = relative(repoRoot, absolutePath);
  if (rel.startsWith('..') || rel === '' || rel.split(sep).includes('..')) {
    return null;
  }
  return absolutePath;
}

function makeSkipped(path, reason) {
  return { path, reason };
}

function buildHeader(metadata) {
  const lines = [
    '# AI Context',
    '',
    `promptId: ${metadata.promptId ?? 'unknown'}`,
    `promptVersion: ${metadata.promptVersion ?? 'unknown'}`,
    `scope: ${metadata.scope ?? 'unknown'}`,
    '',
  ];
  return lines.join('\n');
}

export async function buildContext(options) {
  if (!isPlainObject(options)) {
    throw new TypeError('buildContext options must be an object');
  }

  const {
    repoRoot,
    files,
    promptId,
    promptVersion,
    scope,
    maxFileBytes = DEFAULT_MAX_FILE_BYTES,
    maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES,
  } = options;

  if (typeof repoRoot !== 'string' || repoRoot.length === 0) {
    throw new TypeError('repoRoot is required');
  }

  if (!Array.isArray(files)) {
    throw new TypeError('files must be an array');
  }

  const requestedPaths = unique(files);
  const includedFiles = [];
  const missingFiles = [];
  const skippedFiles = [];
  const redactedKinds = [];
  const warnings = [];
  let totalBytes = 0;
  let totalTruncated = false;
  let safeText = buildHeader({ promptId, promptVersion, scope });

  for (const requestedPath of requestedPaths) {
    const classification = classifyContextPath(requestedPath);
    if (!classification.allowed) {
      skippedFiles.push(makeSkipped(String(requestedPath), classification.reason));
      continue;
    }

    const absolutePath = resolveInsideRepo(repoRoot, classification.path);
    if (!absolutePath) {
      skippedFiles.push(makeSkipped(classification.path, 'outside_repo'));
      continue;
    }

    let raw;
    try {
      raw = await readFile(absolutePath, 'utf8');
    } catch (error) {
      missingFiles.push(classification.path);
      continue;
    }

    const originalBytes = Buffer.byteLength(raw, 'utf8');
    let fileText = raw;
    let fileTruncated = false;
    if (originalBytes > maxFileBytes) {
      fileText = raw.slice(0, maxFileBytes);
      fileTruncated = true;
      totalTruncated = true;
      warnings.push('file_truncated');
    }

    const redacted = redactText(fileText);
    redactedKinds.push(...redacted.redactedKinds);
    warnings.push(...redacted.warnings);
    totalTruncated ||= redacted.truncated;

    const section = [
      `## ${classification.path}`,
      '',
      '```text',
      redacted.safeText,
      '```',
      '',
    ].join('\n');

    const nextBytes = Buffer.byteLength(section, 'utf8');
    if (totalBytes + nextBytes > maxTotalBytes) {
      skippedFiles.push(makeSkipped(classification.path, 'max_total_bytes'));
      totalTruncated = true;
      warnings.push('context_truncated');
      break;
    }

    safeText += section;
    totalBytes += nextBytes;
    includedFiles.push({
      path: classification.path,
      originalBytes,
      includedBytes: Buffer.byteLength(redacted.safeText, 'utf8'),
      truncated: fileTruncated || redacted.truncated,
      redactedKinds: redacted.redactedKinds,
    });
  }

  return {
    safeText,
    includedFiles,
    skippedFiles,
    missingFiles,
    redactedKinds: unique(redactedKinds),
    truncated: totalTruncated,
    warnings: unique(warnings),
  };
}
