#!/usr/bin/env node
/**
 * release-helper.mjs — Factory Quality : assistant local de preparation release.
 *
 * Usage :
 *   node factory/quality/scripts/release-helper.mjs types
 *   node factory/quality/scripts/release-helper.mjs draft --type quality-v2-increment --version quality-v2.8 --since foundation-v1.0.0
 *
 * Ce script ne cree aucun tag, aucune GitHub Release, aucun commit et ne modifie aucun fichier.
 * Il produit un brouillon Markdown sur stdout pour revue humaine.
 */

import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPO_ROOT = resolve(__dirname, '../../..');

export const RELEASE_TYPES = Object.freeze({
  'foundation-v1-baseline': Object.freeze({
    label: 'Foundation V1 baseline',
    recommendedGates: Object.freeze([
      'node factory/quality/scripts/quality-gates.mjs run all-safe',
      'CI L1 api-contracts/api-client-fetch/ui-kit/web-nextjs/audit',
      'CI L2 api-runtime',
      'CI L3 web-e2e',
      'CI L4 api-smoke/images',
    ]),
    defaultExcluded: Object.freeze([
      'Cloud staging réel — seulement si release staging-candidate',
      'smoke:ios — macOS/Xcode requis',
    ]),
  }),
  'core-v1-validation': Object.freeze({
    label: 'Core V1 validation',
    recommendedGates: Object.freeze([
      'Gates locaux du core concerné',
      'CI couvrant le core',
      'node factory/quality/scripts/quality-gates.mjs run docs',
      'npm audit',
    ]),
    defaultExcluded: Object.freeze([
      'Gates des cores non modifiés',
      'Cloud staging réel — hors validation staging',
    ]),
  }),
  'quality-v2-increment': Object.freeze({
    label: 'Factory Quality V2 increment',
    recommendedGates: Object.freeze([
      'node factory/quality/scripts/quality-gates.mjs run docs',
      'node --test factory/quality/scripts/quality-gates.test.mjs',
      'npm audit',
      'git diff --check',
    ]),
    defaultExcluded: Object.freeze([
      'CI runtime/E2E/images — PR docs/tooling only',
      'Cloud staging réel — hors scope Factory Quality',
    ]),
  }),
  'staging-candidate': Object.freeze({
    label: 'Staging candidate',
    recommendedGates: Object.freeze([
      'node factory/quality/scripts/quality-gates.mjs run all-safe',
      'CI L1-L4 verte sur le SHA candidat',
      'Runbook CC11 exécuté',
      'Rapport CC11 versionné sans secret',
    ]),
    defaultExcluded: Object.freeze([
      'Production — hors périmètre V1',
    ]),
  }),
  hotfix: Object.freeze({
    label: 'Hotfix',
    recommendedGates: Object.freeze([
      'Gates locaux du périmètre corrigé',
      'CI complète selon impact',
      'npm audit',
      'git diff --check',
    ]),
    defaultExcluded: Object.freeze([
      'Tout gate hors périmètre du fix doit être justifié explicitement',
    ]),
  }),
});

const SENSITIVE_PATTERNS = [
  /bearer\s+[a-z0-9._~+/-]+=*/gi,
  /authorization[:=]\s*\S+/gi,
  /password[:=]\s*\S+/gi,
  /token[:=]\s*\S+/gi,
  /secret[:=]\s*\S+/gi,
  /x-amz-signature=[^&\s]+/gi,
];

export function listReleaseTypes() {
  return Object.keys(RELEASE_TYPES);
}

export function isKnownReleaseType(type) {
  return Object.prototype.hasOwnProperty.call(RELEASE_TYPES, type);
}

export function redactReleaseText(value) {
  let text = String(value ?? '');
  for (const pattern of SENSITIVE_PATTERNS) {
    text = text.replace(pattern, '[Redacted]');
  }
  return text;
}

