/**
 * Typed intermediate model for the Prisma schema contributed by capabilities.
 *
 * Capabilities never ship Prisma *text* to be patched: they declare enums, models
 * and model-field extensions as **structured data**. The engine accumulates those
 * declarations into this typed model, validates them (duplicate model/enum/field,
 * extension of an unknown model), and renders the complete Prisma block once.
 *
 * There is therefore no parsing of an existing schema, no regex locating a model
 * or a field, no brace counting and no textual replacement: extending a model
 * owned by another capability (e.g. RBAC adding `User.roles` to Auth's `User`) is
 * a pure operation on the intermediate model, before rendering.
 */

/** Creates an empty composition accumulator. */
export function createPrismaComposition() {
  return { enums: new Map(), models: new Map() };
}

function requireName(value, what) {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid Prisma ${what}: ${JSON.stringify(value)}`);
  }
}

function assertObject(value, what) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${what} must be an object`);
  }
}

function assertKnownKeys(value, keys, what) {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new Error(`${what} has an unknown property: ${key}`);
  }
}

function assertOptionalString(value, what) {
  if (value !== undefined && typeof value !== 'string') throw new Error(`${what} must be a string`);
}

function assertStringArray(value, what) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item === '')) {
    throw new Error(`${what} must be an array of non-empty strings`);
  }
}

/** Strictly validates the declarative fragment before mutating the composition. */
export function validatePrismaFragment(fragment) {
  assertObject(fragment, 'Prisma fragment');
  assertKnownKeys(fragment, ['$comment', 'enums', 'models', 'fields'], 'Prisma fragment');
  assertOptionalString(fragment.$comment, 'Prisma fragment.$comment');

  for (const [section, entries] of [['enums', fragment.enums], ['models', fragment.models], ['fields', fragment.fields]]) {
    if (entries !== undefined && !Array.isArray(entries)) throw new Error(`Prisma fragment.${section} must be an array`);
  }

  for (const declaration of fragment.enums ?? []) {
    assertObject(declaration, 'Prisma enum declaration');
    assertKnownKeys(declaration, ['name', 'values', 'doc'], 'Prisma enum declaration');
    requireName(declaration.name, 'enum name');
    assertStringArray(declaration.values, `Prisma enum ${declaration.name}.values`);
    if (new Set(declaration.values).size !== declaration.values.length) {
      throw new Error(`Prisma enum ${declaration.name} has duplicate values`);
    }
    for (const value of declaration.values) requireName(value, `enum ${declaration.name} value`);
    assertOptionalString(declaration.doc, `Prisma enum ${declaration.name}.doc`);
  }

  for (const declaration of fragment.models ?? []) {
    assertObject(declaration, 'Prisma model declaration');
    assertKnownKeys(declaration, ['name', 'fields', 'blockAttributes', 'doc'], 'Prisma model declaration');
    requireName(declaration.name, 'model name');
    if (!Array.isArray(declaration.fields) || declaration.fields.length === 0) {
      throw new Error(`Prisma model ${declaration.name} needs fields`);
    }
    if (declaration.blockAttributes !== undefined) {
      assertStringArray(declaration.blockAttributes, `Prisma model ${declaration.name}.blockAttributes`);
    }
    assertOptionalString(declaration.doc, `Prisma model ${declaration.name}.doc`);
    for (const field of declaration.fields) validateFieldDeclaration(field, `Prisma model ${declaration.name} field`);
  }

  for (const field of fragment.fields ?? []) {
    validateFieldDeclaration(field, 'Prisma model extension', true);
  }
  return fragment;
}

function validateFieldDeclaration(field, what, extension = false) {
  assertObject(field, what);
  assertKnownKeys(field, extension
    ? ['model', 'field', 'type', 'attributes', 'doc']
    : ['name', 'type', 'attributes', 'doc'], what);
  if (extension) {
    requireName(field.model, 'model name');
    requireName(field.field, 'field name');
  } else {
    requireName(field.name, 'field name');
  }
  if (typeof field.type !== 'string' || field.type === '') throw new Error(`${what} needs a type`);
  if (field.attributes !== undefined) assertStringArray(field.attributes, `${what}.attributes`);
  assertOptionalString(field.doc, `${what}.doc`);
}

/** Declares an enum. Redeclaring an enum name is an error. */
export function addPrismaEnum(composition, declaration, capability) {
  const { name, values, doc } = declaration;
  requireName(name, 'enum name');
  if (!Array.isArray(values) || values.length === 0) throw new Error(`Prisma enum ${name} needs values`);
  if (composition.enums.has(name)) {
    throw new Error(`Prisma enum already declared by ${composition.enums.get(name).capability}: ${name}`);
  }
  composition.enums.set(name, { name, values: [...values], doc, capability });
}

