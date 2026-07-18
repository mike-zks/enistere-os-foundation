# Factory Quality

Outillage transversal de qualité de la Project Factory.

```bash
node factory/quality/scripts/quality-gates.mjs list
node factory/quality/scripts/quality-gates.mjs plan all-safe
node factory/quality/scripts/quality-gates.mjs run docs
node --test factory/quality/scripts/*.test.mjs
```

Les tests Cloud/staging, appareils mobiles, Playwright avec stack réelle et Testcontainers restent des
gates d'environnement et ne sont pas masqués dans `all-safe`.

Voir `QUALITY_SPECIFICATION.md` et `QUALITY_GATES_MATRIX.md`.
