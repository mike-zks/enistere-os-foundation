# Registre des décisions

## Décisions actives

| ADR | Décision | Application V2 |
|---|---|---|
| 001 | Monorepo hybride | Foundation monorepo, projets dérivés autonomes |
| 002 | Architecture modulaire | starters + overlays + packages |
| 003 | Validation backend autoritaire | conservée dans chaque API |
| 004–007 | Auth BFF, cookies, RBAC, fichiers | contraintes des capability packs |
| 008–010 | tokens/UI Web et Mobile | package UI Kit et thèmes starters |
| 011–012 | client Fetch et server-state | packages et adapters clients |
| 013–016 | erreurs, registry, stockage mobile, OpenAPI | contrats transverses |
| 034 | Flutter Material 3 contrôlé par tokens | starter Flutter |
| 035 | Angular Material contrôlé par tokens | starter Angular |
| 039 | Argon2id | APIs |
| 040 | redaction/observabilité | Factory et starters |
| 041 | Maven pour Spring | starter Spring |
| 042 | Project Factory AI-native | architecture active |

## Règles

- Un ADR validé est une décision, pas une preuve d'implémentation.
- Une capability est disponible target par target.
- Les sujets du backlog restent non applicables tant qu'aucun besoin réel ne les déclenche.
- Toute incompatibilité avec ADR-042 exige un nouvel ADR ou son remplacement explicite.

Voir `docs/adr/ADR_BACKLOG.md` pour les décisions non rédigées.
