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
| 042 | Project Factory AI-native | **supersédé par 044** ; sortie de `cores/` et gouvernance des agents acquises |
| 043 | Versioning et migration des artefacts | politique active, complète le lifecycle V2 |
| 044 | Refondation d'architecture V2 | architecture cible active |
| 045–056 | pipeline canonique et convergence des contrats initiaux | actifs conservés, périmètres incompatibles supersédés par 057 |
| 057 | Architecture de référence complète et Platform Baseline | cible active ; Audit/Observability obligatoires, sept runtimes ; taxonomie supersédée par 060 |
| 058 | Platform Baseline v2 exécutable | contrat JSON unique, rapports v2, `base` retiré des capabilities |
| 059 | Convergence Common/API v2 NestJS et Spring | lifecycle, extensions, sécurité et observabilité testés ; aucun invariant API `MISSING` |
| 060 | Profils système et dimensions d’architecture | quatre profils canoniques ; anciens noms limités aux entrées ; presets distincts |
| 061 | Conformité Common/API v2 NestJS et Spring | 28/0/0 chacun ; ports neutres, diagnostics et quality gates testés ; boot/HTTP exigé sur les goldens API |

## Règles

- Un ADR validé est une décision, pas une preuve d'implémentation.
- Une capability est disponible target par target.
- Observability et Technical Audit ne sont pas des capabilities.
- Les sujets du backlog restent non applicables tant qu'aucun besoin réel ne les déclenche.
- Toute incompatibilité avec ADR-042 exige un nouvel ADR ou son remplacement explicite.

Voir `docs/adr/ADR_BACKLOG.md` pour les décisions non rédigées.
