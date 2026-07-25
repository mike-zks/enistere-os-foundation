# Audit — Architecture cible vs implémentation actuelle

- Date : 2026-07-24
- Branche auditée : `feat/api-base-audit-ratelimit-contract`
- Commit de départ : `3da14a2b6e48f077f7f6340bd9828a3c37957dee`
- Nature : audit documentaire et architectural ; aucune promotion de statut

## Méthode

La cible a d'abord été définie dans l'ADR-057 et les spécifications associées. Le dépôt a ensuite été
inspecté : Factory, schémas, CLI, modèles, conformance, starters/manifests, capabilities, packages,
deployment, exemples, tests, CI et documents canoniques.

Classification :

- `KEEP` : conforme et réutilisable ;
- `ADAPT` : bon actif, extension bornée ;
- `REFACTOR` : structure/contrat à reconstruire sans tout jeter ;
- `REPLACE` : mécanisme incompatible à substituer ;
- `REMOVE` : actif ou classification à supprimer ;
- `CREATE` : manque net.

## Résumé

Le pipeline canonique, les modèles internes initiaux, les goldens, les six runtimes et les overlays sont de
bons actifs. La cible complète n'est toutefois pas représentable par le schéma actuel, les contrats de
baseline restent minimaux et majoritairement vérifiés par structure, FastAPI/primitives distribuées/
lifecycle/contrats polyglottes manquent. Les profils actuels sont des combinaisons de starters, pas encore
les cinq profils architecturaux normatifs.

## Matrice des actifs

| Actif actuel | Classe | Cible / action | État constaté |
|---|---|---|---|
| pipeline Blueprint→CSM→Resolved→Plan→Generation | KEEP | prolonger vers MaterializedSystem/Report | implémenté et testé |
| `factory/model/canonical-system.mjs` | ADAPT | modèle V2 complet | applications/policies partiels |
| `factory/model/resolved-system.mjs` | ADAPT | graph/primitives/contracts/support complet | pipeline utilisé |
| `factory/model/generation-plan.mjs` | ADAPT | opérations, risques, approvals, support | digests déjà présents |
| blueprint schema v1 | REPLACE | schéma V2 + migration frontière | styles/champs historiques |
| profiles/topologies engine | REFACTOR | cinq profils comme presets du CSM | 26 profils stack, 21 générables |
| CLI `doctor/init/profiles/profile/plan/generate/verify` | ADAPT | CLI système cible | parcours partiel |
| lock/provenance/digests | ADAPT | registry resolution et lifecycle | fondations présentes |
| conformance engine | ADAPT | remplacer progressivement probes critiques par comportements | baseline v2 exécutable depuis ADR-058 |
| fitness functions FF6–FF8 | KEEP | préserver pipeline unique | preuves présentes |
| six starters existants | ADAPT | runtime adapters conformes | boot/goldens partiels |
| NestJS base | ADAPT | baseline complet OTEL/audit/diagnostics | meilleur actif API actuel |
| Spring base source unique | ADAPT | baseline complet | audit/rate limit récemment convergés |
| Angular/Flutter double `base/` | REFACTOR | source unique | dette documentée |
| React Native sur-rempli | REFACTOR | extraire features optionnelles | nombreuses features en base |
| FastAPI runtime | CREATE | adapter API après contrat stable | absent |
| capabilities auth/rbac/files | ADAPT | manifests vNext, audit métier, parité targets | overlays réels mais partiels |
| `capabilities/base` | REMOVE | baseline n'est pas une capability | **retiré par ADR-058** |
| planned capability Audit | REMOVE | Technical Audit dans baseline | classification retirée des manifests pendant la mission |
| planned capability Observability | REMOVE | Observability dans baseline | classification retirée des manifests pendant la mission |
| User Management/Events/etc. | CREATE | catalogue ordonné après framework | absents |
| PostgreSQL integration | ADAPT | primitive typée/providers/modes | présent dans APIs/goldens |
| MinIO integration | ADAPT | `object-storage` | présent via Files/deployment |
| Alfresco | CREATE | `content-repository` | absent |
| Redis | CREATE/ADAPT | `cache` typé | usages ponctuels à recenser |
| RabbitMQ | CREATE | queue/broker | absent |
| telemetry backend adapters | CREATE | primitive OpenTelemetry-compatible | absence de stack qualifiée |
| packages TypeScript contracts/client | ADAPT | dérivés de source neutre | TS aujourd'hui central |
| Java/Python/Dart bindings | CREATE | génération polyglotte | absents |
| deployment Compose/runbooks | ADAPT | packs par profil et primitives | actifs staging utiles |
| lifecycle manager | CREATE | inspect/diff/upgrade/migrate | spécification seulement |
| Factory AI local adapter/approval | ADAPT | orchestration/policies/evals | prototype utile |
| derived-system AI runtime | CREATE | services FastAPI gouvernés | absent |
| exemples blueprints actuels | ADAPT | migrer vers V2 et goldens | syntaxe/support actuels |
| documents V2 existants | ADAPT | aligner ADR-057 | plusieurs classifications obsolètes |
| anciennes roadmaps actives | REPLACE | roadmap maître unique | séquence trop courte |

