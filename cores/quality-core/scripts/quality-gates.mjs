#!/usr/bin/env node
/**
 * quality-gates.mjs — Quality Core 2 : sélection et exécution des gates qualité locaux sûrs.
 *
 * Usage :
 *   node cores/quality-core/scripts/quality-gates.mjs list
 *   node cores/quality-core/scripts/quality-gates.mjs plan <scope>
 *   node cores/quality-core/scripts/quality-gates.mjs run <scope>
 *
 * Scopes : docs | packages | ui-kit | web | root-audit | mobile-static | all-safe
 *
 * Aucune dépendance externe. Compatible Node 24.
 * Gates exclus : Cloud/staging, smoke Android/iOS, E2E Playwright, api-nestjs e2e.
 */

import { spawn } from 'node:child_process';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPO_ROOT = resolve(__dirname, '../../..');
const MOBILE_CWD = resolve(REPO_ROOT, 'cores/mobile-react-native');

// ---------------------------------------------------------------------------
// Step builder helpers (no external state)
// ---------------------------------------------------------------------------

function step(label, cmd, args, cwd) {
  return { label, cmd, args, cwd: cwd ?? REPO_ROOT };
}

// npm workspace script (run from REPO_ROOT)
function ws(pkg, script) {
  return step(
    `${pkg}: ${script}`,
    'npm',
    ['run', script, `--workspace=@enistere/${pkg}`],
  );
}

// npm workspace test (npm test, not npm run test)
function wsTest(pkg) {
  return step(
    `${pkg}: test`,
    'npm',
    ['test', `--workspace=@enistere/${pkg}`],
  );
}

// mobile command (run in cores/mobile-react-native)
function mob(script) {
  return step(`mobile: ${script}`, 'npm', ['run', script], MOBILE_CWD);
}
function mobTest() {
  return step('mobile: test', 'npm', ['test'], MOBILE_CWD);
}

// ---------------------------------------------------------------------------
// Scope definitions
// ---------------------------------------------------------------------------

const SCOPE_GATES = {
  docs: [
    step('git diff --check', 'git', ['diff', '--check']),
    step('docs: internal link check', 'node', ['cores/docs-core/scripts/check-doc-links.mjs']),
  ],

  'root-audit': [
    step('npm audit', 'npm', ['audit']),
  ],

  packages: [
    ws('api-contracts', 'typecheck'),
    ws('api-contracts', 'build'),
    ws('api-contracts', 'generate:check'),
    wsTest('api-contracts'),
    ws('api-client-fetch', 'typecheck'),
    ws('api-client-fetch', 'build'),
    wsTest('api-client-fetch'),
  ],

  'ui-kit': [
    ws('ui-kit', 'typecheck'),
    ws('ui-kit', 'lint'),
    wsTest('ui-kit'),
    ws('ui-kit', 'build'),
    ws('ui-kit', 'tokens:check'),
  ],

  web: [
    ws('web-nextjs', 'typecheck'),
    ws('web-nextjs', 'lint'),
    wsTest('web-nextjs'),
    ws('web-nextjs', 'build'),
  ],

  // Static gates only: no expo export (Metro bundle), no smoke (device/émulateur requis)
  'mobile-static': [
    mob('typecheck'),
    mob('lint'),
    mobTest(),
    mob('doctor'),
  ],
};

// all-safe : packages + ui-kit + web + root-audit
// Excludes: mobile-static, api-nestjs (e2e = PG+MinIO requis), E2E Playwright, Cloud
SCOPE_GATES['all-safe'] = [
  ...SCOPE_GATES.packages,
  ...SCOPE_GATES['ui-kit'],
  ...SCOPE_GATES.web,
  ...SCOPE_GATES['root-audit'],
];

// ---------------------------------------------------------------------------
// Scope metadata (descriptions + excluded gates)
// ---------------------------------------------------------------------------

export const SCOPE_DESCRIPTIONS = {
  docs:
    'Vérifie les espaces blancs git et les liens Markdown internes Docs Core. Docs-only.',
  'root-audit':
    'npm audit à la racine du monorepo (0 vuln requis, CI L1).',
  packages:
    'Gates sûrs api-contracts + api-client-fetch : typecheck, build, generate:check, test.',
  'ui-kit':
    'Gates UI Kit : typecheck, lint, test (181, jest-axe), build, tokens:check.',
  web:
    'Gates Web Core : typecheck, lint, test (450), build.',
  'mobile-static':
    'Gates mobiles statiques : typecheck, lint, test (367), doctor. Exclus : expo export, smoke:android, smoke:ios.',
  'all-safe':
    'packages + ui-kit + web + root-audit. Exclus : mobile, api-nestjs e2e, E2E Playwright, Cloud.',
};

