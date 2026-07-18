/**
 * Factory AI Governance / Execution Report schema.
 *
 * Pure local module. No provider, no network, no filesystem write.
 */

import { redactText, redactValue } from '../redaction/index.mjs';

export const REPORT_STATUSES = Object.freeze(['draft', 'completed', 'blocked', 'failed']);
export const GATE_STATUSES = Object.freeze(['pass', 'fail', 'blocked', 'not_run']);
export const MAX_REPORT_TEXT_LENGTH = 1000;
export const MAX_REPORT_ITEMS = 100;

const REQUIRED_FIELDS = Object.freeze([
  'mission',
  'prompt',
  'documentsRead',
  'modifiedFiles',
  'gates',
  'limits',
  'evaluation',
  'nextAction',
]);

const PROMPT_LIKE_KEYS = new Set(['promptText', 'rawPrompt', 'fullPrompt', 'messages']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unique(values) {
  return [...new Set(values)];
}

function truncate(value, maxLength = MAX_REPORT_TEXT_LENGTH) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

function sanitizeText(value, maxLength = MAX_REPORT_TEXT_LENGTH) {
  const redacted = redactText(truncate(value, maxLength));
  return {
    value: redacted.safeText,
    redactedKinds: redacted.redactedKinds,
    warnings: redacted.warnings,
  };
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) {
    return { value: [], issues: ['expected_array'], redactedKinds: [] };
  }

  const redactedKinds = [];
  const safeValues = [];

  for (const item of values.slice(0, MAX_REPORT_ITEMS)) {
    if (typeof item !== 'string') {
      continue;
    }
    const sanitized = sanitizeText(item);
    redactedKinds.push(...sanitized.redactedKinds);
    if (sanitized.value.length > 0) {
      safeValues.push(sanitized.value);
    }
  }

  return {
    value: unique(safeValues),
    issues: values.length > MAX_REPORT_ITEMS ? ['too_many_items_truncated'] : [],
    redactedKinds: unique(redactedKinds),
  };
}

function sanitizePrompt(input) {
  const prompt = isPlainObject(input) ? input : {};
  const id = sanitizeText(prompt.id, 120);
  const version = sanitizeText(prompt.version, 80);
  const role = sanitizeText(prompt.role, 120);
  const redactedKinds = [...id.redactedKinds, ...version.redactedKinds, ...role.redactedKinds];

  return {
    value: {
      id: id.value,
      version: version.value,
      role: role.value,
    },
    redactedKinds: unique(redactedKinds),
  };
}

function sanitizeMission(input) {
  const mission = isPlainObject(input) ? input : {};
  const name = sanitizeText(mission.name, 160);
  const scope = sanitizeText(mission.scope, 160);
  const objective = sanitizeText(mission.objective, 400);
  const redactedKinds = [...name.redactedKinds, ...scope.redactedKinds, ...objective.redactedKinds];

  return {
    value: {
      name: name.value,
      scope: scope.value,
      objective: objective.value,
    },
    redactedKinds: unique(redactedKinds),
  };
}

function sanitizeGates(values) {
  if (!Array.isArray(values)) {
    return { value: [], issues: ['expected_array'], redactedKinds: [] };
  }

  const gates = [];
  const redactedKinds = [];

  for (const item of values.slice(0, MAX_REPORT_ITEMS)) {
    if (!isPlainObject(item)) {
      continue;
    }
    const command = sanitizeText(item.command, 240);
    const details = sanitizeText(item.details, 400);
    redactedKinds.push(...command.redactedKinds, ...details.redactedKinds);
    gates.push({
      command: command.value,
      status: GATE_STATUSES.includes(item.status) ? item.status : 'not_run',
      details: details.value,
    });
  }

  return {
    value: gates,
    issues: values.length > MAX_REPORT_ITEMS ? ['too_many_items_truncated'] : [],
    redactedKinds: unique(redactedKinds),
  };
}

function sanitizeEvaluation(input) {
  const evaluation = isPlainObject(input) ? input : {};
  const findings = Array.isArray(evaluation.findings) ? evaluation.findings.slice(0, MAX_REPORT_ITEMS) : [];
  const redacted = redactValue(findings);
  return {
    value: {
      status: ['pass', 'warn', 'fail'].includes(evaluation.status) ? evaluation.status : 'warn',
      score: Number.isFinite(evaluation.score) ? Math.max(0, Math.min(100, Math.round(evaluation.score))) : null,
      findings: Array.isArray(redacted.safeValue) ? redacted.safeValue : [],
    },
    issues: findings.length > MAX_REPORT_ITEMS ? ['too_many_items_truncated'] : [],
    redactedKinds: redacted.redactedKinds,
  };
}

