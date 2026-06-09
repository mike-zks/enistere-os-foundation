import assert from "node:assert/strict";
import { test } from "node:test";

// Résolution des paquets (présence dans le graphe) sans les importer/exécuter (aucun appel réseau).
// Les paquets clients sont ESM-only (condition `import` uniquement) : on utilise donc
// `import.meta.resolve` (résolution ESM), pas `require.resolve`. La résolution de TYPES est prouvée
// séparément à la compilation par `api-resolution.fixture.ts`.

test("@enistere/api-contracts résout (paquet présent)", () => {
  assert.ok(import.meta.resolve("@enistere/api-contracts"));
});

test("@enistere/api-client-fetch résout (paquet présent)", () => {
  assert.ok(import.meta.resolve("@enistere/api-client-fetch"));
});

test("@enistere/ui-kit résout (consommé par le socle)", () => {
  assert.ok(import.meta.resolve("@enistere/ui-kit"));
});
