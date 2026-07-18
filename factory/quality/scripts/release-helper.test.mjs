/**
 * release-helper.test.mjs — Tests unitaires pour release-helper.mjs
 *
 * Vérifie la generation de brouillons sans créer de tag, release, commit ou fichier.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReleaseDraft,
  isKnownReleaseType,
  listReleaseTypes,
  normalizeCommitLine,
  parseCliArgs,
  redactReleaseText,
  validateDraftInput,
} from './release-helper.mjs';

describe('listReleaseTypes', () => {
  it('retourne les 5 types du runbook release', () => {
    assert.deepStrictEqual(listReleaseTypes(), [
      'foundation-v1-baseline',
      'core-v1-validation',
      'quality-v2-increment',
      'staging-candidate',
      'hotfix',
    ]);
  });
});

describe('isKnownReleaseType', () => {
  it('accepte les types connus et refuse les types inconnus', () => {
    assert.equal(isKnownReleaseType('quality-v2-increment'), true);
    assert.equal(isKnownReleaseType('staging-candidate'), true);
    assert.equal(isKnownReleaseType('production'), false);
    assert.equal(isKnownReleaseType(''), false);
  });
});

describe('parseCliArgs', () => {
  it('parse une commande draft avec options', () => {
    assert.deepStrictEqual(
      parseCliArgs([
        'draft',
        '--type',
        'quality-v2-increment',
        '--version',
        'quality-v2.8',
        '--since',
        'foundation-v1.0.0',
      ]),
      {
        command: 'draft',
        options: {
          type: 'quality-v2-increment',
          version: 'quality-v2.8',
          since: 'foundation-v1.0.0',
        },
      },
    );
  });

  it('refuse une option sans valeur', () => {
    assert.throws(() => parseCliArgs(['draft', '--type']), /Valeur manquante/);
  });

  it('refuse un argument positionnel inattendu', () => {
    assert.throws(() => parseCliArgs(['draft', 'extra']), /Argument inattendu/);
  });
});

describe('validateDraftInput', () => {
  it('valide une entree nominale', () => {
    assert.deepStrictEqual(
      validateDraftInput({
        type: 'quality-v2-increment',
        version: 'quality-v2.8',
        since: 'foundation-v1.0.0',
      }),
      [],
    );
  });

  it('refuse type inconnu, version invalide et ref dangereuse', () => {
    const errors = validateDraftInput({
      type: 'production',
      version: '../bad',
      since: 'main..HEAD',
      to: 'bad ref',
    });
    assert.equal(errors.length, 4);
    assert.ok(errors.some((error) => error.includes('type inconnu')));
    assert.ok(errors.some((error) => error.includes('version')));
    assert.ok(errors.some((error) => error.includes('--since')));
    assert.ok(errors.some((error) => error.includes('--to')));
  });
});

describe('redaction', () => {
  it('redacte les secrets connus dans le texte', () => {
    const text = redactReleaseText('fix token=abc Authorization: Bearer abc.def.ghi x-amz-signature=secret');
    assert.ok(!text.includes('abc.def.ghi'));
    assert.ok(!text.includes('x-amz-signature=secret'));
    assert.match(text, /\[Redacted\]/);
  });

  it('normalise et borne les lignes de commit', () => {
    const normalized = normalizeCommitLine(`abc1234   feat: ${'x'.repeat(400)}`);
    assert.ok(normalized.length <= 240);
    assert.equal(normalized.includes('  '), false);
  });
});

describe('buildReleaseDraft', () => {
  it('genere un brouillon markdown complet pour quality-v2-increment', () => {
    const draft = buildReleaseDraft({
      type: 'quality-v2-increment',
      version: 'quality-v2.8',
      since: 'foundation-v1.0.0',
      to: 'HEAD',
      scope: 'Factory Quality',
      date: '2026-07-12',
      commits: ['abc1234 docs(quality): add release helper'],
    });
    assert.match(draft, /## \[quality-v2\.8\] — 2026-07-12/);
    assert.match(draft, /Release candidate de type `quality-v2-increment`/);
    assert.match(draft, /abc1234 docs\(quality\): add release helper/);
    assert.match(draft, /node --test factory\/quality\/scripts\/quality-gates\.test\.mjs/);
    assert.match(draft, /Aucun tag ni GitHub Release créé par ce helper/);
  });

  it('ne pretend pas avoir execute les gates', () => {
    const draft = buildReleaseDraft({
      type: 'hotfix',
      version: 'hotfix-v1.0.1-001',
      since: 'abc1234',
      commits: [],
      date: '2026-07-12',
    });
    assert.match(draft, /À compléter/);
    assert.doesNotMatch(draft, /✅/);
  });

  it('redacte les lignes de commit sensibles', () => {
    const draft = buildReleaseDraft({
      type: 'quality-v2-increment',
      version: 'quality-v2.8',
      since: 'abc1234',
      commits: ['abc1234 fix: remove password=secret-value'],
      date: '2026-07-12',
    });
    assert.ok(!draft.includes('secret-value'));
    assert.match(draft, /\[Redacted\]/);
  });

  it('refuse un type inconnu', () => {
    assert.throws(
      () => buildReleaseDraft({ type: 'unknown', version: 'x', since: 'main' }),
      /type inconnu/,
    );
  });
});
