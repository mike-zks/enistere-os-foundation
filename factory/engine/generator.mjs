import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGenerationPlan } from './plan.mjs';
import { generateOpenApi } from './contracts.mjs';
import { loadCapabilityManifests } from './capabilities.mjs';
import { loadStarterManifests, modularStarterIds } from './starters.mjs';
import { applyCapabilityOverlays } from './overlay.mjs';
import { errors, formatDiagnostics, hasErrors } from '../model/diagnostics.mjs';

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

function stable(value) { return `${JSON.stringify(value, null, 2)}\n`; }

const FOUNDATION_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXCLUDED_NAMES = new Set([
  '.dart_tool', '.expo', '.gradle', '.next', '.pytest_cache', '.runtime-venv', '.venv', '__pycache__',
  'build', 'build-test', 'coverage', 'dist', 'node_modules', 'target',
]);

function copyFilter(source) {
  const name = source.split(/[\\/]/).at(-1);
  if (EXCLUDED_NAMES.has(name)) return false;
  if (name?.endsWith('.tsbuildinfo')) return false;
  if (/\.py[co]$/.test(name ?? '')) return false;
  if (name === '.env' || name?.endsWith('.local')) return false;
  return true;
}

async function copyTree(source, destination) {
  await cp(source, destination, { recursive: true, filter: copyFilter });
}

async function runtimeDependencyLocks(plan, output) {
  const entries = [];
  for (const app of plan.applications) {
    if (app.runtime !== 'fastapi') continue;
    for (const filename of ['requirements.lock', 'requirements.runtime.lock']) {
      const relative = `${app.appDir}/${filename}`;
      const bytes = await readFile(join(output, relative));
      entries.push({
        application: app.id,
        runtime: app.runtime,
        lockfile: relative,
        lockDigest: createHash('sha256').update(bytes).digest('hex'),
      });
    }
  }
  return entries;
}

async function materializeFoundation(plan, output) {
  for (const app of plan.applications) {
    await copyTree(join(FOUNDATION_ROOT, app.source), join(output, app.appDir));
  }
  for (const packageName of ['api-contracts', 'api-client-fetch', ...(plan.designSystem ? ['ui-kit'] : [])]) {
    await copyTree(join(FOUNDATION_ROOT, 'packages', packageName), join(output, 'packages', packageName));
  }
  for (const capability of plan.capabilities) {
    await copyTree(join(FOUNDATION_ROOT, 'capabilities', capability), join(output, 'capabilities', capability));
  }
}

// Starters that are npm packages (become workspace members of the generated
// monorepo). Spring (Maven) and Flutter (pub) are not npm workspaces.
const NPM_STARTERS = new Set(['nestjs', 'nextjs', 'angular', 'react-native']);

function npmAppWorkspaces(plan) {
  return plan.applications
    .filter((app) => NPM_STARTERS.has(app.runtime))
    .map((app) => app.appDir);
}

/**
 * Root package of the generated project: a single unified npm workspace. See the
 * generated README for the dependency strategy. Derived from the plan only.
 */
function rootPackage(plan) {
  const packageBuilds = [
    'npm run build --workspace=@enistere/api-contracts',
    'npm run build --workspace=@enistere/api-client-fetch',
    ...(plan.designSystem ? ['npm run build --workspace=@enistere/ui-kit'] : []),
  ];
  return {
    name: plan.project,
    version: '0.1.0',
    private: true,
    workspaces: ['packages/*', ...npmAppWorkspaces(plan)],
    overrides: {
      'form-data': '^4.0.6',
      'js-yaml': '^4.2.0',
      next: {
        postcss: '8.5.23',
      },
    },
    scripts: {
      'build:packages': packageBuilds.join(' && '),
      verify: 'node scripts/verify.mjs',
    },
  };
}