/** Declares a model. Redeclaring a model name is an error (never duplicated). */
export function addPrismaModel(composition, declaration, capability) {
  const { name, fields, blockAttributes = [], doc } = declaration;
  requireName(name, 'model name');
  if (composition.models.has(name)) {
    throw new Error(`Prisma model already declared by ${composition.models.get(name).capability}: ${name}`);
  }
  if (!Array.isArray(fields) || fields.length === 0) throw new Error(`Prisma model ${name} needs fields`);
  const model = { name, doc, capability, fields: [], blockAttributes: [...blockAttributes] };
  composition.models.set(name, model);
  for (const field of fields) appendField(model, field, capability);
  return model;
}

function appendField(model, field, capability) {
  const { name, type, attributes = [], doc } = field;
  requireName(name, 'field name');
  if (typeof type !== 'string' || type === '') throw new Error(`Prisma field ${model.name}.${name} needs a type`);
  const existing = model.fields.find((item) => item.name === name);
  if (existing) {
    throw new Error(`Prisma field already declared on ${model.name} by ${existing.capability}: ${name}`);
  }
  model.fields.push({ name, type, attributes: [...attributes], doc, capability });
}

/**
 * Extends a model already present in the composition with one field — the
 * structured way for a capability to attach its back-relation to a model owned by
 * an earlier capability. Unknown model or duplicate field are errors.
 */
export function addPrismaModelField(composition, declaration, capability) {
  const { model: modelName } = declaration;
  requireName(modelName, 'model name');
  const model = composition.models.get(modelName);
  if (!model) {
    const known = [...composition.models.keys()].sort().join(', ') || 'none';
    throw new Error(`Prisma model not found: ${modelName} (composed models: ${known})`);
  }
  appendField(model, { ...declaration, name: declaration.field }, capability);
}

/** Applies a declarative fragment `{ enums?, models?, fields? }`. */
export function applyPrismaFragment(composition, fragment, capability) {
  validatePrismaFragment(fragment);
  for (const declaration of fragment.enums ?? []) addPrismaEnum(composition, declaration, capability);
  for (const declaration of fragment.models ?? []) addPrismaModel(composition, declaration, capability);
  for (const declaration of fragment.fields ?? []) addPrismaModelField(composition, declaration, capability);
}

function renderDoc(doc, indent = '') {
  if (!doc) return [];
  return String(doc).split('\n').map((line) => `${indent}/// ${line}`.trimEnd());
}

/**
 * Renders a field using Prisma's own column alignment (name padded to the widest
 * field name of the model, type padded only when attributes follow), so the
 * rendered schema is **stable under `prisma format`**.
 */
function renderField(field, widths) {
  const name = field.name.padEnd(widths.name);
  if (field.attributes.length === 0) return `  ${name} ${field.type}`.trimEnd();
  return `  ${name} ${field.type.padEnd(widths.type)} ${field.attributes.join(' ')}`;
}

function columnWidths(fields) {
  return {
    name: Math.max(...fields.map((field) => field.name.length)),
    type: Math.max(...fields.map((field) => field.type.length)),
  };
}

/**
 * Renders the composed enums and models. Deterministic: declaration order is
 * preserved (capabilities compose in registry order), so the same composition
 * always yields byte-identical output.
 */
export function renderPrismaComposition(composition) {
  const blocks = [];

  for (const declaration of composition.enums.values()) {
    blocks.push([
      ...renderDoc(declaration.doc),
      `enum ${declaration.name} {`,
      ...declaration.values.map((value) => `  ${value}`),
      '}',
    ].join('\n'));
  }

  for (const model of composition.models.values()) {
    const lines = [...renderDoc(model.doc), `model ${model.name} {`];
    const widths = columnWidths(model.fields);
    for (const field of model.fields) {
      lines.push(...renderDoc(field.doc, '  '), renderField(field, widths));
    }
    if (model.blockAttributes.length > 0) {
      lines.push('');
      for (const attribute of model.blockAttributes) lines.push(`  ${attribute}`);
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }

  return blocks.length === 0 ? '' : `${blocks.join('\n\n')}\n`;
}

/** True when the composition contributed anything renderable. */
export function isEmptyPrismaComposition(composition) {
  return composition.enums.size === 0 && composition.models.size === 0;
}
