function schemaForEntity(entity) {
  return {
    type: 'object',
    required: entity.fields.filter((field) => field.required).map((field) => field.name),
    properties: Object.fromEntries(entity.fields.map((field) => [field.name, fieldSchema(field)])),
  };
}

function fieldSchema(field) {
  if (field.type === 'integer') return { type: 'integer' };
  if (field.type === 'number') return { type: 'number' };
  if (field.type === 'boolean') return { type: 'boolean' };
  if (field.type === 'datetime') return { type: 'string', format: 'date-time' };
  if (field.type === 'uuid') return { type: 'string', format: 'uuid' };
  return { type: 'string', ...(field.maxLength ? { maxLength: field.maxLength } : {}) };
}

export function validateEntities(entities) {
  const issues = [];
  const names = new Set();
  for (const entity of entities) {
    if (!/^[A-Z][A-Za-z0-9]{1,63}$/.test(entity?.name ?? '')) issues.push('entity.name must be PascalCase');
    if (names.has(entity?.name)) issues.push(`duplicate entity: ${entity.name}`);
    names.add(entity?.name);
    if (!Array.isArray(entity?.fields) || entity.fields.length === 0) issues.push(`${entity?.name ?? 'entity'} must define fields`);
    const fields = new Set();
    for (const field of entity?.fields ?? []) {
      if (!/^[a-z][A-Za-z0-9]{0,63}$/.test(field?.name ?? '')) issues.push(`${entity.name}.field name is invalid`);
      if (fields.has(field?.name)) issues.push(`${entity.name} duplicate field: ${field.name}`);
      fields.add(field?.name);
      if (!['string', 'integer', 'number', 'boolean', 'datetime', 'uuid'].includes(field?.type)) issues.push(`${entity.name}.${field?.name} type is invalid`);
    }
  }
  return issues;
}

export function generateOpenApi(blueprint) {
  const schemas = {};
  const paths = {};
  for (const entity of blueprint.domain.entities) {
    schemas[entity.name] = schemaForEntity(entity);
    const segment = entity.name.replace(/[A-Z]/g, (letter, index) => `${index ? '-' : ''}${letter.toLowerCase()}`);
    paths[`/${segment}`] = {
      get: { operationId: `list${entity.name}`, responses: { 200: { description: 'OK' } } },
      post: { operationId: `create${entity.name}`, responses: { 201: { description: 'Created' } } },
    };
    paths[`/${segment}/{id}`] = {
      get: { operationId: `get${entity.name}`, responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      patch: { operationId: `update${entity.name}`, responses: { 200: { description: 'OK' } } },
      delete: { operationId: `delete${entity.name}`, responses: { 204: { description: 'Deleted' } } },
    };
  }
  return { openapi: '3.1.0', info: { title: `${blueprint.project.name} API`, version: '0.1.0' }, paths, components: { schemas } };
}
