/**
 * Prompt Registry model helpers.
 *
 * Pure Node module, no provider, no network, no dependency.
 */

export const PROMPT_ROLES = Object.freeze([
  'architect',
  'code_generator',
  'documentation',
  'executor',
  'reviewer',
  'security_reviewer',
  'ux_ui_reviewer',
]);

export const PROMPT_RISK_LEVELS = Object.freeze(['low', 'medium', 'high']);

export const PROMPT_STATUSES = Object.freeze(['active', 'draft', 'deprecated']);

export const SAFE_GATE_IDS = Object.freeze([
  'git-diff-check',
  'quality-gates-docs',
  'quality-gates-plan-docs',
  'human-review',
  'scope-review',
]);

export const PROMPT_ID_PATTERN = /^[a-z][a-z0-9-]{2,63}$/;
export const PROMPT_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
export const SAFE_RELATIVE_PATH_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\/\/)[A-Za-z0-9._/()-]+$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value, maxLength = 256) {
  return typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= maxLength;
}

function isStringArray(value, options = {}) {
  if (!Array.isArray(value)) {
    return false;
  }

  const { allowEmpty = true, maxItems = 50, maxLength = 256 } = options;
  if (!allowEmpty && value.length === 0) {
    return false;
  }
  if (value.length > maxItems) {
    return false;
  }

  return value.every((item) => isNonEmptyString(item, maxLength));
}

function isSafeRelativePath(value) {
  return isNonEmptyString(value, 256) && SAFE_RELATIVE_PATH_PATTERN.test(value);
}

function addIssue(issues, path, message) {
  issues.push({ path, message });
}

export function validatePromptDefinition(prompt, index = 0) {
  const issues = [];
  const base = `prompts[${index}]`;

  if (!isPlainObject(prompt)) {
    addIssue(issues, base, 'prompt must be an object');
    return issues;
  }

  if (!isNonEmptyString(prompt.id, 64) || !PROMPT_ID_PATTERN.test(prompt.id)) {
    addIssue(issues, `${base}.id`, 'id must be a kebab-case identifier between 3 and 64 characters');
  }

  if (!isNonEmptyString(prompt.version, 32) || !PROMPT_VERSION_PATTERN.test(prompt.version)) {
    addIssue(issues, `${base}.version`, 'version must use semver-like x.y.z format');
  }

  if (!isNonEmptyString(prompt.title, 120)) {
    addIssue(issues, `${base}.title`, 'title is required and must be <= 120 characters');
  }

  if (!PROMPT_ROLES.includes(prompt.role)) {
    addIssue(issues, `${base}.role`, `role must be one of: ${PROMPT_ROLES.join(', ')}`);
  }

  if (!isNonEmptyString(prompt.scope, 120)) {
    addIssue(issues, `${base}.scope`, 'scope is required and must be <= 120 characters');
  }

  if (!isSafeRelativePath(prompt.path) || !prompt.path.startsWith('prompts/')) {
    addIssue(issues, `${base}.path`, 'path must be a safe relative path under prompts/');
  }

  if (!isStringArray(prompt.allowedInputs, { allowEmpty: false, maxItems: 20, maxLength: 120 })) {
    addIssue(issues, `${base}.allowedInputs`, 'allowedInputs must be a non-empty bounded string array');
  }

  for (const field of ['requiredDocuments', 'allowedFiles', 'forbiddenFiles']) {
    if (!isStringArray(prompt[field], { allowEmpty: true, maxItems: 60, maxLength: 256 })) {
      addIssue(issues, `${base}.${field}`, `${field} must be a bounded string array`);
    } else if (!prompt[field].every(isSafeRelativePath)) {
      addIssue(issues, `${base}.${field}`, `${field} must contain safe relative paths only`);
    }
  }

  if (!isNonEmptyString(prompt.expectedOutput, 500)) {
    addIssue(issues, `${base}.expectedOutput`, 'expectedOutput is required and must be <= 500 characters');
  }

  if (!isStringArray(prompt.gates, { allowEmpty: false, maxItems: 12, maxLength: 80 })) {
    addIssue(issues, `${base}.gates`, 'gates must be a non-empty bounded string array');
  } else {
    for (const gate of prompt.gates) {
      if (!SAFE_GATE_IDS.includes(gate)) {
        addIssue(issues, `${base}.gates`, `unsupported gate: ${gate}`);
      }
    }
  }

  if (!PROMPT_RISK_LEVELS.includes(prompt.riskLevel)) {
    addIssue(issues, `${base}.riskLevel`, `riskLevel must be one of: ${PROMPT_RISK_LEVELS.join(', ')}`);
  }

  if (!PROMPT_STATUSES.includes(prompt.status)) {
    addIssue(issues, `${base}.status`, `status must be one of: ${PROMPT_STATUSES.join(', ')}`);
  }

  return issues;
}

export function validatePromptRegistryShape(registry) {
  const issues = [];

  if (!isPlainObject(registry)) {
    return [{ path: '$', message: 'registry must be an object' }];
  }

  if (registry.schemaVersion !== '1.0.0') {
    addIssue(issues, 'schemaVersion', 'schemaVersion must be 1.0.0');
  }

  if (!isNonEmptyString(registry.updatedAt, 32) || !/^\d{4}-\d{2}-\d{2}$/.test(registry.updatedAt)) {
    addIssue(issues, 'updatedAt', 'updatedAt must use YYYY-MM-DD format');
  }

  if (!Array.isArray(registry.prompts)) {
    addIssue(issues, 'prompts', 'prompts must be an array');
    return issues;
  }

  if (registry.prompts.length === 0) {
    addIssue(issues, 'prompts', 'prompts must not be empty');
  }

  if (registry.prompts.length > 200) {
    addIssue(issues, 'prompts', 'prompts must contain at most 200 entries');
  }

  const seenIds = new Set();
  const seenPromptVersions = new Set();

  registry.prompts.forEach((prompt, index) => {
    issues.push(...validatePromptDefinition(prompt, index));

    if (prompt && typeof prompt.id === 'string') {
      if (seenIds.has(prompt.id)) {
        addIssue(issues, `prompts[${index}].id`, `duplicate id: ${prompt.id}`);
      }
      seenIds.add(prompt.id);
    }

    if (prompt && typeof prompt.id === 'string' && typeof prompt.version === 'string') {
      const key = `${prompt.id}@${prompt.version}`;
      if (seenPromptVersions.has(key)) {
        addIssue(issues, `prompts[${index}]`, `duplicate prompt version: ${key}`);
      }
      seenPromptVersions.add(key);
    }
  });

  return issues;
}
