/**
 * quality-gates.test.mjs — Tests unitaires pour quality-gates.mjs
 *
 * Vérifie la construction des plans sans exécuter les commandes.
 * Compatible node:test (Node 24).
 *
 * Lancer : node --test factory/quality/core/scripts/quality-gates.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan, listScopes, SCOPE_DESCRIPTIONS, REPO_ROOT } from './quality-gates.mjs';
import { resolve } from 'node:path';

const MOBILE_CWD = resolve(REPO_ROOT, 'starters/react-native');
const SPRING_CWD = resolve(REPO_ROOT, 'starters/spring');
const ANGULAR_CWD = resolve(REPO_ROOT, 'starters/angular');

// ---------------------------------------------------------------------------
// listScopes
// ---------------------------------------------------------------------------

describe('listScopes', () => {
  it('retourne les 9 scopes attendus', () => {
    const scopes = listScopes();
    assert.strictEqual(scopes.length, 9);
    for (const s of ['docs', 'root-audit', 'packages', 'ui-kit', 'web', 'web-angular', 'mobile-static', 'api-spring', 'all-safe']) {
      assert.ok(scopes.includes(s), `scope manquant : ${s}`);
    }
  });

  it('ne contient pas les scopes exclus (cloud, api-nestjs, e2e)', () => {
    const scopes = listScopes();
    assert.ok(!scopes.includes('cloud'));
    assert.ok(!scopes.includes('api-nestjs'));
    assert.ok(!scopes.includes('e2e'));
    assert.ok(!scopes.includes('staging'));
  });
});

// ---------------------------------------------------------------------------
// buildPlan — scope inconnu
// ---------------------------------------------------------------------------

describe('buildPlan — scope inconnu', () => {
  it('retourne null pour un scope inconnu', () => {
    assert.strictEqual(buildPlan('inconnu'), null);
    assert.strictEqual(buildPlan(''), null);
    assert.strictEqual(buildPlan('cloud'), null);
    assert.strictEqual(buildPlan('api-nestjs'), null);
    assert.strictEqual(buildPlan('e2e'), null);
    assert.strictEqual(buildPlan('staging'), null);
  });
});

// ---------------------------------------------------------------------------
// buildPlan — docs
// ---------------------------------------------------------------------------

describe('buildPlan — docs', () => {
  it('a exactement 2 étapes : git diff --check + link check', () => {
    const plan = buildPlan('docs');
    assert.ok(plan !== null);
    assert.strictEqual(plan.steps.length, 2);
    assert.strictEqual(plan.steps[0].cmd, 'git');
    assert.deepStrictEqual(plan.steps[0].args, ['diff', '--check']);
    assert.strictEqual(plan.steps[0].cwd, REPO_ROOT);
    assert.strictEqual(plan.steps[1].cmd, 'node');
    assert.deepStrictEqual(plan.steps[1].args, ['factory/quality/core/scripts/docs-link-check.mjs']);
    assert.strictEqual(plan.steps[1].cwd, REPO_ROOT);
  });

  it("n'a aucun gate exclu documenté", () => {
    assert.deepStrictEqual(buildPlan('docs').excluded, []);
  });

  it('documente le controle de liens dans sa description', () => {
    assert.match(buildPlan('docs').description, /liens Markdown internes/);
  });
});

// ---------------------------------------------------------------------------
// buildPlan — root-audit
// ---------------------------------------------------------------------------

describe('buildPlan — root-audit', () => {
  it('a exactement 1 étape : npm audit', () => {
    const plan = buildPlan('root-audit');
    assert.ok(plan !== null);
    assert.strictEqual(plan.steps.length, 1);
    assert.strictEqual(plan.steps[0].cmd, 'npm');
    assert.deepStrictEqual(plan.steps[0].args, ['audit']);
    assert.strictEqual(plan.steps[0].cwd, REPO_ROOT);
  });
});

// ---------------------------------------------------------------------------
// buildPlan — packages
// ---------------------------------------------------------------------------

describe('buildPlan — packages', () => {
  it('a 7 étapes', () => {
    assert.strictEqual(buildPlan('packages').steps.length, 7);
  });

  it('toutes les étapes s\'exécutent à la racine du repo', () => {
    buildPlan('packages').steps.forEach((s) =>
      assert.strictEqual(s.cwd, REPO_ROOT, `cwd inattendu : ${s.cwd}`),
    );
  });

  it('inclut api-contracts generate:check', () => {
    const steps = buildPlan('packages').steps;
    const found = steps.find((s) => s.args.includes('generate:check'));
    assert.ok(found, 'étape generate:check manquante');
    assert.ok(found.args.some((a) => a.includes('api-contracts')));
  });

  it('inclut api-contracts typecheck, build, test', () => {
    const labels = buildPlan('packages').steps.map((s) => s.label);
    assert.ok(labels.some((l) => l.includes('api-contracts') && l.includes('typecheck')));
    assert.ok(labels.some((l) => l.includes('api-contracts') && l.includes('build')));
    assert.ok(labels.some((l) => l.includes('api-contracts') && l.includes('test')));
  });

  it('inclut api-client-fetch typecheck, build, test', () => {
    const labels = buildPlan('packages').steps.map((s) => s.label);
    assert.ok(labels.some((l) => l.includes('api-client-fetch') && l.includes('typecheck')));
    assert.ok(labels.some((l) => l.includes('api-client-fetch') && l.includes('build')));
    assert.ok(labels.some((l) => l.includes('api-client-fetch') && l.includes('test')));
  });

  it('ne contient pas api-nestjs ni cloud', () => {
    const labels = buildPlan('packages').steps.map((s) => s.label);
    assert.ok(!labels.some((l) => l.includes('api-nestjs')));
    assert.ok(!labels.some((l) => l.includes('cloud')));
  });
});

// ---------------------------------------------------------------------------
// buildPlan — ui-kit
// ---------------------------------------------------------------------------

describe('buildPlan — ui-kit', () => {
  it('a 5 étapes', () => {
    assert.strictEqual(buildPlan('ui-kit').steps.length, 5);
  });

  it('inclut tokens:check', () => {
    assert.ok(buildPlan('ui-kit').steps.some((s) => s.args.includes('tokens:check')));
  });

  it('inclut typecheck, lint, test, build', () => {
    const labels = buildPlan('ui-kit').steps.map((s) => s.label);
    assert.ok(labels.some((l) => l.includes('typecheck')));
    assert.ok(labels.some((l) => l.includes('lint')));
    assert.ok(labels.some((l) => l.includes('test')));
    assert.ok(labels.some((l) => l.includes('build')));
  });

  it('toutes les étapes s\'exécutent à la racine du repo (workspace)', () => {
    buildPlan('ui-kit').steps.forEach((s) =>
      assert.strictEqual(s.cwd, REPO_ROOT),
    );
  });
});

// ---------------------------------------------------------------------------
// buildPlan — web
// ---------------------------------------------------------------------------

describe('buildPlan — web', () => {
  it('a 4 étapes', () => {
    assert.strictEqual(buildPlan('web').steps.length, 4);
  });

  it('inclut typecheck, lint, test, build', () => {
    const labels = buildPlan('web').steps.map((s) => s.label);
    assert.ok(labels.some((l) => l.includes('typecheck')));
    assert.ok(labels.some((l) => l.includes('lint')));
    assert.ok(labels.some((l) => l.includes('test')));
    assert.ok(labels.some((l) => l.includes('build')));
  });

  it("n'inclut pas E2E Playwright", () => {
    const labels = buildPlan('web').steps.map((s) => s.label);
    assert.ok(!labels.some((l) => l.toLowerCase().includes('e2e')));
    assert.ok(!labels.some((l) => l.toLowerCase().includes('playwright')));
  });
});

// ---------------------------------------------------------------------------
// buildPlan — web-angular
// ---------------------------------------------------------------------------

describe('buildPlan — web-angular', () => {
  it('a 3 étapes : test:ci, build, audit', () => {
    const plan = buildPlan('web-angular');
    assert.ok(plan !== null);
    assert.strictEqual(plan.steps.length, 3);
    assert.deepStrictEqual(plan.steps.map((s) => s.label), [
      'web-angular: test:ci',
      'web-angular: build',
      'web-angular: audit',
    ]);
  });

  it('toutes les étapes s\'exécutent dans starters/angular', () => {
    buildPlan('web-angular').steps.forEach((s) =>
      assert.strictEqual(s.cwd, ANGULAR_CWD, `cwd inattendu : ${s.cwd}`),
    );
  });

  it('utilise les scripts npm autonomes du core Angular', () => {
    const steps = buildPlan('web-angular').steps;
    assert.deepStrictEqual(steps[0].args, ['run', 'test:ci']);
    assert.deepStrictEqual(steps[1].args, ['run', 'build']);
    assert.deepStrictEqual(steps[2].args, ['audit']);
  });

  it("n'inclut pas workspace npm ni E2E", () => {
    buildPlan('web-angular').steps.forEach((s) => {
      const args = s.args.join(' ');
      assert.ok(!args.includes('--workspace'));
      assert.ok(!args.toLowerCase().includes('e2e'));
    });
  });

  it('sa description mentionne Karma/ChromeHeadless', () => {
    assert.match(buildPlan('web-angular').description, /Karma\/ChromeHeadless/);
  });
});

// ---------------------------------------------------------------------------
// buildPlan — mobile-static
// ---------------------------------------------------------------------------

describe('buildPlan — mobile-static', () => {
  it('a 4 étapes : typecheck, lint, test, doctor', () => {
    assert.strictEqual(buildPlan('mobile-static').steps.length, 4);
    const labels = buildPlan('mobile-static').steps.map((s) => s.label);
    assert.ok(labels.some((l) => l.includes('typecheck')));
    assert.ok(labels.some((l) => l.includes('lint')));
    assert.ok(labels.some((l) => l.includes('test')));
    assert.ok(labels.some((l) => l.includes('doctor')));
  });

  it('toutes les étapes s\'exécutent dans starters/react-native', () => {
    buildPlan('mobile-static').steps.forEach((s) =>
      assert.strictEqual(s.cwd, MOBILE_CWD, `cwd inattendu : ${s.cwd}`),
    );
  });

  it("n'inclut pas expo export ni smoke (non statiques)", () => {
    const labels = buildPlan('mobile-static').steps.map((s) => s.label);
    assert.ok(!labels.some((l) => l.includes('export')));
    assert.ok(!labels.some((l) => l.includes('smoke')));
  });

  it('documente les gates exclus (expo export, smoke:android, smoke:ios)', () => {
    const excl = buildPlan('mobile-static').excluded;
    assert.ok(excl.length > 0, 'aucun gate exclu documenté');
    assert.ok(excl.some((e) => e.includes('expo export')));
    assert.ok(excl.some((e) => e.includes('smoke:android')));
    assert.ok(excl.some((e) => e.includes('smoke:ios')));
  });
});

// ---------------------------------------------------------------------------
// buildPlan — all-safe
// ---------------------------------------------------------------------------

describe('buildPlan — all-safe', () => {
  it('contient exactement packages + ui-kit + web + root-audit', () => {
    const expected =
      buildPlan('packages').steps.length +
      buildPlan('ui-kit').steps.length +
      buildPlan('web').steps.length +
      buildPlan('root-audit').steps.length;
    assert.strictEqual(buildPlan('all-safe').steps.length, expected);
  });

  it('contient toutes les étapes de packages', () => {
    const allSafeLabels = new Set(buildPlan('all-safe').steps.map((s) => s.label));
    buildPlan('packages').steps.forEach((s) =>
      assert.ok(allSafeLabels.has(s.label), `étape manquante dans all-safe : ${s.label}`),
    );
  });

  it('contient toutes les étapes de ui-kit', () => {
    const allSafeLabels = new Set(buildPlan('all-safe').steps.map((s) => s.label));
    buildPlan('ui-kit').steps.forEach((s) =>
      assert.ok(allSafeLabels.has(s.label), `étape manquante dans all-safe : ${s.label}`),
    );
  });

  it('contient toutes les étapes de web', () => {
    const allSafeLabels = new Set(buildPlan('all-safe').steps.map((s) => s.label));
    buildPlan('web').steps.forEach((s) =>
      assert.ok(allSafeLabels.has(s.label), `étape manquante dans all-safe : ${s.label}`),
    );
  });

  it('contient root-audit (npm audit)', () => {
    const allSafeLabels = new Set(buildPlan('all-safe').steps.map((s) => s.label));
    buildPlan('root-audit').steps.forEach((s) =>
      assert.ok(allSafeLabels.has(s.label), `étape manquante dans all-safe : ${s.label}`),
    );
  });

  it("n'inclut aucune étape de mobile-static", () => {
    const allSafeLabels = new Set(buildPlan('all-safe').steps.map((s) => s.label));
    buildPlan('mobile-static').steps.forEach((s) =>
      assert.ok(!allSafeLabels.has(s.label), `all-safe ne devrait pas inclure : ${s.label}`),
    );
  });

  it("n'inclut aucune commande cloud, smoke, e2e, docker", () => {
    buildPlan('all-safe').steps.forEach((s) => {
      const lbl = s.label.toLowerCase();
      assert.ok(!lbl.includes('cloud'), `étape cloud inattendue : ${s.label}`);
      assert.ok(!lbl.includes('smoke'), `étape smoke inattendue : ${s.label}`);
      assert.ok(!lbl.includes('e2e'), `étape e2e inattendue : ${s.label}`);
      assert.ok(!lbl.includes('docker'), `étape docker inattendue : ${s.label}`);
    });
  });

  it("n'inclut pas api-nestjs", () => {
    const labels = buildPlan('all-safe').steps.map((s) => s.label);
    assert.ok(!labels.some((l) => l.includes('api-nestjs')));
  });

  it("n'inclut pas api-spring", () => {
    const labels = buildPlan('all-safe').steps.map((s) => s.label);
    assert.ok(!labels.some((l) => l.includes('api-spring')));
  });

  it("n'inclut pas web-angular", () => {
    const labels = buildPlan('all-safe').steps.map((s) => s.label);
    assert.ok(!labels.some((l) => l.includes('web-angular')));
  });

  it('documente les gates exclus (mobile, web-angular, api-nestjs, api-spring, E2E, Cloud)', () => {
    const excl = buildPlan('all-safe').excluded;
    assert.ok(excl.length > 0, 'aucun gate exclu documenté');
    assert.ok(excl.some((e) => e.toLowerCase().includes('mobile')));
    assert.ok(excl.some((e) => e.toLowerCase().includes('web-angular')));
    assert.ok(excl.some((e) => e.toLowerCase().includes('api-nestjs')));
    assert.ok(excl.some((e) => e.toLowerCase().includes('api-spring')));
    assert.ok(excl.some((e) => e.toLowerCase().includes('e2e') || e.toLowerCase().includes('playwright')));
    assert.ok(excl.some((e) => e.toLowerCase().includes('cloud') || e.toLowerCase().includes('staging')));
  });
});

// ---------------------------------------------------------------------------
// buildPlan — api-spring
// ---------------------------------------------------------------------------

describe('buildPlan — api-spring', () => {
  it('a exactement 1 étape : mvnw verify', () => {
    const plan = buildPlan('api-spring');
    assert.ok(plan !== null);
    assert.strictEqual(plan.steps.length, 1);
    assert.strictEqual(plan.steps[0].cmd, './mvnw');
    assert.deepStrictEqual(plan.steps[0].args, ['verify', '--no-transfer-progress']);
    assert.strictEqual(plan.steps[0].cwd, SPRING_CWD);
  });

  it('s\'exécute dans starters/spring (pas la racine)', () => {
    const plan = buildPlan('api-spring');
    assert.strictEqual(plan.steps[0].cwd, SPRING_CWD);
    assert.notStrictEqual(plan.steps[0].cwd, REPO_ROOT);
  });

  it('documente les gates exclus (MinIO Testcontainers, Tika, smoke staging)', () => {
    const excl = buildPlan('api-spring').excluded;
    assert.ok(excl.length > 0, 'aucun gate exclu documenté');
    assert.ok(excl.some((e) => e.toLowerCase().includes('minio')));
    assert.ok(excl.some((e) => e.toLowerCase().includes('tika')));
    assert.ok(excl.some((e) => e.toLowerCase().includes('staging') || e.toLowerCase().includes('smoke')));
  });

  it('sa description mentionne Docker et Testcontainers', () => {
    assert.match(buildPlan('api-spring').description, /Docker/);
    assert.match(buildPlan('api-spring').description, /Testcontainers/);
  });
});

// ---------------------------------------------------------------------------
// SCOPE_DESCRIPTIONS
// ---------------------------------------------------------------------------

describe('SCOPE_DESCRIPTIONS', () => {
  it('a une description pour chaque scope', () => {
    listScopes().forEach((s) =>
      assert.ok(SCOPE_DESCRIPTIONS[s], `description manquante pour le scope : ${s}`),
    );
  });
});

// ---------------------------------------------------------------------------
// buildPlan — cohérence générale
// ---------------------------------------------------------------------------

describe('buildPlan — cohérence générale', () => {
  it('chaque plan a scope, description, steps, excluded', () => {
    listScopes().forEach((s) => {
      const plan = buildPlan(s);
      assert.ok(plan !== null);
      assert.strictEqual(typeof plan.scope, 'string');
      assert.strictEqual(typeof plan.description, 'string');
      assert.ok(Array.isArray(plan.steps));
      assert.ok(Array.isArray(plan.excluded));
    });
  });

  it('chaque step a label, cmd, args, cwd', () => {
    listScopes().forEach((s) => {
      buildPlan(s).steps.forEach((step) => {
        assert.strictEqual(typeof step.label, 'string');
        assert.strictEqual(typeof step.cmd, 'string');
        assert.ok(Array.isArray(step.args));
        assert.strictEqual(typeof step.cwd, 'string');
      });
    });
  });

  it('aucun scope vide (au moins 1 étape)', () => {
    listScopes().forEach((s) =>
      assert.ok(buildPlan(s).steps.length >= 1, `scope vide : ${s}`),
    );
  });
});
