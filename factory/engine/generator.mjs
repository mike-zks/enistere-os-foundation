import { access, cp, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGenerationPlan } from './plan.mjs';
import { generateOpenApi } from './contracts.mjs';
import { assessCapabilitySupport, loadCapabilityManifests } from './capabilities.mjs';
import { selectedStarterIds } from './starters.mjs';

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

function stable(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function digest(value) { return createHash('sha256').update(stable(value)).digest('hex'); }

const FOUNDATION_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXCLUDED_NAMES = new Set([
  '.dart_tool', '.expo', '.gradle', '.next', 'build', 'build-test', 'coverage',
  'dist', 'node_modules', 'target',
]);

function copyFilter(source) {
  const name = source.split(/[\\/]/).at(-1);
  if (EXCLUDED_NAMES.has(name)) return false;
  if (name?.endsWith('.tsbuildinfo')) return false;
  if (name === '.env' || name?.endsWith('.local')) return false;
  return true;
}

async function copyTree(source, destination) {
  await cp(source, destination, { recursive: true, filter: copyFilter });
}

async function materializeFoundation(plan, output) {
  for (const [kind, source] of Object.entries(plan.starterSources)) {
    await copyTree(join(FOUNDATION_ROOT, source), join(output, `apps/${kind}`));
  }
  for (const packageName of ['api-contracts', 'api-client-fetch', ...(plan.designSystem ? ['ui-kit'] : [])]) {
    await copyTree(join(FOUNDATION_ROOT, 'packages', packageName), join(output, 'packages', packageName));
  }
  for (const capability of plan.capabilities) {
    await copyTree(join(FOUNDATION_ROOT, 'capabilities', capability), join(output, 'capabilities', capability));
  }
}

function rootPackage(blueprint) {
  const packageBuilds = [
    'npm run build --workspace=@enistere/api-contracts',
    'npm run build --workspace=@enistere/api-client-fetch',
    ...(blueprint.designSystem ? ['npm run build --workspace=@enistere/ui-kit'] : []),
  ];
  return {
    name: blueprint.project.slug,
    version: '0.1.0',
    private: true,
    workspaces: ['packages/*', ...(blueprint.stack.web === 'nextjs' ? ['apps/web'] : [])],
    overrides: {
      'form-data': '^4.0.6',
      'js-yaml': '^4.2.0',
      postcss: '^8.5.15',
    },
    scripts: {
      'build:packages': packageBuilds.join(' && '),
      verify: 'node scripts/verify.mjs',
    },
  };
}

function localCompose(blueprint) {
  return `name: ${blueprint.project.slug}\nservices:\n  postgres:\n    image: postgres:17-alpine\n    environment:\n      POSTGRES_DB: \${POSTGRES_DB:-enistere}\n      POSTGRES_USER: \${POSTGRES_USER:-enistere}\n      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}\n    volumes: [postgres-data:/var/lib/postgresql/data]\n    healthcheck:\n      test: [CMD-SHELL, pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB]\n      interval: 10s\n      timeout: 5s\n      retries: 5\n  redis:\n    image: redis:7-alpine\n    command: [redis-server, --appendonly, 'yes']\n    volumes: [redis-data:/data]\n  minio:\n    image: minio/minio:RELEASE.2025-04-22T22-12-26Z\n    command: server /data --console-address :9001\n    environment:\n      MINIO_ROOT_USER: \${MINIO_ROOT_USER:?set MINIO_ROOT_USER}\n      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:?set MINIO_ROOT_PASSWORD}\n    volumes: [minio-data:/data]\nvolumes:\n  postgres-data:\n  redis-data:\n  minio-data:\n`;
}

function stagingCompose(blueprint) {
  return `name: ${blueprint.project.slug}-staging\nservices:\n  proxy:\n    image: traefik:v3.5\n    command: [--providers.docker=true, --providers.docker.exposedbydefault=false, --entrypoints.websecure.address=:443]\n    ports: ['443:443']\n    volumes: [/var/run/docker.sock:/var/run/docker.sock:ro]\n    restart: unless-stopped\n# Add generated application services behind proxy labels after image publication.\n`;
}

function verifyScript(plan) {
  const commands = {
    nestjs: ['npm', 'run', 'openapi:check'],
    spring: ['./mvnw', 'verify', '--no-transfer-progress'],
    nextjs: ['npm', 'run', 'check'],
    angular: ['npm', 'run', 'test:ci'],
    'react-native': ['npm', 'run', 'doctor'],
    flutter: ['flutter', 'analyze'],
  };
  const steps = Object.entries(plan.starterSources).map(([kind, source]) => ({
    cwd: `apps/${kind}`,
    argv: commands[source.split('/').at(-1)],
  }));
  return `import { spawnSync } from 'node:child_process';\n\nconst rootBuild = spawnSync('npm', ['run', 'build:packages'], { stdio: 'inherit', shell: false });\nif (rootBuild.status !== 0) process.exit(rootBuild.status ?? 1);\nconst steps = ${JSON.stringify(steps, null, 2)};\nfor (const step of steps) {\n  const [command, ...args] = step.argv;\n  const result = spawnSync(command, args, { cwd: step.cwd, stdio: 'inherit', shell: false });\n  if (result.status !== 0) process.exit(result.status ?? 1);\n}\n`;
}

export async function generateProject(blueprint, output, options = {}) {
  if (await exists(output)) throw new Error(`Output already exists: ${output}`);
  const capabilityManifests = await loadCapabilityManifests(FOUNDATION_ROOT, blueprint.capabilities);
  const support = assessCapabilitySupport(selectedStarterIds(blueprint), capabilityManifests);
  if (!support.ready) {
    const details = support.blockers.map((item) => `${item.capability} on ${item.starter} is ${item.status}`).join(', ');
    throw new Error(`Capability composition is not ready: ${details}`);
  }
  const plan = buildGenerationPlan(blueprint);
  plan.designSystem = blueprint.designSystem;
  for (const directory of plan.directories) await mkdir(join(output, directory), { recursive: true });
  if (options.materialize !== false) await materializeFoundation(plan, output);
  await mkdir(join(output, 'scripts'), { recursive: true });
  await writeFile(join(output, 'enistere.yaml'), stable(blueprint));
  await writeFile(join(output, 'enistere.lock'), stable({
    schemaVersion: '1', foundationVersion: '2.0.0-dev', blueprintDigest: digest(blueprint), plan,
  }));
  await writeFile(join(output, 'README.md'), `# ${blueprint.project.name}\n\nGenerated by Enistere Project Factory.\n`);
  await writeFile(join(output, 'package.json'), stable(rootPackage(blueprint)));
  await writeFile(join(output, 'scripts/verify.mjs'), verifyScript(plan));
  await writeFile(join(output, 'packages/contracts/README.md'), '# Contracts\n\nGenerated from the neutral blueprint.\n');
  await writeFile(join(output, 'packages/contracts/domain.json'), stable({ entities: blueprint.domain.entities }));
  await writeFile(join(output, 'packages/contracts/openapi.json'), stable(generateOpenApi(blueprint)));
  await writeFile(join(output, 'infrastructure/local/README.md'), '# Local deployment\n');
  await writeFile(join(output, 'infrastructure/local/compose.yaml'), localCompose(blueprint));
  await writeFile(join(output, 'infrastructure/local/.env.example'), 'POSTGRES_PASSWORD=change-me\nMINIO_ROOT_USER=change-me\nMINIO_ROOT_PASSWORD=change-me\n');
  if (blueprint.deployment.environments.includes('staging')) {
    await writeFile(join(output, 'infrastructure/staging/README.md'), '# Staging deployment\n\nCopy `.env.example` to the deployment secret store; never commit real values.\n');
    await writeFile(join(output, 'infrastructure/staging/compose.yaml'), stagingCompose(blueprint));
    await writeFile(join(output, 'infrastructure/staging/.env.example'), 'STAGING_DOMAIN=staging.example.com\n');
  }
  await writeFile(join(output, 'docs/ARCHITECTURE.md'), `# Architecture\n\nCapabilities: ${blueprint.capabilities.join(', ')}\n`);
  return plan;
}
