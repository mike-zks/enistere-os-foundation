#!/usr/bin/env node
/**
 * quality-report.mjs — Quality Core : synthese locale tests/couverture.
 *
 * Usage :
 *   node cores/quality-core/scripts/quality-report.mjs list
 *   node cores/quality-core/scripts/quality-report.mjs markdown
 *
 * Ce script ne lance aucun test et ne publie aucun artefact. Il documente les gates connus et la
 * disponibilite d'une commande de couverture par scope.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPO_ROOT = resolve(__dirname, '../../..');

export const QUALITY_SCOPES = Object.freeze([
  Object.freeze({
    id: 'api-contracts',
    label: '@enistere/api-contracts',
    packageJson: 'packages/api-contracts/package.json',
    testCommand: 'npm test --workspace=@enistere/api-contracts',
    expectedTests: '12',
    coverageCommand: null,
    ciLevel: 'L1',
    notes: 'Types OpenAPI et generation check ; pas de couverture publiee.',
  }),
  Object.freeze({
    id: 'api-client-fetch',
    label: '@enistere/api-client-fetch',
    packageJson: 'packages/api-client-fetch/package.json',
    testCommand: 'npm test --workspace=@enistere/api-client-fetch',
    expectedTests: '30',
    coverageCommand: null,
    ciLevel: 'L1',
    notes: 'Client fetch typé ; pas de couverture publiee.',
  }),
  Object.freeze({
    id: 'ui-kit',
    label: '@enistere/ui-kit',
    packageJson: 'cores/ui-kit/package.json',
    testCommand: 'npm test --workspace=@enistere/ui-kit',
    expectedTests: '181',
    coverageCommand: 'npm run test:coverage --workspace=@enistere/ui-kit',
    ciLevel: 'L1',
    notes: 'Coverage disponible via node --test --experimental-test-coverage ; non publiee.',
  }),
  Object.freeze({
    id: 'web-nextjs',
    label: '@enistere/web-nextjs',
    packageJson: 'cores/web-nextjs/package.json',
    testCommand: 'npm test --workspace=@enistere/web-nextjs',
    expectedTests: '450',
    coverageCommand: 'npm run test:coverage --workspace=@enistere/web-nextjs',
    ciLevel: 'L1/L3',
    notes: 'Coverage disponible via node --test --experimental-test-coverage ; non publiee.',
  }),
  Object.freeze({
    id: 'mobile-react-native',
    label: 'cores/mobile-react-native',
    packageJson: 'cores/mobile-react-native/package.json',
    testCommand: 'cd cores/mobile-react-native && npm test',
    expectedTests: '367',
    coverageCommand: null,
    ciLevel: 'local',
    notes: 'Node --test agnostique ; pas de coverage standardisee.',
  }),
  Object.freeze({
    id: 'api-nestjs',
    label: 'cores/api-nestjs',
    packageJson: 'cores/api-nestjs/package.json',
    testCommand: 'cd cores/api-nestjs && npm test',
    expectedTests: '386 unit + 101 e2e CI',
    coverageCommand: 'cd cores/api-nestjs && npm run test:cov',
    ciLevel: 'L2',
    notes: 'Coverage Jest locale disponible ; non publiee comme artefact gouverne.',
  }),
  Object.freeze({
    id: 'quality-core',
    label: 'cores/quality-core',
    packageJson: null,
    testCommand: 'node --test cores/quality-core/scripts/*.test.mjs',
    expectedTests: 'scripts quality-core',
    coverageCommand: null,
    ciLevel: 'local',
    notes: 'Scripts purs Node ; pas de package npm ni coverage standardisee.',
  }),
  Object.freeze({
    id: 'docs-core',
    label: 'cores/docs-core',
    packageJson: null,
    testCommand: 'node --test cores/docs-core/scripts/check-doc-links.test.mjs',
    expectedTests: 'link-check tests',
    coverageCommand: null,
    ciLevel: 'local',
    notes: 'Script documentaire pur ; pas de coverage standardisee.',
  }),
]);

function readJson(path) {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, path), 'utf8'));
}

export function scriptExists(scope, scriptName) {
  if (!scope.packageJson) {
    return false;
  }
  const pkg = readJson(scope.packageJson);
  return Object.prototype.hasOwnProperty.call(pkg.scripts ?? {}, scriptName);
}

export function getCoverageStatus(scope) {
  if (!scope.coverageCommand) {
    return 'absente';
  }
  if (scope.id === 'web-nextjs' || scope.id === 'ui-kit') {
    return scriptExists(scope, 'test:coverage') ? 'disponible' : 'déclarée mais script absent';
  }
  if (scope.id === 'api-nestjs') {
    return scriptExists(scope, 'test:cov') ? 'disponible' : 'déclarée mais script absent';
  }
  return 'déclarée';
}

export function buildQualityRows(scopes = QUALITY_SCOPES) {
  return scopes.map((scope) => ({
    id: scope.id,
    label: scope.label,
    testCommand: scope.testCommand,
    expectedTests: scope.expectedTests,
    coverageStatus: getCoverageStatus(scope),
    coverageCommand: scope.coverageCommand ?? '—',
    ciLevel: scope.ciLevel,
    notes: scope.notes,
  }));
}

export function buildMarkdownReport({ date = new Date().toISOString().slice(0, 10), scopes = QUALITY_SCOPES } = {}) {
  const rows = buildQualityRows(scopes);
  const coverageAvailable = rows.filter((row) => row.coverageStatus === 'disponible').length;
  const coverageMissing = rows.length - coverageAvailable;

  return [
    `# Quality Report — Tests / Coverage Baseline (${date})`,
    '',
    '> Rapport local informatif. Il ne lance aucun test, ne publie aucun artefact et ne remplace pas la CI.',
    '',
    '## Synthèse',
    '',
    `- Scopes suivis : ${rows.length}`,
    `- Coverage disponible localement : ${coverageAvailable}`,
    `- Coverage absente ou non standardisée : ${coverageMissing}`,
    '- Pourcentage global non calculé : les outils et périmètres ne sont pas homogènes.',
    '',
    '## Matrice',
    '',
    '| Scope | Tests attendus | Gate test | Coverage | Commande coverage | CI |',
    '|---|---:|---|---|---|---|',
    ...rows.map((row) => [
      `| ${row.label}`,
      row.expectedTests,
      `\`${row.testCommand}\``,
      row.coverageStatus,
      row.coverageCommand === '—' ? '—' : `\`${row.coverageCommand}\``,
      `${row.ciLevel} |`,
    ].join(' | ')),
    '',
    '## Notes',
    '',
    ...rows.map((row) => `- **${row.label}** : ${row.notes}`),
    '',
    '## Limites',
    '',
    '- Ne lit pas les sorties CI GitHub.',
    '- Ne lit pas les rapports coverage générés localement.',
    '- Ne force pas de seuil minimal.',
    '- Les tests Cloud/staging restent des gates finaux gouvernés par runbook.',
    '',
  ].join('\n');
}

function usage() {
  return `
Usage :
  node cores/quality-core/scripts/quality-report.mjs list
  node cores/quality-core/scripts/quality-report.mjs markdown

Ce script écrit uniquement sur stdout.
`;
}

if (process.argv[1] === __filename) {
  const [, , command] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    console.log(usage());
    process.exit(0);
  }

  if (command === 'list') {
    console.log(buildQualityRows().map((row) => `${row.id}\t${row.coverageStatus}\t${row.testCommand}`).join('\n'));
    process.exit(0);
  }

  if (command === 'markdown') {
    console.log(buildMarkdownReport());
    process.exit(0);
  }

  console.error(`Erreur : commande inconnue "${command}".${usage()}`);
  process.exit(1);
}