function localCompose(plan) {
  return `name: ${plan.project}\nservices:\n  postgres:\n    image: postgres:17-alpine\n    environment:\n      POSTGRES_DB: \${POSTGRES_DB:-enistere}\n      POSTGRES_USER: \${POSTGRES_USER:-enistere}\n      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}\n    volumes: [postgres-data:/var/lib/postgresql/data]\n    healthcheck:\n      test: [CMD-SHELL, pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB]\n      interval: 10s\n      timeout: 5s\n      retries: 5\n  redis:\n    image: redis:7-alpine\n    command: [redis-server, --appendonly, 'yes']\n    volumes: [redis-data:/data]\n  minio:\n    image: minio/minio:RELEASE.2025-04-22T22-12-26Z\n    command: server /data --console-address :9001\n    environment:\n      MINIO_ROOT_USER: \${MINIO_ROOT_USER:?set MINIO_ROOT_USER}\n      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:?set MINIO_ROOT_PASSWORD}\n    volumes: [minio-data:/data]\nvolumes:\n  postgres-data:\n  redis-data:\n  minio-data:\n`;
}

function stagingCompose(plan) {
  return `name: ${plan.project}-staging\nservices:\n  proxy:\n    image: traefik:v3.5\n    command: [--providers.docker=true, --providers.docker.exposedbydefault=false, --entrypoints.websecure.address=:443]\n    ports: ['443:443']\n    volumes: [/var/run/docker.sock:/var/run/docker.sock:ro]\n    restart: unless-stopped\n# Add generated application services behind proxy labels after image publication.\n`;
}

function verifyScript(plan, overlayVerification = {}) {
  const commands = {
    nestjs: ['npm', 'run', 'openapi:check'],
    spring: ['./mvnw', 'verify', '--no-transfer-progress'],
    fastapi: ['.venv/bin/python', '-m', 'pytest', '-q'],
    nextjs: ['npm', 'run', 'check'],
    angular: ['npm', 'run', 'test:ci'],
    'react-native': ['npm', 'run', 'doctor'],
    flutter: ['flutter', 'analyze'],
  };
  const steps = plan.applications.flatMap((app) => [
    { cwd: app.appDir, argv: commands[app.runtime] },
    ...(overlayVerification[app.id] ?? []).map((argv) => ({ cwd: app.appDir, argv })),
  ]);
  return `import { spawnSync } from 'node:child_process';\n\nconst rootBuild = spawnSync('npm', ['run', 'build:packages'], { stdio: 'inherit', shell: false });\nif (rootBuild.status !== 0) process.exit(rootBuild.status ?? 1);\nconst steps = ${JSON.stringify(steps, null, 2)};\nfor (const step of steps) {\n  const [command, ...args] = step.argv;\n  const result = spawnSync(command, args, { cwd: step.cwd, stdio: 'inherit', shell: false });\n  if (result.status !== 0) process.exit(result.status ?? 1);\n}\n`;
}

const STARTER_LABELS = {
  nestjs: 'NestJS (API)', spring: 'Spring Boot (API)', fastapi: 'FastAPI (API)',
  nextjs: 'Next.js (Web)',
  angular: 'Angular (Web)', 'react-native': 'React Native / Expo (Mobile)', flutter: 'Flutter (Mobile)',
};
function runCommand(runtime, appDir) {
  switch (runtime) {
    case 'nestjs': return `npm run start:dev --workspace=${appDir}`;
    case 'spring': return `(cd ${appDir} && ./mvnw spring-boot:run)`;
    case 'fastapi': return `(cd ${appDir} && .venv/bin/python -m uvicorn app.main:app --reload --port 8000)`;
    case 'nextjs': return `npm run dev --workspace=${appDir}`;
    case 'angular': return `npm run start --workspace=${appDir}`;
    case 'react-native': return `npm run start --workspace=${appDir}`;
    case 'flutter': return `(cd ${appDir} && flutter run)`;
    default: return '';
  }
}

