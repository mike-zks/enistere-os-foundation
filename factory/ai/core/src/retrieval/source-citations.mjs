/**
 * Retrieval source citation helpers.
 *
 * Pure local module. It does not search, index, read files, call providers,
 * persist traces or rank documents. It only turns already allow-listed context
 * sources into bounded, redacted citation metadata.
 */

import { classifyContextPath } from '../context/index.mjs';
import { redactText } from '../redaction/index.mjs';

export const MAX_CITATIONS = 50;
export const MAX_TITLE_LENGTH = 160;
export const MAX_SECTION_LENGTH = 160;
export const MAX_EXCERPT_LENGTH = 600;
export const MAX_COMMIT_LENGTH = 64;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unique(values) {
  return [...new Set(values)];
}

function truncateText(value, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length <= maxLength ? text : text.slice(0, maxLength);
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function titleFromPath(path) {
  const basename = path.split('/').at(-1) ?? path;
  return basename.replace(/\.md$/i, '').replaceAll('-', ' ').replaceAll('_', ' ').trim() || path;
}

function normalizeTitle(value, path) {
  const title = normalizeWhitespace(truncateText(value, MAX_TITLE_LENGTH));
  return title.length > 0 ? title : titleFromPath(path);
}

function normalizeSection(value) {
  const section = normalizeWhitespace(truncateText(value, MAX_SECTION_LENGTH));
  return section.length > 0 ? section : null;
}

function normalizeCommit(value) {
  const commit = normalizeWhitespace(truncateText(value, MAX_COMMIT_LENGTH));
  if (commit.length === 0) {
    return null;
  }
  return /^[a-f0-9]{7,64}$/i.test(commit) ? commit : null;
}

function normalizeScore(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function normalizeLines(value) {
  if (!isPlainObject(value)) {
    return null;
  }
  const start = Number.isInteger(value.start) && value.start > 0 ? value.start : null;
  const end = Number.isInteger(value.end) && value.end > 0 ? value.end : null;
  if (start === null && end === null) {
    return null;
  }
  if (start !== null && end !== null && end < start) {
    return { start, end: start };
  }
  return { start, end: end ?? start };
}

function normalizeExcerpt(value) {
  const raw = normalizeWhitespace(truncateText(value, MAX_EXCERPT_LENGTH));
  if (raw.length === 0) {
    return {
      excerpt: null,
      redactedKinds: [],
      warnings: [],
      truncated: false,
    };
  }

  const redacted = redactText(raw);
  return {
    excerpt: redacted.safeText,
    redactedKinds: redacted.redactedKinds,
    warnings: redacted.warnings,
    truncated: redacted.truncated || raw.length >= MAX_EXCERPT_LENGTH,
  };
}

function makeSkipped(index, path, reason) {
  return Object.freeze({
    index,
    path: typeof path === 'string' ? path : null,
    reason,
  });
}

export function normalizeRetrievalSource(input, index = 0) {
  if (!isPlainObject(input)) {
    return {
      citation: null,
      skipped: makeSkipped(index, null, 'invalid_source'),
      redactedKinds: [],
      warnings: [],
      truncated: false,
    };
  }

  const classification = classifyContextPath(input.path);
  if (!classification.allowed) {
    return {
      citation: null,
      skipped: makeSkipped(index, input.path, classification.reason),
      redactedKinds: [],
      warnings: [],
      truncated: false,
    };
  }

  const excerpt = normalizeExcerpt(input.excerpt);
  const citation = Object.freeze({
    id: `S${index + 1}`,
    path: classification.path,
    title: normalizeTitle(input.title, classification.path),
    section: normalizeSection(input.section),
    lines: normalizeLines(input.lines),
    commit: normalizeCommit(input.commit),
    score: normalizeScore(input.score),
    excerpt: excerpt.excerpt,
  });

  return {
    citation,
    skipped: null,
    redactedKinds: excerpt.redactedKinds,
    warnings: excerpt.warnings,
    truncated: excerpt.truncated,
  };
}

export function createRetrievalCitations(input = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError('createRetrievalCitations input must be an object');
  }

  const sources = Array.isArray(input.sources) ? input.sources : [];
  const maxCitations = Number.isInteger(input.maxCitations)
    ? Math.max(0, Math.min(MAX_CITATIONS, input.maxCitations))
    : MAX_CITATIONS;

  const citations = [];
  const skippedSources = [];
  const redactedKinds = [];
  const warnings = [];
  let truncated = sources.length > maxCitations;
  const seenPaths = new Set();

  sources.slice(0, maxCitations).forEach((source, sourceIndex) => {
    const normalized = normalizeRetrievalSource(source, sourceIndex);
    redactedKinds.push(...normalized.redactedKinds);
    warnings.push(...normalized.warnings);
    truncated ||= normalized.truncated;

    if (normalized.skipped) {
      skippedSources.push(normalized.skipped);
      return;
    }

    if (seenPaths.has(normalized.citation.path)) {
      skippedSources.push(makeSkipped(sourceIndex, normalized.citation.path, 'duplicate_source'));
      return;
    }

    seenPaths.add(normalized.citation.path);
    citations.push(Object.freeze({
      ...normalized.citation,
      id: `S${citations.length + 1}`,
    }));
  });

  return Object.freeze({
    citations: Object.freeze(citations),
    skippedSources: Object.freeze(skippedSources),
    redactedKinds: unique(redactedKinds),
    warnings: unique(warnings),
    truncated,
  });
}

export function createCitationsFromContext(context, options = {}) {
  if (!isPlainObject(context)) {
    throw new TypeError('context must be an object');
  }

  const includedFiles = Array.isArray(context.includedFiles) ? context.includedFiles : [];
  return createRetrievalCitations({
    ...options,
    sources: includedFiles.map((file) => ({
      path: file.path,
      title: file.title,
      section: file.section,
      commit: file.commit,
      score: file.score,
      lines: file.lines,
      excerpt: file.excerpt,
    })),
  });
}

export function formatRetrievalCitation(citation) {
  if (!isPlainObject(citation) || typeof citation.id !== 'string' || typeof citation.path !== 'string') {
    return '';
  }

  const parts = [`[${citation.id}]`, citation.path];
  if (typeof citation.section === 'string' && citation.section.length > 0) {
    parts.push(`# ${citation.section}`);
  }
  if (isPlainObject(citation.lines) && Number.isInteger(citation.lines.start)) {
    const end = Number.isInteger(citation.lines.end) ? citation.lines.end : citation.lines.start;
    parts.push(`lines ${citation.lines.start}-${end}`);
  }
  return parts.join(' ');
}

export function describeRetrievalCitationsForLog(result) {
  if (!isPlainObject(result)) {
    return { count: 0, skippedCount: 0, truncated: false };
  }
  return {
    count: Array.isArray(result.citations) ? result.citations.length : 0,
    skippedCount: Array.isArray(result.skippedSources) ? result.skippedSources.length : 0,
    truncated: result.truncated === true,
  };
}

