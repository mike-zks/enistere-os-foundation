import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { evaluateAllowlist } from './secret-allowlist-check.mjs';

const CONFIG = resolve(import.meta.dirname, '../../../.gitleaks.toml');
const NOW = new Date('2026-07-28T12:00:00Z');

function config(description) {
  return `[extend]\nuseDefault = true\n\n[[allowlists]]\ndescription = "${description}"\npaths = ['''x''']\n`;
}

describe('secret allowlist discipline', () => {
  it('accepts the repository configuration', () => {
    const { entries, violations } = evaluateAllowlist(readFileSync(CONFIG, 'utf8'), { now: NOW });
    assert.deepEqual(violations, []);
    assert.ok(entries.length >= 2);
  });

  it('refuses an exception that explains nothing', () => {
    const { violations } = evaluateAllowlist(
      '[extend]\nuseDefault = true\n\n[[allowlists]]\npaths = [\'\'\'x\'\'\']\n',
      { now: NOW },
    );
    // An unexplained allowlist entry is a disable wearing a costume.
    assert.ok(violations.some((issue) => issue.includes('no description')));
  });

  it('refuses an exception with neither a deadline nor a permanent claim', () => {
    const { violations } = evaluateAllowlist(
      config('Une raison assez longue pour être relue'), { now: NOW },
    );
    assert.ok(violations.some((issue) => issue.includes('permanent')));
  });

  it('refuses a justification too short to be reviewable', () => {
    const { violations } = evaluateAllowlist(config('bruit | permanent: parce que'), { now: NOW });
    assert.ok(violations.some((issue) => issue.includes('too short')));
  });

  it('fails an expired temporary exception rather than letting it sleep', () => {
    const { violations } = evaluateAllowlist(
      config('Secret de démonstration en attente de rotation | expires: 2026-07-27'),
      { now: NOW },
    );
    assert.ok(violations.some((issue) => issue.includes('expired on 2026-07-27')));

    const stillValid = evaluateAllowlist(
      config('Secret de démonstration en attente de rotation | expires: 2026-07-29'),
      { now: NOW },
    );
    assert.deepEqual(stillValid.violations, []);
  });

  it('accepts a permanent exception that states its reason', () => {
    const { violations } = evaluateAllowlist(
      config('Fixture de test de censure, irréductible | permanent: le test perdrait son pouvoir'),
      { now: NOW },
    );
    assert.deepEqual(violations, []);
  });
});