export function normalizeCommitLine(line) {
  return redactReleaseText(line)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

export function parseCliArgs(argv) {
  const result = { command: argv[0], options: {} };
  for (let index = 1; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) {
      throw new Error(`Argument inattendu : ${current}`);
    }
    const key = current.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Valeur manquante pour --${key}`);
    }
    result.options[key] = value;
    index += 1;
  }
  return result;
}

export function validateDraftInput(input) {
  const errors = [];
  if (!isKnownReleaseType(input.type)) {
    errors.push(`type inconnu : ${input.type ?? '(manquant)'}`);
  }
  if (!input.version || !/^[a-z0-9][a-z0-9._-]*$/i.test(input.version)) {
    errors.push('version invalide ou manquante');
  }
  if (!input.since || input.since.includes('..') || /\s/.test(input.since)) {
    errors.push('ref --since invalide ou manquante');
  }
  if (input.to && (input.to.includes('..') || /\s/.test(input.to))) {
    errors.push('ref --to invalide');
  }
  return errors;
}

export function buildReleaseDraft(input) {
  const typeInfo = RELEASE_TYPES[input.type];
  if (!typeInfo) {
    throw new Error(`type inconnu : ${input.type}`);
  }

  const commits = (input.commits ?? [])
    .map(normalizeCommitLine)
    .filter(Boolean);
  const today = input.date ?? new Date().toISOString().slice(0, 10);
  const toRef = input.to ?? 'HEAD';
  const scope = redactReleaseText(input.scope ?? typeInfo.label);
  const exclusions = input.excluded ?? typeInfo.defaultExcluded;

  return [
    `## [${input.version}] — ${today}`,
    '',
    '### Résumé',
    '',
    `Release candidate de type \`${input.type}\` pour le périmètre : ${scope}.`,
    '',
    '### Cores impactés',
    '',
    `- ${scope}`,
    '',
    '### Changements depuis la référence',
    '',
    `Référence : \`${input.since}..${toRef}\``,
    '',
    commits.length > 0 ? commits.map((line) => `- ${line}`).join('\n') : '- Aucun commit listé.',
    '',
    '### Sécurité / gouvernance',
    '',
    '- Aucun secret volontairement inclus dans ces notes.',
    '- Aucun tag ni GitHub Release créé par ce helper.',
    '- Validation humaine requise avant publication.',
    '',
    '### Migrations / breaking changes',
    '',
    '- À compléter par le mainteneur si applicable.',
    '',
    '### Gates attendus',
    '',
    '| Gate | Résultat |',
    '|---|---|',
    ...typeInfo.recommendedGates.map((gate) => `| \`${gate}\` | À compléter |`),
    '',
    '### Gates non exécutés / exclus',
    '',
    '| Gate | Raison |',
    '|---|---|',
    ...exclusions.map((item) => {
      const [gate, reason] = String(item).split(' — ');
      return `| ${redactReleaseText(gate)} | ${redactReleaseText(reason ?? 'À justifier')} |`;
    }),
    '',
    '### Limites connues',
    '',
    '- À compléter par le mainteneur.',
    '',
    '### Prochaine action',
    '',
    '- À compléter par le mainteneur.',
    '',
  ].join('\n');
}

function gitLogLines({ since, to }) {
  const range = `${since}..${to ?? 'HEAD'}`;
  return new Promise((resolvePromise, reject) => {
    execFile(
      'git',
      ['log', range, '--oneline', '--no-decorate'],
      { cwd: REPO_ROOT, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
          return;
        }
        resolvePromise(stdout.split('\n').map((line) => line.trim()).filter(Boolean));
      },
    );
  });
}

function usage() {
  return `
Usage :
  node factory/quality/scripts/release-helper.mjs types
  node factory/quality/scripts/release-helper.mjs draft --type <type> --version <version> --since <ref> [--to <ref>] [--scope <label>]

Types :
${listReleaseTypes().map((type) => `  ${type.padEnd(24)} ${RELEASE_TYPES[type].label}`).join('\n')}

Notes :
  - Ce helper écrit uniquement sur stdout.
  - Il ne crée aucun tag, aucune GitHub Release, aucun commit.
  - Les notes générées doivent être relues et complétées par un mainteneur.
`;
}

if (process.argv[1] === __filename) {
  try {
    const { command, options } = parseCliArgs(process.argv.slice(2));
    if (!command || command === '--help' || command === '-h') {
      console.log(usage());
      process.exit(0);
    }

    if (command === 'types') {
      console.log(listReleaseTypes().map((type) => `${type}\t${RELEASE_TYPES[type].label}`).join('\n'));
      process.exit(0);
    }

    if (command === 'draft') {
      const input = {
        type: options.type,
        version: options.version,
        since: options.since,
        to: options.to ?? 'HEAD',
        scope: options.scope,
      };
      const errors = validateDraftInput(input);
      if (errors.length > 0) {
        console.error(`Erreur : ${errors.join('; ')}\n${usage()}`);
        process.exit(1);
      }
      const commits = await gitLogLines(input);
      console.log(buildReleaseDraft({ ...input, commits }));
      process.exit(0);
    }

    console.error(`Erreur : commande inconnue "${command}".${usage()}`);
    process.exit(1);
  } catch (error) {
    console.error(`Erreur : ${error.message}`);
    process.exit(1);
  }
}
