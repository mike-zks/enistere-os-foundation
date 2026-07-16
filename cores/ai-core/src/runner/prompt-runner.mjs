/**
 * Governed prompt execution runner.
 *
 * Pure local module. It composes the prompt registry, context builder, safe
 * provider adapter, fake provider and execution report schema. No real provider,
 * no network, no SDK, no external storage and no autonomous action.
 */

import { buildContext } from '../context/index.mjs';
import { evaluateAiOutput } from '../evaluation/index.mjs';
import { createFakeProvider, createSafeProviderAdapter } from '../provider/index.mjs';
import { createExecutionReport, validateExecutionReport } from '../reports/index.mjs';

export const RUNNER_ERROR_CODES = Object.freeze([
  'invalid_request',
  'prompt_not_found',
  'prompt_inactive',
  'context_invalid',
  'provider_failed',
]);

export class AiRunnerError extends Error {
  constructor(code, operation, message = code, metadata = {}) {
    super(message);
    this.name = 'AiRunnerError';
    this.code = RUNNER_ERROR_CODES.includes(code) ? code : 'invalid_request';
    this.operation = operation;
    this.metadata = Object.freeze({ ...metadata });
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unique(values) {
  return [...new Set(values)];
}

function isNonEmptyString(value, maxLength = 4000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function safeString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function findPrompt(registry, promptId, promptVersion) {
  if (!isPlainObject(registry) || !Array.isArray(registry.prompts)) {
    throw new AiRunnerError('invalid_request', 'resolve_prompt', 'registry must contain prompts');
  }

  return registry.prompts.find((prompt) =>
    prompt?.id === promptId &&
    (promptVersion === undefined || prompt.version === promptVersion));
}

function getPromptContextFiles(prompt, requestedFiles) {
  const allowedSet = new Set([
    ...(Array.isArray(prompt.requiredDocuments) ? prompt.requiredDocuments : []),
    ...(Array.isArray(prompt.allowedFiles) ? prompt.allowedFiles : []),
  ]);

  if (requestedFiles === undefined) {
    return [...allowedSet];
  }

  if (!Array.isArray(requestedFiles) || !requestedFiles.every((file) => typeof file === 'string')) {
    throw new AiRunnerError('invalid_request', 'build_context', 'contextFiles must be a string array');
  }

  const outOfScope = requestedFiles.filter((file) => !allowedSet.has(file));
  if (outOfScope.length > 0) {
    throw new AiRunnerError('context_invalid', 'build_context', 'context file is outside prompt allow-list', {
      files: outOfScope,
    });
  }

  return unique(requestedFiles);
}

function defaultGateResults(prompt) {
  const gates = Array.isArray(prompt.gates) ? prompt.gates : [];
  return gates.map((gate) => ({
    command: gate,
    status: 'not_run',
    details: 'Declared by prompt registry; execution runner does not run gates.',
  }));
}

function normalizeGateResults(gateResults, prompt) {
  if (gateResults === undefined) {
    return defaultGateResults(prompt);
  }
  if (!Array.isArray(gateResults)) {
    throw new AiRunnerError('invalid_request', 'create_report', 'gateResults must be an array');
  }
  return gateResults;
}

function buildEvaluationReportShape({ context, gates, limits }) {
  return {
    summary: 'Governed prompt execution completed through the fake provider.',
    files: context.includedFiles.map((file) => file.path),
    verification: gates.map((gate) => `${gate.command}: ${gate.status}`),
    limits,
    next: 'Human review remains required before any project action.',
  };
}

function createProvider(provider) {
  if (provider === undefined) {
    return createSafeProviderAdapter(createFakeProvider());
  }
  return createSafeProviderAdapter(provider);
}

export async function runPromptExecution(options) {
  if (!isPlainObject(options)) {
    throw new AiRunnerError('invalid_request', 'run_prompt', 'options must be an object');
  }

  const {
    repoRoot,
    registry,
    promptId,
    promptVersion,
    input,
    contextFiles,
    provider,
    mission = {},
    modifiedFiles = [],
    gateResults,
    nextAction = 'Human review of the fake provider output.',
    maxFileBytes,
    maxTotalBytes,
  } = options;

  if (!isNonEmptyString(repoRoot, 500)) {
    throw new AiRunnerError('invalid_request', 'run_prompt', 'repoRoot is required');
  }
  if (!isNonEmptyString(promptId, 80)) {
    throw new AiRunnerError('invalid_request', 'run_prompt', 'promptId is required');
  }
  if (promptVersion !== undefined && !isNonEmptyString(promptVersion, 32)) {
    throw new AiRunnerError('invalid_request', 'run_prompt', 'promptVersion must be a non-empty string');
  }
  if (!isNonEmptyString(input, 12000)) {
    throw new AiRunnerError('invalid_request', 'run_prompt', 'input is required and must be bounded');
  }
  if (!Array.isArray(modifiedFiles) || !modifiedFiles.every((file) => typeof file === 'string')) {
    throw new AiRunnerError('invalid_request', 'run_prompt', 'modifiedFiles must be a string array');
  }

  const prompt = findPrompt(registry, promptId, promptVersion);
  if (!prompt) {
    throw new AiRunnerError('prompt_not_found', 'resolve_prompt', 'prompt not found', {
      promptId,
      promptVersion: promptVersion ?? null,
    });
  }
  if (prompt.status !== 'active') {
    throw new AiRunnerError('prompt_inactive', 'resolve_prompt', 'prompt is not active', {
      promptId: prompt.id,
      status: prompt.status,
    });
  }

  const selectedContextFiles = getPromptContextFiles(prompt, contextFiles);
  const context = await buildContext({
    repoRoot,
    files: selectedContextFiles,
    promptId: prompt.id,
    promptVersion: prompt.version,
    scope: prompt.scope,
    ...(maxFileBytes === undefined ? {} : { maxFileBytes }),
    ...(maxTotalBytes === undefined ? {} : { maxTotalBytes }),
  });

  if (context.missingFiles.length > 0 || context.skippedFiles.length > 0) {
    throw new AiRunnerError('context_invalid', 'build_context', 'prompt context is incomplete', {
      missingFiles: context.missingFiles,
      skippedFiles: context.skippedFiles,
    });
  }

  const adapter = createProvider(provider);
  let completion;
  try {
    completion = await adapter.complete({
      promptId: prompt.id,
      promptVersion: prompt.version,
      role: prompt.role,
      input,
      context: context.safeText,
      allowedFiles: Array.isArray(prompt.allowedFiles) ? prompt.allowedFiles : [],
      forbiddenFiles: Array.isArray(prompt.forbiddenFiles) ? prompt.forbiddenFiles : [],
    });
  } catch (error) {
    if (error?.name === 'AiProviderError') {
      throw new AiRunnerError('provider_failed', 'complete', 'provider completion failed', {
        providerCode: error.code,
        providerOperation: error.operation,
      });
    }
    throw error;
  }

  const gates = normalizeGateResults(gateResults, prompt);
  const limits = [
    'Fake provider only.',
    'No real provider, SDK, network, embedding, vector DB, external storage or trace persistence.',
    'Raw prompt input is never stored in the execution report.',
    ...(context.truncated ? ['Context was truncated by configured limits.'] : []),
    ...context.warnings.map((warning) => `Context warning: ${warning}`),
  ];

  const evaluation = evaluateAiOutput({
    outputText: [
      completion.output,
      ...context.includedFiles.map((file) => file.path),
      ...gates.map((gate) => gate.command),
      'node --test',
    ].join('\n'),
    report: buildEvaluationReportShape({ context, gates, limits }),
    modifiedFiles,
    allowedFiles: Array.isArray(prompt.allowedFiles) ? prompt.allowedFiles : [],
    forbiddenFiles: Array.isArray(prompt.forbiddenFiles) ? prompt.forbiddenFiles : [],
    requiredDocuments: Array.isArray(prompt.requiredDocuments) ? prompt.requiredDocuments : [],
    expectedGates: Array.isArray(prompt.gates) ? prompt.gates : [],
  });

  const report = createExecutionReport({
    status: evaluation.status === 'fail' ? 'failed' : 'completed',
    mission: {
      name: safeString(mission.name, `AI prompt execution: ${prompt.title}`),
      scope: safeString(mission.scope, prompt.scope),
      objective: safeString(mission.objective, prompt.expectedOutput),
    },
    prompt: {
      id: prompt.id,
      version: prompt.version,
      role: prompt.role,
    },
    documentsRead: context.includedFiles.map((file) => file.path),
    modifiedFiles,
    gates,
    limits,
    evaluation: {
      status: evaluation.status,
      score: evaluation.score,
      findings: evaluation.findings,
    },
    nextAction,
  });

  return Object.freeze({
    prompt: Object.freeze({
      id: prompt.id,
      version: prompt.version,
      role: prompt.role,
      scope: prompt.scope,
      riskLevel: prompt.riskLevel,
    }),
    context: Object.freeze({
      includedFiles: context.includedFiles,
      redactedKinds: context.redactedKinds,
      warnings: context.warnings,
      truncated: context.truncated,
    }),
    completion: Object.freeze({
      providerId: completion.providerId,
      model: completion.model,
      output: completion.output,
      usage: completion.usage,
      metadata: completion.metadata,
      safety: completion.safety,
    }),
    evaluation,
    report,
    reportValidation: validateExecutionReport(report),
  });
}

