/**
 * A focused JSON Schema (draft 2020-12) evaluator for the Factory's own schemas.
 *
 * The Factory engine runs on a bare checkout — the golden and dependency jobs
 * execute `node factory/...` with nothing installed — so it carries no runtime
 * dependency. This module keeps that property while letting the schema documents
 * stay the single source of truth (ADR-072): it does not restate any rule, it
 * interprets the document.
 *
 * It supports exactly the keywords the Factory's schemas use. Anything else is
 * ignored rather than silently mis-evaluated, and `factory:test` cross-checks
 * every verdict against Ajv so a gap surfaces as a test failure, not as a
 * manifest wrongly accepted.
 */

const SUPPORTED = new Set([
  'type', 'properties', 'required', 'additionalProperties', 'items', 'enum',
  'pattern', 'minItems', 'maxItems', 'uniqueItems', 'minLength', 'minimum',
  'maximum', 'const', 'propertyNames', '$ref', 'allOf', 'anyOf', 'oneOf',
  'not', 'if', 'then', 'else',
]);

/** Keywords present in a schema that this evaluator would not enforce. */
export function unsupportedKeywords(schema) {
  const ignored = new Set([
    '$schema', '$id', '$defs', 'title', 'description', 'default', 'examples', 'format',
  ]);
  const found = new Set();
  const seen = new Set();
  (function walk(node, inProperties) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const item of node) walk(item, false);
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      // Under `properties`/`$defs`, keys are names chosen by the author, not keywords.
      if (!inProperties && !SUPPORTED.has(key) && !ignored.has(key)) found.add(key);
      walk(value, key === 'properties' || key === '$defs' || key === 'propertyNames');
    }
  })(schema, false);
  return [...found].sort();
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function matchesType(value, expected) {
  const actual = typeOf(value);
  if (expected === 'number') return actual === 'number' || actual === 'integer';
  if (expected === 'integer') return actual === 'integer';
  return actual === expected;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function resolveRef(ref, root) {
  if (!ref.startsWith('#/')) throw new Error(`unsupported $ref: ${ref}`);
  let node = root;
  for (const segment of ref.slice(2).split('/')) {
    node = node?.[segment.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  if (node === undefined) throw new Error(`unresolvable $ref: ${ref}`);
  return node;
}

/**
 * Collects violations of `schema` by `value`.
 *
 * Errors mirror the shape this repository already formats — `instancePath`,
 * `keyword`, `params`, `schemaPath` — so the schema stays interchangeable with
 * a full validator.
 */
function collect(value, schema, root, instancePath, schemaPath, errors) {
  if (schema === true || schema === undefined) return;
  if (schema === false) {
    errors.push({ instancePath, schemaPath, keyword: 'false schema', params: {}, message: 'must not be valid' });
    return;
  }

  if (schema.$ref) {
    collect(value, resolveRef(schema.$ref, root), root, instancePath, `${schemaPath}/$ref`, errors);
  }

  if (schema.type !== undefined) {
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expected.some((candidate) => matchesType(value, candidate))) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/type`,
        keyword: 'type',
        params: { type: Array.isArray(schema.type) ? schema.type.join(',') : schema.type },
        message: `must be ${expected.join(' or ')}`,
      });
      return; // Further keywords would report noise against the wrong type.
    }
  }

  if (schema.const !== undefined && !deepEqual(value, schema.const)) {
    errors.push({
      instancePath,
      schemaPath: `${schemaPath}/const`,
      keyword: 'const',
      params: { allowedValue: schema.const },
      message: 'must be equal to constant',
    });
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => deepEqual(value, candidate))) {
    errors.push({
      instancePath,
      schemaPath: `${schemaPath}/enum`,
      keyword: 'enum',
      params: { allowedValues: schema.enum },
      message: 'must be equal to one of the allowed values',
    });
  }

  if (typeof value === 'string') {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(value)) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/pattern`,
        keyword: 'pattern',
        params: { pattern: schema.pattern },
        message: `must match pattern "${schema.pattern}"`,
      });
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/minLength`,
        keyword: 'minLength',
        params: { limit: schema.minLength },
        message: `must NOT have fewer than ${schema.minLength} characters`,
      });
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/minimum`,
        keyword: 'minimum',
        params: { limit: schema.minimum },
        message: `must be >= ${schema.minimum}`,
      });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/maximum`,
        keyword: 'maximum',
        params: { limit: schema.maximum },
        message: `must be <= ${schema.maximum}`,
      });
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/minItems`,
        keyword: 'minItems',
        params: { limit: schema.minItems },
        message: `must NOT have fewer than ${schema.minItems} items`,
      });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/maxItems`,
        keyword: 'maxItems',
        params: { limit: schema.maxItems },
        message: `must NOT have more than ${schema.maxItems} items`,
      });
    }
    if (schema.uniqueItems === true) {
      for (let i = 0; i < value.length; i += 1) {
        for (let j = i + 1; j < value.length; j += 1) {
          if (deepEqual(value[i], value[j])) {
            errors.push({
              instancePath,
              schemaPath: `${schemaPath}/uniqueItems`,
              keyword: 'uniqueItems',
              params: { i: j, j: i },
              message: `must NOT have duplicate items (items ## ${i} and ${j} are identical)`,
            });
            i = value.length;
            break;
          }
        }
      }
    }
    if (schema.items !== undefined) {
      value.forEach((item, index) => {
        collect(item, schema.items, root, `${instancePath}/${index}`, `${schemaPath}/items`, errors);
      });
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const property of schema.required ?? []) {
      if (!Object.hasOwn(value, property)) {
        errors.push({
          instancePath,
          schemaPath: `${schemaPath}/required`,
          keyword: 'required',
          params: { missingProperty: property },
          message: `must have required property '${property}'`,
        });
      }
    }
    if (schema.propertyNames !== undefined) {
      for (const name of Object.keys(value)) {
        const nested = [];
        collect(name, schema.propertyNames, root, instancePath, `${schemaPath}/propertyNames`, nested);
        if (nested.length > 0) {
          // The inner failure is reported too: knowing the name is invalid is
          // less useful than knowing which rule it broke.
          errors.push(...nested);
          errors.push({
            instancePath,
            schemaPath: `${schemaPath}/propertyNames`,
            keyword: 'propertyNames',
            params: { propertyName: name },
            message: 'property name must be valid',
          });
        }
      }
    }
    for (const [name, entry] of Object.entries(value)) {
      const propertySchema = schema.properties?.[name];
      if (propertySchema !== undefined) {
        collect(entry, propertySchema, root, `${instancePath}/${name}`, `${schemaPath}/properties/${name}`, errors);
      } else if (schema.additionalProperties === false && schema.properties !== undefined) {
        errors.push({
          instancePath,
          schemaPath: `${schemaPath}/additionalProperties`,
          keyword: 'additionalProperties',
          params: { additionalProperty: name },
          message: 'must NOT have additional properties',
        });
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        collect(entry, schema.additionalProperties, root, `${instancePath}/${name}`, `${schemaPath}/additionalProperties`, errors);
      }
    }
  }

  for (const [index, sub] of (schema.allOf ?? []).entries()) {
    collect(value, sub, root, instancePath, `${schemaPath}/allOf/${index}`, errors);
  }

  if (Array.isArray(schema.anyOf)) {
    const branches = schema.anyOf.map((sub, index) => {
      const nested = [];
      collect(value, sub, root, instancePath, `${schemaPath}/anyOf/${index}`, nested);
      return nested;
    });
    if (branches.every((nested) => nested.length > 0)) {
      for (const nested of branches) errors.push(...nested);
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/anyOf`,
        keyword: 'anyOf',
        params: {},
        message: 'must match a schema in anyOf',
      });
    }
  }

  if (Array.isArray(schema.oneOf)) {
    const matching = schema.oneOf.filter((sub) => {
      const nested = [];
      collect(value, sub, root, instancePath, `${schemaPath}/oneOf`, nested);
      return nested.length === 0;
    });
    if (matching.length !== 1) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/oneOf`,
        keyword: 'oneOf',
        params: { passingSchemas: matching.length ? matching : null },
        message: 'must match exactly one schema in oneOf',
      });
    }
  }

  if (schema.not !== undefined) {
    const nested = [];
    collect(value, schema.not, root, instancePath, `${schemaPath}/not`, nested);
    if (nested.length === 0) {
      errors.push({
        instancePath,
        schemaPath: `${schemaPath}/not`,
        keyword: 'not',
        params: {},
        message: 'must NOT be valid',
      });
    }
  }

  if (schema.if !== undefined) {
    const probe = [];
    collect(value, schema.if, root, instancePath, `${schemaPath}/if`, probe);
    const branch = probe.length === 0 ? schema.then : schema.else;
    const branchName = probe.length === 0 ? 'then' : 'else';
    if (branch !== undefined) {
      collect(value, branch, root, instancePath, `${schemaPath}/${branchName}`, errors);
    }
  }
}

/**
 * Compiles a schema into a validator whose `errors` match a standards-compliant
 * validator's shape. Throws if the document uses a keyword this evaluator would
 * not enforce — silently ignoring one would weaken validation invisibly.
 */
export function compileSchema(schema) {
  const unsupported = unsupportedKeywords(schema);
  if (unsupported.length > 0) {
    throw new Error(`schema uses unsupported keywords: ${unsupported.join(', ')}`);
  }
  const validate = (value) => {
    const errors = [];
    collect(value, schema, schema, '', '#', errors);
    validate.errors = errors.length > 0 ? errors : null;
    return errors.length === 0;
  };
  return validate;
}
