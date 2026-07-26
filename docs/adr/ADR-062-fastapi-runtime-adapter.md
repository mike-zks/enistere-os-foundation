# ADR-062 — FastAPI comme troisième adapter API de référence

- Statut : accepté
- Date : 2026-07-25
- Décideurs : Enistere OS Foundation
- Complète : ADR-057, ADR-058, ADR-061

## Décision

FastAPI devient le troisième runtime API générable de la Foundation. Son unique
base `starters/fastapi/` implémente `common/2.0.0` et `api/2.0.0` sans capability
métier implicite.

Le runtime est enregistré dans le pipeline canonique existant :

```text
Blueprint → CanonicalSystem → ResolvedSystem → GenerationPlan → Materialization
```

Aucun générateur, modèle de conformité ou chemin CLI parallèle n'est introduit.

## Contrat livré

La base FastAPI fournit :

- configuration typée Pydantic ;
- erreurs HTTP plates canoniques et validation bornée ;
- logs JSON, correlation ID et continuation W3C avec nouveau span ;
- métriques de requêtes et hook OpenTelemetry versionné ;
- audit technique sans payload arbitraire ;
- CORS borné, en-têtes de sécurité et rate limiting ;
- health, liveness, readiness et diagnostics nettoyés ;
- lifespan ASGI et hooks d'arrêt idempotents en ordre inverse ;
- registre versionné et exclusif pour Authentication, Authorization, Files et Events ;
- ports neutres de persistence, migration, transaction et validation ;
- OpenAPI natif, tests comportementaux, Ruff, pytest et compilation ;
- dépendances directes gouvernées et arbre transitif verrouillé.

## Support et limites

Le preset historique `fastapi-base` est `ready` parce que sa composition est
exacte et son golden est exécuté. Les capabilities Auth, RBAC et Files restent
explicitement `unsupported` sur FastAPI : leur absence n'est ni masquée ni
contournée.

FastAPI ne signifie pas « runtime IA ». Un projet dérivé peut ultérieurement
composer des services IA sur FastAPI, mais ce starter ne livre aucun modèle,
provider, RAG ou agent.

Le runtime ne revendique pas :

- de provider de données ou de télémétrie ;
- de capability métier ;
- de topologie distribuée matérialisable ;
- de parité produit avec NestJS ou Spring ;
- de statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY`.

## Preuves

- scan calculé : `28 COMPLIANT / 0 PARTIAL / 0 MISSING` ;
- Ruff, 12 tests pytest et compilation Python ;
- génération du preset `fastapi-base` ;
- installation depuis `requirements.lock` ;
- boot Uvicorn réel et contrat `/health`, `/health/live`, `/health/ready` ;
- corrélation, continuation W3C et sécurité vérifiées sur le processus lancé ;
- audit npm des packages partagés par scope `shared-packages` ;
- lock npm reproductible pour deux matérialisations identiques ;
- suite Factory complète.

## Conséquences

- la phase `API Runtime Convergence` est achevée pour les trois adapters cibles ;
- le registre compte sept runtimes et 27 combinaisons API/Web/Mobile historiques ;
- le prochain ordre de construction est la convergence Common/Web v2 ;
- toute capability FastAPI future devra passer par le framework d'overlays
  versionnés, sans enrichir silencieusement la base.

## Rollback

Retirer FastAPI exige de retirer ensemble son starter, son adapter, son preset,
son golden, ses enums de schéma et son évaluateur. Les projets déjà générés
restent autonomes ; aucune migration de données n'est impliquée.
