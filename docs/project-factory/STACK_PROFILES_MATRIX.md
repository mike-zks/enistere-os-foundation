# Matrice des profils

La Factory accepte 18 combinaisons structurelles : deux APIs, zéro ou un Web, zéro ou un Mobile.

| Dimension | Choix |
|---|---|
| API obligatoire | NestJS, Spring Boot |
| Web optionnel | Next.js, Angular |
| Mobile optionnel | React Native, Flutter |

## Verticales de référence

| Verticale | Contrat client | État composition V2 |
|---|---|---|
| NestJS + Next.js + React Native | OpenAPI TypeScript + client Fetch | Capability Packs 1 |
| Spring + Angular + Flutter | OpenAPI HTTP/Dio | Capability Packs 2 planifié |

Les combinaisons croisées restent autorisées structurellement, mais une génération modulaire n'est
possible que si chaque capability demandée est `ready` pour chaque starter sélectionné. `enistere plan`
doit afficher les blockers ; `generate` doit les refuser.

Les profils API-only, API+Web, API+Mobile et API+Web+Mobile sont légitimes. La qualité d'un profil est
prouvée par un golden runtime, pas par cette matrice documentaire.
