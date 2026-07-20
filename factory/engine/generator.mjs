import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGenerationPlan } from './plan.mjs';
import { generateOpenApi } from './contracts.mjs';
import { assessCapabilitySupport, loadCapabilityManifests, validateCapabilityDependencies } from './capabilities.mjs';
import { loadStarterManifests, modularStarterIds, selectedStarterIds } from './starters.mjs';
import { applyCapabilityOverlays } from './overlay.mjs';

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
 * Root package of the generated project: a single unified npm workspace.
 *
 * Dependency strategy (strategy/06_DEPENDENCY_STRATEGY.md): the generated project
 * never uses `file:`, `npm link` or a path to the Foundation. The shared
 * `@enistere/*` packages are workspace members under `packages/*`, resolved by
 * their consumers through the `*` range against the workspace — so a single root
 * `package-lock.json` (produced by the first `npm install`) locks the whole tree
 * and `npm ci` reinstalls it reproducibly. Per-app lockfiles are removed at
 * generation time; the root lock is authoritative.
 */
function rootPackage(blueprint, plan) {
  const packageBuilds = [
    'npm run build --workspace=@enistere/api-contracts',
    'npm run build --workspace=@enistere/api-client-fetch',
    ...(blueprint.designSystem ? ['npm run build --workspace=@enistere/ui-kit'] : []),
  ];
  return {
    name: blueprint.project.slug,
    version: '0.1.0',
    private: true,
    workspaces: ['packages/*', ...npmAppWorkspaces(plan)],
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

function verifyScript(plan, overlayVerification = {}) {
  const commands = {
    nestjs: ['npm', 'run', 'openapi:check'],
    spring: ['./mvnw', 'verify', '--no-transfer-progress'],
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
  nestjs: 'NestJS (API)', spring: 'Spring Boot (API)', nextjs: 'Next.js (Web)',
  angular: 'Angular (Web)', 'react-native': 'React Native / Expo (Mobile)', flutter: 'Flutter (Mobile)',
};
function runCommand(runtime, appDir) {
  switch (runtime) {
    case 'nestjs': return `npm run start:dev --workspace=${appDir}`;
    case 'spring': return `(cd ${appDir} && ./mvnw spring-boot:run)`;
    case 'nextjs': return `npm run dev --workspace=${appDir}`;
    case 'angular': return `npm run start --workspace=${appDir}`;
    case 'react-native': return `npm run start --workspace=${appDir}`;
    case 'flutter': return `(cd ${appDir} && flutter run)`;
    default: return '';
  }
}

/** README derived from the blueprint and plan — no hand-written divergence. */
function projectReadme(blueprint, plan, overlays) {
  const apps = plan.applications;
  const hasApi = apps.some((app) => app.kind === 'api');
  const hasNestjs = apps.some((app) => app.runtime === 'nestjs');
  // The NestJS API app dir (for Prisma/example commands); the sugar keeps apps/api.
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
  }
  envLines.push('- `infrastructure/local/.env` — copier depuis `infrastructure/local/.env.example` (mots de passe locaux).');

  return [
    `# ${blueprint.project.name}`,
    '',
    'Généré par l\'Enistere Project Factory. Ce README est dérivé du blueprint (`enistere.yaml`) et du',
    'plan de génération (`enistere.lock`) ; ne pas le diverger manuellement (régénérez le projet).',
    '',
    '## Stack sélectionnée',
    '',
    ...stackLines,
    `- Design system (\`packages/ui-kit\`) : ${blueprint.designSystem ? 'activé' : 'désactivé'}`,
    '',
    '## Capabilities',
    '',
    `Sélection : ${blueprint.capabilities.map((c) => `\`${c}\``).join(', ')}.`,
    '',
    'Overlays appliqués :',
    '',
    ...overlayLines,
    '',
    'Une génération `base` seule ne contient aucune surface au-delà du socle. Les capabilities sont',
    'ajoutées uniquement via leurs overlays déclaratifs (voir `enistere.lock` → `overlays`).',
    '',
    '## Prérequis',
    '',
    '- Node.js 24+ et npm 10+ (workspace unifié).',
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
    '```',
    '',
    'Une fois verrouillé, `enistere verify <ce-projet>` recalcule le digest du lock et détecte toute',
    'modification par rapport à celui enregistré dans `enistere.lock`.',
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

export async function generateProject(blueprint, output, options = {}) {
  if (await exists(output)) throw new Error(`Output already exists: ${output}`);
  // The capability dependency contract is enforced by the engine itself, not only
  // by the CLI blueprint validation: `rbac` requires `auth`, everything requires `base`.
  const dependencyIssues = validateCapabilityDependencies(blueprint.capabilities);
  if (dependencyIssues.length) {
    throw new Error(`Capability selection is invalid:\n- ${dependencyIssues.join('\n- ')}`);
  }
  const capabilityManifests = await loadCapabilityManifests(FOUNDATION_ROOT, blueprint.capabilities);
  const support = assessCapabilitySupport(selectedStarterIds(blueprint), capabilityManifests);
  if (!support.ready) {
    const details = support.blockers.map((item) => `${item.capability} on ${item.starter} is ${item.status}`).join(', ');
    throw new Error(`Capability composition is not ready: ${details}`);
  }
  const starterManifests = await loadStarterManifests(FOUNDATION_ROOT);
  const plan = buildGenerationPlan(blueprint, {
    modularStarters: modularStarterIds(starterManifests),
    starters: starterManifests,
  });
  plan.designSystem = blueprint.designSystem;
  for (const directory of plan.directories) await mkdir(join(output, directory), { recursive: true });
  let overlays = { applied: [], verification: {} };
  if (options.materialize !== false) {
    await materializeFoundation(plan, output);
    overlays = await applyCapabilityOverlays({
      repoRoot: FOUNDATION_ROOT, blueprint, plan, output, capabilityManifests,
    });
    // Unified workspace: a single root package-lock.json is authoritative. Remove
    // any per-app lockfile copied from a standalone source starter so the composed
    // manifests resolve from the root lock (npm install → npm ci reproducible).
    for (const app of plan.applications) {
      await rm(join(output, `${app.appDir}/package-lock.json`), { force: true });
    }
  }
  await mkdir(join(output, 'scripts'), { recursive: true });
  await writeFile(join(output, 'enistere.yaml'), stable(blueprint));
  // Generation is offline and cannot resolve the registry: the project starts
  // explicitly UNLOCKED. `enistere install` (or `generate --install`) produces the
  // root lock, installs from it and flips these fields.
  await writeFile(join(output, 'enistere.lock'), stable({
    schemaVersion: '1', foundationVersion: '2.0.0-dev', blueprintDigest: digest(blueprint), plan,
    overlays: overlays.applied,
    dependenciesLocked: false,
    lockfile: 'package-lock.json',
    lockDigest: null,
    lockfileVersion: null,
  }));
  await writeFile(join(output, 'README.md'), projectReadme(blueprint, plan, overlays.applied));
  await writeFile(join(output, 'package.json'), stable(rootPackage(blueprint, plan)));
  await writeFile(join(output, 'scripts/verify.mjs'), verifyScript(plan, overlays.verification));
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
