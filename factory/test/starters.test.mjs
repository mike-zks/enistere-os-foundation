import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { loadStarterManifests, STARTER_IDS } from '../engine/starters.mjs';

it('loads six independent starters with a uniform responsibility contract', async () => {
  const manifests = await loadStarterManifests(resolve(import.meta.dirname, '../..'));
  assert.deepEqual(manifests.map((item) => item.id), STARTER_IDS);
  const slots = manifests[0].capabilitySlots;
  for (const manifest of manifests) assert.deepEqual(manifest.capabilitySlots, slots);
  assert.equal(manifests.filter((item) => item.kind === 'api').length, 2);
  assert.equal(manifests.filter((item) => item.kind === 'web').length, 2);
  assert.equal(manifests.filter((item) => item.kind === 'mobile').length, 2);
});