/** README derived from the plan — no hand-written divergence, no blueprint read. */
function projectReadme(plan, overlays) {
  const apps = plan.applications;
  const hasApi = apps.some((app) => app.kind === 'api');
  const hasNestjs = apps.some((app) => app.runtime === 'nestjs');
  const hasFastapi = apps.some((app) => app.runtime === 'fastapi');
  const nestjsApiDir = apps.find((app) => app.runtime === 'nestjs' && app.kind === 'api')?.appDir ?? 'apps/api';
  const stackLines = apps.map((app) => `- \`${app.appDir}\` — ${STARTER_LABELS[app.runtime] ?? app.runtime}`);
  const runLines = apps.map((app) => `- ${STARTER_LABELS[app.runtime] ?? app.runtime} : \`${runCommand(app.runtime, app.appDir)}\``);
  const overlayLines = overlays.length
    ? overlays.map((o) => `- \`${o.capability}\` sur \`${o.target}\` — v${o.version} (digest \`${o.digest.slice(0, 12)}…\`)`)
    : ['- aucune (baseline `base` seule)'];
  const envLines = [];
  for (const app of apps) {
    if (app.runtime === 'nestjs') envLines.push(`- \`${app.appDir}/.env\` — copier depuis \`${app.appDir}/.env.example\` (config API, secrets Auth si composé).`);
    else if (app.runtime === 'nextjs') envLines.push(`- \`${app.appDir}/.env.local\` — copier depuis \`${app.appDir}/.env.example\`.`);
    else if (app.runtime === 'react-native') envLines.push(`- \`${app.appDir}/.env\` — copier depuis \`${app.appDir}/.env.example\`.`);
    else if (app.runtime === 'fastapi') envLines.push(`- \`${app.appDir}\` — variables préfixées \`ENISTERE_\` (configuration typée Pydantic).`);
  }
  envLines.push('- `infrastructure/local/.env` — copier depuis `infrastructure/local/.env.example` (mots de passe locaux).');

  return [
    `# ${plan.displayName}`,
    '',
    'Généré par l\'Enistere Project Factory. Ce README est dérivé du blueprint (`enistere.yaml`) et du',
    'plan de génération (`enistere.lock`) ; ne pas le diverger manuellement (régénérez le projet).',
    '',
    '## Stack sélectionnée',
    '',
    ...stackLines,
    `- Design system (\`packages/ui-kit\`) : ${plan.designSystem ? 'activé' : 'désactivé'}`,
    '',
    '## Capabilities',
    '',
    `Sélection : ${plan.capabilities.map((c) => `\`${c}\``).join(', ')}.`,
    '',
    'Overlays appliqués :',
    '',
    ...overlayLines,
    '',
    'Une génération sans capability ne contient aucune surface au-delà du Platform Baseline. Les capabilities sont',
    'ajoutées uniquement via leurs overlays déclaratifs (voir `enistere.lock` → `overlays`).',
    '',
    '## Prérequis',
    '',
    '- Node.js 24+ et npm 10+ (workspace unifié).',
    ...(hasFastapi ? ['- Python 3.12 à 3.14 (API FastAPI).'] : []),
    '- Docker + Docker Compose (infrastructure locale : PostgreSQL, etc.).',
    ...(hasNestjs ? ['- Un accès PostgreSQL (fourni par `infrastructure/local/compose.yaml`).'] : []),
    '',
    '## Installation (reproductible)',
    '',
    'Projet monorepo à **workspace npm unifié** : les packages `@enistere/*` sont des membres du',
    'workspace (`packages/*`), résolus sans `file:` ni registre. Un seul `package-lock.json` racine',
    'verrouille tout l\'arbre.',
    '',
    'L\'état de verrouillage est déclaré dans `enistere.lock` (`dependenciesLocked`). S\'il vaut `false`,',
    'le projet a été généré **sans** finalisation des dépendances : lancez-la depuis la Foundation',
    '(`enistere install <ce-projet>`), ou de façon équivalente :',
    '',
    '```bash',
    '# 1) Résolution déterministe du lock racine, sans script lifecycle.',
    'npm install --package-lock-only --ignore-scripts',
    '',
    '# 2) Installation reproductible strictement depuis le lock.',
    'npm ci',
    '',
    '# 3) Build des packages partagés (contracts, client, UI Kit).',
    'npm run build:packages',
    ...(hasFastapi ? [
      '',
      '# 4) Installation de l’arbre Python transitif verrouillé.',
      'python -m venv apps/api/.venv',
      'apps/api/.venv/bin/python -m pip install -r apps/api/requirements.lock',
    ] : []),
    '```',
    '',
    'Une fois verrouillé, `enistere verify <ce-projet>` recalcule le digest du lock et détecte toute',
    'modification par rapport à celui enregistré dans `enistere.lock`.',
    ...(hasFastapi ? ['Le même contrôle couvre les locks Python d’installation et de production dès la génération.'] : []),
    '',
    '## Variables d\'environnement',
    '',
    ...envLines,
    '',
    'Aucune valeur réelle n\'est committée : les fichiers `.env*` sont ignorés par git.',
    '',
    '## Infrastructure locale',
    '',
    '```bash',
    'cp infrastructure/local/.env.example infrastructure/local/.env   # ajuster les mots de passe',
    'docker compose --env-file infrastructure/local/.env -f infrastructure/local/compose.yaml up -d',
    '```',
    '',
    ...(hasNestjs ? [
      '## Migrations (API NestJS + Prisma)',
      '',
      '```bash',
      `npm run prisma:generate --workspace=${nestjsApiDir}`,
      `npm run prisma:migrate:deploy --workspace=${nestjsApiDir}`,
      '```',
      '',
    ] : []),
    '## Démarrage des applications',
    '',
    ...runLines,
    '',
    '## Tests et vérifications',
    '',
    '```bash',
    'npm run verify        # build des packages + vérification par application (voir scripts/verify.mjs)',
    '```',
    '',
    ...(hasApi ? [
      'Par application (exemples) :',
      '',
      ...(hasNestjs ? [
        '```bash',
        `npm run lint --workspace=${nestjsApiDir}`,
        `npm run test --workspace=${nestjsApiDir}`,
        `npm run openapi:check --workspace=${nestjsApiDir}`,
        `npm run build --workspace=${nestjsApiDir}`,
        '```',
        '',
      ] : []),
    ] : []),
    '## Limites connues',
    '',
    '- Les capabilities non sélectionnées ne sont pas présentes ; régénérez le projet pour en ajouter.',
    '- La finalisation des dépendances requiert un accès réseau au registre npm ; ensuite `npm ci` suffit.',
    ...(plan.applications.some((app) => app.runtime === 'react-native') ? ['- Le build mobile natif (iOS) requiert macOS/Xcode ; `npm run doctor --workspace=apps/mobile` et `expo export` restent disponibles hors simulateur.'] : []),
    '',
    '## Provenance Foundation',
    '',
    '- Blueprint : `enistere.yaml`',
    '- Plan et lock (versions/digests des overlays) : `enistere.lock`',
    `- Mode de génération : \`${plan.generationMode}\``,
    '',
  ].join('\n');
}

/**
 * The generator (ADR-046) — materializes a project from a GenerationPlan ONLY.
 * It reads no blueprint, no profile and no unresolved configuration: every datum
 * comes from the plan. Capability overlay files are read from the Foundation by
 * capability id (carried by the plan).
 */
