# QUALITY_CORE_COVERAGE_STANDARDIZATION_DECISION.md

> Date : 2026-07-12
> Mission : Quality Core coverage standardization decision
> Périmètre : reporting coverage local, sans workflow obligatoire ni artefact publié.

## 1. Objectif

Décider si les scopes sans coverage standardisée doivent recevoir une commande coverage locale, ou si le
baseline coverage reste informatif pour le moment.

## 2. Vérification repository

Scripts coverage détectés :

| Scope | Script | Statut |
|---|---|---|
| `@enistere/ui-kit` | `npm run test:coverage --workspace=@enistere/ui-kit` | disponible |
| `@enistere/web-nextjs` | `npm run test:coverage --workspace=@enistere/web-nextjs` | disponible |
| `cores/api-nestjs` | `cd cores/api-nestjs && npm run test:cov` | disponible |

Correction effectuée : `quality-report.mjs` ne listait pas encore le script `test:coverage` existant du
UI Kit. Le baseline passe donc de **2/8** à **3/8** scopes avec coverage locale disponible.

## 3. Scopes sans coverage standardisée

| Scope | Décision | Raison |
|---|---|---|
| `@enistere/api-contracts` | ne pas ajouter maintenant | package types/génération OpenAPI ; couverture runtime peu significative |
| `@enistere/api-client-fetch` | différer | couverture utile à terme, mais nécessite une politique cohérente avec les tests réseau/mocks |
| `cores/mobile-react-native` | différer | tests Node agnostiques + composants RN typecheck-only ; coverage partielle serait trompeuse |
| `cores/quality-core` | différer | scripts Node purs, pas de package npm dédié ; tests ciblés suffisants actuellement |
| `cores/docs-core` | différer | link-check documentaire ; coverage de script peu utile comme indicateur qualité |

## 4. Décision

Décision : **STANDARDISATION_PARTIELLE_EXISTANTE, PAS_DE_NOUVELLE_COMMANDE**.

Les commandes coverage existantes pour API, Web et UI Kit sont reconnues officiellement par le reporting.
Les autres scopes restent sans coverage standardisée pour le moment.

Règles retenues :

- ne pas créer une commande coverage quand le signal serait artificiel ;
- ne pas publier de pourcentage global tant que les outils et périmètres restent hétérogènes ;
- ne pas ajouter de dépendance coverage ;
- ne pas modifier les workflows CI ;
- garder `quality-report.mjs` comme synthèse locale informative.

## 5. Hors périmètre confirmé

- Aucun workflow GitHub modifié.
- Aucune dépendance ajoutée.
- Aucun seuil coverage obligatoire.
- Aucun artefact coverage publié.
- Aucun dashboard ou badge ajouté.
- Aucun runtime applicatif modifié.
- Aucun test Cloud/staging.

## 6. Prochaine action recommandée

Quality Core V1 Readiness Review : vérifier si Quality Core peut passer de `IMPLEMENTATION_AVANCEE` à
`VALIDE_V1`, ou si les dashboards qualité / couverture publiée restent des gaps bloquants pour V1.