function hasForbiddenPromptPayload(input) {
  if (!isPlainObject(input)) {
    return false;
  }

  return Object.keys(input).some((key) => PROMPT_LIKE_KEYS.has(key));
}

function collectMissingFields(report) {
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    if (report[field] === undefined || report[field] === null) {
      missing.push(field);
    }
  }
  return missing;
}

export function createExecutionReport(input) {
  if (!isPlainObject(input)) {
    throw new TypeError('execution report input must be an object');
  }

  if (hasForbiddenPromptPayload(input) || hasForbiddenPromptPayload(input.prompt)) {
    throw new TypeError('execution report must not include raw prompt payloads');
  }

  const status = REPORT_STATUSES.includes(input.status) ? input.status : 'draft';
  const mission = sanitizeMission(input.mission);
  const prompt = sanitizePrompt(input.prompt);
  const documentsRead = sanitizeStringArray(input.documentsRead);
  const modifiedFiles = sanitizeStringArray(input.modifiedFiles);
  const limits = sanitizeStringArray(input.limits);
  const gates = sanitizeGates(input.gates);
  const evaluation = sanitizeEvaluation(input.evaluation);
  const nextAction = sanitizeText(input.nextAction, 400);
  const redactedKinds = unique([
    ...mission.redactedKinds,
    ...prompt.redactedKinds,
    ...documentsRead.redactedKinds,
    ...modifiedFiles.redactedKinds,
    ...limits.redactedKinds,
    ...gates.redactedKinds,
    ...evaluation.redactedKinds,
    ...nextAction.redactedKinds,
  ]);

  const validationIssues = [
    ...collectMissingFields(input).map((field) => ({ code: 'missing_field', field })),
    ...documentsRead.issues.map((code) => ({ code, field: 'documentsRead' })),
    ...modifiedFiles.issues.map((code) => ({ code, field: 'modifiedFiles' })),
    ...limits.issues.map((code) => ({ code, field: 'limits' })),
    ...gates.issues.map((code) => ({ code, field: 'gates' })),
    ...evaluation.issues.map((code) => ({ code, field: 'evaluation' })),
  ];

  return Object.freeze({
    schemaVersion: 'ai-execution-report/v1',
    status,
    mission: mission.value,
    prompt: prompt.value,
    documentsRead: documentsRead.value,
    modifiedFiles: modifiedFiles.value,
    gates: gates.value,
    limits: limits.value,
    evaluation: evaluation.value,
    nextAction: nextAction.value,
    redactedKinds,
    validationIssues,
  });
}

export function validateExecutionReport(report) {
  if (!isPlainObject(report)) {
    return {
      valid: false,
      issues: [{ code: 'invalid_report', field: null }],
    };
  }

  const issues = [];
  if (report.schemaVersion !== 'ai-execution-report/v1') {
    issues.push({ code: 'invalid_schema_version', field: 'schemaVersion' });
  }
  if (!REPORT_STATUSES.includes(report.status)) {
    issues.push({ code: 'invalid_status', field: 'status' });
  }
  for (const field of REQUIRED_FIELDS) {
    if (report[field] === undefined || report[field] === null) {
      issues.push({ code: 'missing_field', field });
    }
  }
  if (!isPlainObject(report.mission) || report.mission.name.length === 0) {
    issues.push({ code: 'missing_mission_name', field: 'mission.name' });
  }
  if (!isPlainObject(report.prompt) || report.prompt.id.length === 0) {
    issues.push({ code: 'missing_prompt_id', field: 'prompt.id' });
  }
  if (!Array.isArray(report.documentsRead) || report.documentsRead.length === 0) {
    issues.push({ code: 'missing_documents', field: 'documentsRead' });
  }
  if (!Array.isArray(report.gates) || report.gates.length === 0) {
    issues.push({ code: 'missing_gates', field: 'gates' });
  }
  if (!isPlainObject(report.evaluation) || !['pass', 'warn', 'fail'].includes(report.evaluation.status)) {
    issues.push({ code: 'invalid_evaluation', field: 'evaluation' });
  }
  if (typeof report.nextAction !== 'string' || report.nextAction.length === 0) {
    issues.push({ code: 'missing_next_action', field: 'nextAction' });
  }

  return {
    valid: issues.length === 0 && (report.validationIssues?.length ?? 0) === 0,
    issues: [...issues, ...(Array.isArray(report.validationIssues) ? report.validationIssues : [])],
  };
}