## Profils

| Profil cible | Représentation actuelle | Génération actuelle | Décision |
|---|---|---|---|
| `api` | approximation par profil starter | plusieurs APIs bootables séparément | ADAPT |
| `monolith` | `modular-monolith` partiel | compositions API+client | REFACTOR |
| `multi-client` | partiel | certains profils multi-surface | ADAPT |
| `modular-distributed` | non complet | non | CREATE |
| `microservices` | valeur réservée/refusée | non | CREATE après lifecycle |

## Runtimes et baseline

| Runtime | Actif | Limite face à la cible | Classe |
|---|---|---|---|
| NestJS | starter + overlays + goldens | OTEL complet, audit contract/policies, diagnostics à compléter | ADAPT |
| Spring | starter source unique + overlays | même écart baseline ; image/deployment à qualifier | ADAPT |
| FastAPI | aucun | runtime entier absent | CREATE |
| Next.js | starter + E2E | baseline complet/audit technique Web à formaliser | ADAPT |
| Angular | starter + base dupliquée | source unique, contracts/a11y/capabilities | REFACTOR |
| React Native | starter riche | séparer baseline et features optionnelles | REFACTOR |
| Flutter | starter + base dupliquée | source unique, capabilities, builds réels | REFACTOR |

La conformité antérieure « 6 runtimes en parité de contrat de base » se rapporte au contrat minimal v1.
Le baseline v2 est désormais exécutable (ADR-058) et prouve qu'aucun runtime n'est encore conforme.

## Contradictions documentaires corrigées

- Audit et Observability retirés du catalogue canonique des capabilities ;
- `base` requalifié en baseline, non capability ;
- cinq profils et sept runtimes deviennent la cible ;
- MinIO et Alfresco sont distingués ;
- la roadmap courte V2 est remplacée comme autorité par la roadmap maître ;
- les statuts incluent `TARGET` et `PLANNED` avant les niveaux de preuve ;
- l'IA Factory est séparée de l'IA dérivée.

Les ADR historiques gardent leur texte comme historique. L'ADR-057 indique précisément ce qu'il supersède.
Les entrées `plannedCapabilities` contradictoires ont été retirées des manifests : ce nettoyage de
classification ne revendique aucune amélioration d'implémentation.

## Risques prioritaires

1. **P0 — convergence runtime v2 :** contrat exécutable, mais aucun runtime conforme.
2. **P0 — blueprint/CSM partiels :** profils et primitives cibles non représentables dans le moteur.
3. **P1 — bases Web/Mobile divergentes :** duplication et sur-remplissage.
4. **P1 — contrats centrés TypeScript :** équivalence Java/Python/Dart non prouvable.
5. **P2 — primitives/lifecycle distribués absents :** aucune génération distribuée crédible.

## Conclusion et action unique

Les actifs du kernel et des runtimes justifient une convergence plutôt qu'une réécriture totale.
ADR-059 a supprimé les invariants `MISSING` des deux APIs, mais huit statuts restent `PARTIAL`.

> **Prochaine mission unique : achever la convergence NestJS/Spring Common/API v2, supprimer les huit
> statuts partiels et produire les preuves de boot/contrat HTTP — sans ajouter FastAPI ni capability.**