const SCOPE_EXCLUDED = {
  'mobile-static': [
    'npx expo export -p ios (Metro bundle — lancez manuellement si nécessaire)',
    'npm run smoke:android (émulateur Android emulator-5554 requis)',
    'npm run smoke:ios (macOS + Xcode + simulateur requis)',
  ],
  'all-safe': [
    'mobile-static (lancez séparément avec le scope mobile-static)',
    'api-nestjs lint / test / test:e2e (PostgreSQL + MinIO requis pour e2e)',
    'E2E Playwright web-nextjs (stack API + PG + MinIO + Chromium requise)',
    'smoke:android / smoke:ios (device ou émulateur requis)',
    'Cloud / staging gates (runbook CC11 — non reproductibles localement)',
  ],
};

// ---------------------------------------------------------------------------
// Public API (exported for tests and external use)
// ---------------------------------------------------------------------------

export function listScopes() {
  return Object.keys(SCOPE_GATES);
}

/** Returns a plan object or null if the scope is unknown. */
export function buildPlan(scope) {
  if (!Object.prototype.hasOwnProperty.call(SCOPE_GATES, scope)) {
    return null;
  }
  return {
    scope,
    description: SCOPE_DESCRIPTIONS[scope] ?? '',
    steps: SCOPE_GATES[scope],
    excluded: SCOPE_EXCLUDED[scope] ?? [],
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function relCwd(cwd) {
  const rel = relative(REPO_ROOT, cwd);
  return rel === '' ? '.' : rel;
}

function printPlan(plan) {
  const total = plan.steps.length;
  console.log(`\nQuality Gates — Plan : ${plan.scope}`);
  console.log(`Scope : ${plan.description}\n`);
  plan.steps.forEach((s, i) => {
    console.log(`  [${String(i + 1).padStart(String(total).length)}/${total}] ${s.label}`);
    console.log(`         cmd : ${s.cmd} ${s.args.join(' ')}`);
    console.log(`         cwd : ${relCwd(s.cwd)}`);
    console.log('');
  });
  if (plan.excluded.length > 0) {
    console.log('EXCLU (non exécuté par ce scope) :');
    plan.excluded.forEach((e) => console.log(`  - ${e}`));
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// Execution helpers
// ---------------------------------------------------------------------------

function runStep(s) {
  return new Promise((resolve) => {
    const child = spawn(s.cmd, s.args, {
      cwd: s.cwd,
      stdio: 'inherit',
      shell: false,
    });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(`  [spawn error] ${err.message}`);
      resolve(1);
    });
  });
}

async function runPlan(plan) {
  const total = plan.steps.length;
  console.log(`\nQuality Gates — Run : ${plan.scope}`);
  console.log(`Scope : ${plan.description}`);
  console.log(`${total} gate(s) à exécuter.\n`);

  let passed = 0;
  for (let i = 0; i < plan.steps.length; i++) {
    const s = plan.steps[i];
    const n = String(i + 1).padStart(String(total).length);
    console.log(`\n[${n}/${total}] ${s.label}`);
    console.log(`  cwd : ${relCwd(s.cwd)}`);
    const code = await runStep(s);
    if (code !== 0) {
      console.error(`\n  ❌ ÉCHEC : ${s.label} (code ${code})`);
      console.log('\n─────────────────────────────────────────────');
      console.log(`❌ Arrêt au gate ${i + 1}/${total} — ${s.label}`);
      console.log(`   ${passed}/${total} gate(s) passé(s) avant arrêt.`);
      return 1;
    }
    passed++;
    console.log(`  ✓ ${s.label}`);
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`✅ ${total}/${total} gate(s) passé(s) — ${plan.scope}`);
  return 0;
}

// ---------------------------------------------------------------------------
// CLI (only when invoked as entry point)
// ---------------------------------------------------------------------------

const USAGE = () => `
Usage :
  node cores/quality-core/scripts/quality-gates.mjs list
  node cores/quality-core/scripts/quality-gates.mjs plan <scope>
  node cores/quality-core/scripts/quality-gates.mjs run <scope>

Scopes disponibles :
${listScopes().map((s) => `  ${s.padEnd(16)} ${SCOPE_DESCRIPTIONS[s]}`).join('\n')}
`;

if (process.argv[1] === __filename) {
  const [, , command, scopeArg] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE());
    process.exit(0);
  }

  if (command === 'list') {
    console.log('\nScopes disponibles :\n');
    listScopes().forEach((s) => {
      console.log(`  ${s.padEnd(16)} ${SCOPE_DESCRIPTIONS[s]}`);
    });
    console.log('');
    process.exit(0);
  }

  if (command === 'plan' || command === 'run') {
    if (!scopeArg) {
      console.error(`Erreur : scope manquant.${USAGE()}`);
      process.exit(1);
    }
    const plan = buildPlan(scopeArg);
    if (!plan) {
      console.error(`Erreur : scope inconnu "${scopeArg}".${USAGE()}`);
      process.exit(1);
    }
    if (command === 'plan') {
      printPlan(plan);
      process.exit(0);
    } else {
      const code = await runPlan(plan);
      process.exit(code);
    }
  }

  console.error(`Erreur : commande inconnue "${command}".${USAGE()}`);
  process.exit(1);
}