export async function materializeProject(plan, output, options = {}) {
  if (await exists(output)) throw new Error(`Output already exists: ${output}`);
  if (hasErrors(plan.diagnostics) || plan.support.level !== 'ready') {
    const detail = hasErrors(plan.diagnostics)
      ? formatDiagnostics(errors(plan.diagnostics))
      : plan.support.blockers.map((b) => `${b.capability} on ${b.starter} is ${b.status}`).join(', ');
    throw new Error(`Composition is not generatable:\n${detail}`);
  }
  for (const directory of plan.directories) await mkdir(join(output, directory), { recursive: true });
  let overlays = { applied: [], verification: {} };
  if (options.materialize !== false) {
    const capabilityManifests = await loadCapabilityManifests(FOUNDATION_ROOT, plan.capabilities);
    await materializeFoundation(plan, output);
    overlays = await applyCapabilityOverlays({ repoRoot: FOUNDATION_ROOT, plan, output, capabilityManifests });
    for (const app of plan.applications) {
      await rm(join(output, `${app.appDir}/package-lock.json`), { force: true });
    }
  }
  const runtimeLocks = options.materialize === false ? [] : await runtimeDependencyLocks(plan, output);
  await mkdir(join(output, 'scripts'), { recursive: true });
  await writeFile(join(output, 'enistere.lock'), stable({
    schemaVersion: '1', foundationVersion: '2.0.0-dev',
    systemDigest: plan.systemDigest, resolutionDigest: plan.resolutionDigest, planDigest: plan.planDigest,
    plan,
    overlays: overlays.applied,
    dependenciesLocked: false,
    lockfile: 'package-lock.json',
    lockDigest: null,
    lockfileVersion: null,
    runtimeLocks,
  }));
  await writeFile(join(output, 'README.md'), projectReadme(plan, overlays.applied));
  await writeFile(join(output, 'package.json'), stable(rootPackage(plan)));
  await writeFile(join(output, 'scripts/verify.mjs'), verifyScript(plan, overlays.verification));
  await writeFile(join(output, 'packages/contracts/README.md'), '# Contracts\n\nGenerated from the neutral blueprint.\n');
  await writeFile(join(output, 'packages/contracts/domain.json'), stable({ entities: plan.domain.entities }));
  await writeFile(join(output, 'packages/contracts/openapi.json'), stable(generateOpenApi({ name: plan.displayName, entities: plan.domain.entities })));
  await writeFile(join(output, 'infrastructure/local/README.md'), '# Local deployment\n');
  await writeFile(join(output, 'infrastructure/local/compose.yaml'), localCompose(plan));
  await writeFile(join(output, 'infrastructure/local/.env.example'), 'POSTGRES_PASSWORD=change-me\nMINIO_ROOT_USER=change-me\nMINIO_ROOT_PASSWORD=change-me\n');
  if (plan.environments.some((environment) => environment.id === 'staging')) {
    await writeFile(join(output, 'infrastructure/staging/README.md'), '# Staging deployment\n\nCopy `.env.example` to the deployment secret store; never commit real values.\n');
    await writeFile(join(output, 'infrastructure/staging/compose.yaml'), stagingCompose(plan));
    await writeFile(join(output, 'infrastructure/staging/.env.example'), 'STAGING_DOMAIN=staging.example.com\n');
  }
  await writeFile(join(output, 'docs/ARCHITECTURE.md'), `# Architecture\n\nCapabilities: ${plan.capabilities.join(', ')}\n`);
  return plan;
}

/**
 * The single canonical pipeline entry: blueprint → CSM → ResolvedSystem →
 * GenerationPlan → materialize. Only this orchestrator sees the blueprint (for
 * normalization inside `buildGenerationPlan` and for the `enistere.yaml`
 * provenance file); the generator (`materializeProject`) consumes only the plan.
 */
export async function generateProject(blueprint, output, options = {}) {
  const starterManifests = await loadStarterManifests(FOUNDATION_ROOT);
  const capabilityManifests = await loadCapabilityManifests(FOUNDATION_ROOT, blueprint.capabilities);
  const plan = buildGenerationPlan(blueprint, {
    modularStarters: modularStarterIds(starterManifests),
    starters: starterManifests,
    capabilityManifests,
  });
  await materializeProject(plan, output, options);
  await writeFile(join(output, 'enistere.yaml'), stable(blueprint));
  return plan;
}
