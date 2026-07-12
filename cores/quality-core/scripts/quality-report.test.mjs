/**
 * quality-report.test.mjs — Tests unitaires pour quality-report.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUALITY_SCOPES,
  buildMarkdownReport,
  buildQualityRows,
  getCoverageStatus,
  scriptExists,
} from './quality-report.mjs';

describe('QUALITY_SCOPES', () => {
  it('couvre les scopes qualité principaux', () => {
    const ids = QUALITY_SCOPES.map((scope) => scope.id);
    assert.deepStrictEqual(ids, [
      'api-contracts',
      'api-client-fetch',
      'ui-kit',
      'web-nextjs',
      'mobile-react-native',
      'api-nestjs',
      'quality-core',
      'docs-core',
    ]);
  });
});

describe('scriptExists', () => {
  it('détecte les scripts package.json existants', () => {
    const web = QUALITY_SCOPES.find((scope) => scope.id === 'web-nextjs');
    const api = QUALITY_SCOPES.find((scope) => scope.id === 'api-nestjs');
    assert.equal(scriptExists(web, 'test:coverage'), true);
    assert.equal(scriptExists(api, 'test:cov'), true);
  });

  it('retourne false pour les scopes sans package.json', () => {
    const quality = QUALITY_SCOPES.find((scope) => scope.id === 'quality-core');
    assert.equal(scriptExists(quality, 'test'), false);
  });
});

describe('getCoverageStatus', () => {
  it('marque web-nextjs et api-nestjs comme coverage disponible', () => {
    assert.equal(getCoverageStatus(QUALITY_SCOPES.find((scope) => scope.id === 'web-nextjs')), 'disponible');
    assert.equal(getCoverageStatus(QUALITY_SCOPES.find((scope) => scope.id === 'api-nestjs')), 'disponible');
  });

  it('marque les autres scopes comme coverage absente', () => {
    const withoutCoverage = QUALITY_SCOPES.filter((scope) => !['web-nextjs', 'api-nestjs'].includes(scope.id));
    for (const scope of withoutCoverage) {
      assert.equal(getCoverageStatus(scope), 'absente', scope.id);
    }
  });
});

describe('buildQualityRows', () => {
  it('produit une ligne par scope avec les champs attendus', () => {
    const rows = buildQualityRows();
    assert.equal(rows.length, QUALITY_SCOPES.length);
    for (const row of rows) {
      assert.ok(row.id);
      assert.ok(row.label);
      assert.ok(row.testCommand);
      assert.ok(row.expectedTests);
      assert.ok(row.coverageStatus);
      assert.ok(row.coverageCommand);
      assert.ok(row.ciLevel);
    }
  });
});

describe('buildMarkdownReport', () => {
  it('génère un rapport markdown déterministe avec synthèse et matrice', () => {
    const report = buildMarkdownReport({ date: '2026-07-12' });
    assert.match(report, /# Quality Report — Tests \/ Coverage Baseline \(2026-07-12\)/);
    assert.match(report, /Scopes suivis : 8/);
    assert.match(report, /Coverage disponible localement : 2/);
    assert.match(report, /Pourcentage global non calculé/);
    assert.match(report, /\| Scope \| Tests attendus \| Gate test \| Coverage \| Commande coverage \| CI \|/);
  });

  it('ne prétend pas publier ou lancer les tests', () => {
    const report = buildMarkdownReport({ date: '2026-07-12' });
    assert.match(report, /Il ne lance aucun test/);
    assert.match(report, /ne publie aucun artefact/);
    assert.match(report, /Ne force pas de seuil minimal/);
  });
});
