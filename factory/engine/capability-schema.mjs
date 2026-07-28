import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileSchema } from './json-schema.mjs';

/**
 * The normative Capability Manifest contract (ADR-072).
 *
 * `capability.schema.json` IS the contract: it is compiled and executed here,
 * and the enums the engine exposes are read out of the document rather than
 * redeclared. Structural rules live only in the schema; `capabilities.mjs`
 * keeps only what a JSON Schema cannot express — cross-references.
 */
const SCHEMA_PATH = join(
  dirname(fileURLToPath(import.meta.url)), '..', 'schema', 'capability.schema.json',
);

export const capabilitySchema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

// Compiled by the Factory's own evaluator: the engine runs on a bare checkout
// (the golden and dependency jobs execute `node factory/...` with nothing
// installed), so it carries no runtime dependency. `factory:test` cross-checks
// every verdict against Ajv, which the test environment does install.
const compiled = compileSchema(capabilitySchema);

/**
 * Reads an enum out of the schema document, failing fast if a reorganisation
 * moved it: a silently empty constant would disable validation elsewhere.
 */
function enumAt(...path) {
  let node = capabilitySchema;
  for (const key of path) node = node?.[key];
  if (!Array.isArray(node?.enum) || node.enum.length === 0) {
    throw new Error(`capability.schema.json no longer declares an enum at ${path.join('.')}`);
  }
  return Object.freeze([...node.enum]);
}

export const CAPABILITY_STATUSES = enumAt('$defs', 'target', 'properties', 'status');
export const INFRASTRUCTURE_PRIMITIVE_KINDS = enumAt('$defs', 'primitive', 'properties', 'kind');
export const CAPABILITY_DEPLOYMENT_MODES = enumAt(
  '$defs', 'target', 'properties', 'deploymentModes', 'items',
);

const TYPE_ARTICLES = {
  array: 'an array',
  object: 'an object',
  string: 'a string',
  boolean: 'a boolean',
  integer: 'an integer',
  number: 'a number',
};

/** `/targets/nestjs/contracts/0/kind` → `targets.nestjs.contracts[0].kind`. */
function dottedPath(instancePath) {
  return instancePath
    .split('/')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? `[${segment}]` : segment))
    .reduce((acc, segment) => {
      if (!acc) return segment;
      return segment.startsWith('[') ? acc + segment : `${acc}.${segment}`;
    }, '');
}

function formatError(error) {
  const path = dottedPath(error.instancePath);
  switch (error.keyword) {
    case 'required': {
      const property = error.params.missingProperty;
      const base = path ? `${path}.${property}` : property;
      // A `then` branch in this schema is always the ready-target contract.
      return error.schemaPath.includes('/then/')
        ? `${base} is required when ready`
        : `${base} is required`;
    }
    case 'additionalProperties': {
      const property = error.params.additionalProperty;
      return path ? `${path}.${property} is not supported` : `unknown property: ${property}`;
    }
    case 'type':
      return `${path} must be ${TYPE_ARTICLES[error.params.type] ?? error.params.type}`;
    case 'minItems':
      return `${path} must not be empty`;
    case 'uniqueItems':
      return `${path} must be unique`;
    case 'const':
      return `${path} must be ${error.params.allowedValue}`;
    case 'not':
      // The only `not` in the schema is the else-branch of the ready contract.
      return `${path} declares ready-only fields without being ready`;
    case 'enum':
    case 'pattern':
    case 'minLength':
      return `${path} is invalid`;
    default:
      return `${path || 'manifest'} ${error.message}`;
  }
}

/**
 * Validates a manifest against the normative schema, returning actionable
 * messages. `if`/`anyOf`/`allOf` bookkeeping errors are dropped: the concrete
 * error inside the branch is what the author can act on.
 */
export function validateManifestSchema(manifest) {
  compiled(manifest);
  const errors = (compiled.errors ?? [])
    .filter((error) => !['if', 'anyOf', 'allOf'].includes(error.keyword));
  return [...new Set(errors.map(formatError))];
}
