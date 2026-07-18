/**
 * Factory AI Evaluation Harness.
 *
 * Deterministic local evaluator for AI mission outputs.
 * No LLM judge, no provider, no network, no dependency.
 */

import { redactText } from '../redaction/index.mjs';
import { classifyContextPath } from '../context/index.mjs';

export const EVALUATION_STATUSES = Object.freeze(['pass', 'warn', 'fail']);

const REQUIRED_REPORT_SECTIONS = Object.freeze([
  'summary',
  'files',
  'verification',
  'limits',
  'next',
]);

function unique(values) {
  return [...new Set(values)];
}

function normalizeText(value) {
  return typeof value === 'string' ? value : '';
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function issue(status, code, message, metadata = {}) {
  return { status, code, message, metadata };
}

function includesCaseInsensitive(text, needle) {
  return text.toLowerCase().includes(needle.toLowerCase());
}

function anyLineMentions(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function evaluateScope({ modifiedFiles = [], allowedFiles = [], forbiddenFiles = [] }) {
  const findings = [];
  const allowedPrefixes = allowedFiles.map((path) => path.endsWith('/') ? path : `${path}/`);

  for (const file of modifiedFiles) {
    const classification = classifyContextPath(file);
    if (!classification.allowed) {
      findings.push(issue('fail', 'modified_file_forbidden_path', `Modified file is not safe: ${file}`, { file, reason: classification.reason }));
      continue;
    }

    if (forbiddenFiles.some((forbidden) => file === forbidden || file.startsWith(`${forbidden}/`))) {
      findings.push(issue('fail', 'modified_file_forbidden', `Modified file is explicitly forbidden: ${file}`, { file }));
      continue;
    }

    if (
      allowedFiles.length > 0 &&
      !allowedFiles.includes(file) &&
      !allowedPrefixes.some((prefix) => file.startsWith(prefix))
    ) {
      findings.push(issue('fail', 'modified_file_out_of_scope', `Modified file is outside allowed scope: ${file}`, { file }));
    }
  }

  return findings;
}

function evaluateRequiredDocuments({ outputText, requiredDocuments = [] }) {
  const findings = [];

  for (const docPath of requiredDocuments) {
    if (!includesCaseInsensitive(outputText, docPath)) {
      findings.push(issue('warn', 'required_document_not_mentioned', `Required document not mentioned: ${docPath}`, { docPath }));
    }
  }

  return findings;
}

function evaluateGates({ outputText, expectedGates = [] }) {
  const findings = [];

  for (const gate of expectedGates) {
    if (!includesCaseInsensitive(outputText, gate)) {
      findings.push(issue('fail', 'expected_gate_not_reported', `Expected gate not reported: ${gate}`, { gate }));
    }
  }

  return findings;
}

function evaluateReportFormat({ report = {}, outputText }) {
  const findings = [];

  for (const section of REQUIRED_REPORT_SECTIONS) {
    const value = report[section];
    if (typeof value === 'string' && value.trim().length > 0) {
      continue;
    }
    if (Array.isArray(value) && value.length > 0) {
      continue;
    }
    if (includesCaseInsensitive(outputText, section)) {
      continue;
    }
    findings.push(issue('warn', 'report_section_missing', `Report section is missing or empty: ${section}`, { section }));
  }

  return findings;
}

function evaluateTestsMentioned({ outputText }) {
  if (anyLineMentions(outputText, [/node --test/i, /npm test/i, /quality-gates/i, /git diff --check/i, /mvnw verify/i])) {
    return [];
  }

  return [issue('warn', 'verification_not_evidenced', 'No recognizable verification command was reported')];
}

function evaluateSecrets({ outputText }) {
  const redacted = redactText(outputText);
  if (redacted.redactedKinds.length === 0) {
    return [];
  }

  return [
    issue(
      'fail',
      'sensitive_data_detected',
      'Output contains sensitive-looking data that would be redacted',
      { redactedKinds: redacted.redactedKinds },
    ),
  ];
}

function overallStatus(findings) {
  if (findings.some((finding) => finding.status === 'fail')) {
    return 'fail';
  }
  if (findings.some((finding) => finding.status === 'warn')) {
    return 'warn';
  }
  return 'pass';
}

function scoreFromFindings(findings) {
  const penalty = findings.reduce((sum, finding) => {
    if (finding.status === 'fail') {
      return sum + 25;
    }
    if (finding.status === 'warn') {
      return sum + 10;
    }
    return sum;
  }, 0);

  return Math.max(0, 100 - penalty);
}

export function evaluateAiOutput(input) {
  const options = input ?? {};
  const outputText = normalizeText(options.outputText);
  const report = options.report && typeof options.report === 'object' ? options.report : {};

  if (!isStringArray(options.modifiedFiles ?? [])) {
    throw new TypeError('modifiedFiles must be a string array when provided');
  }
  if (!isStringArray(options.allowedFiles ?? [])) {
    throw new TypeError('allowedFiles must be a string array when provided');
  }
  if (!isStringArray(options.forbiddenFiles ?? [])) {
    throw new TypeError('forbiddenFiles must be a string array when provided');
  }
  if (!isStringArray(options.requiredDocuments ?? [])) {
    throw new TypeError('requiredDocuments must be a string array when provided');
  }
  if (!isStringArray(options.expectedGates ?? [])) {
    throw new TypeError('expectedGates must be a string array when provided');
  }

  const findings = [
    ...evaluateScope(options),
    ...evaluateRequiredDocuments({ outputText, requiredDocuments: options.requiredDocuments ?? [] }),
    ...evaluateGates({ outputText, expectedGates: options.expectedGates ?? [] }),
    ...evaluateReportFormat({ report, outputText }),
    ...evaluateTestsMentioned({ outputText }),
    ...evaluateSecrets({ outputText }),
  ];

  const status = overallStatus(findings);
  return {
    status,
    score: scoreFromFindings(findings),
    findings,
    summary: {
      modifiedFileCount: (options.modifiedFiles ?? []).length,
      expectedGateCount: (options.expectedGates ?? []).length,
      requiredDocumentCount: (options.requiredDocuments ?? []).length,
      findingCount: findings.length,
      failed: findings.filter((finding) => finding.status === 'fail').length,
      warned: findings.filter((finding) => finding.status === 'warn').length,
      codes: unique(findings.map((finding) => finding.code)),
    },
  };
}
