# ADR-063 — Convergence Common/Web v2 et source unique des starters

- Statut : accepté
- Date : 2026-07-26
- Décideurs : Enistere OS Foundation
- Complète : ADR-050, ADR-051, ADR-054, ADR-058

## Décision

Next.js et Angular deviennent les deux adapters Web conformes aux contrats
`common/2.0.0` et `web/2.0.0`.

Chaque starter est désormais matérialisé directement dans
`starters/<runtime>`. Les dossiers `base/` et la propriété
`composition.baseSource` sont interdits pour les sept runtimes. Une fitness
function empêche leur réintroduction.

Les bases Web restent neutres. Authentication, Authorization, Files et toute
autre fonction optionnelle doivent être composées par des capabilities ; elles
ne peuvent pas être embarquées dans un starter pour obtenir artificiellement
une parité produit.

## Contrat livré

Les deux runtimes fournissent idiomatiquement :

- configuration validée et erreurs canoniques ;
- logs structurés avec masquage ;
- corrélation, continuation W3C et nouveau span ;
- métriques, traces et exporteur de télémétrie versionné ;
- audit technique distinct de l’audit métier ;
- diagnostics assainis et déterministes ;
- lifecycle idempotent avec arrêt en ordre inverse ;
- extensions de session et de contrôle d’accès versionnées et exclusives ;
- routing, client API typé, fondation de formulaires et états UI ;
- error boundaries, accessibilité et en-têtes de sécurité ;
- gates de test, build et E2E.

Next.js conserve son App Router et le client Fetch généré. Angular conserve
Router, `HttpClient`, Reactive Forms et Angular CDK. La conformité exige une
équivalence de contrat, pas l’identité des bibliothèques.

## Migration de composition

Les contenus normatifs de `starters/angular/base/` et
`starters/flutter/base/` sont promus à leur racine. Les anciennes applications
dédoublées et les flux Auth/RBAC/Files embarqués sont supprimés.

L’aplatissement Flutter est une correction du modèle de composition, pas une
déclaration de conformité Mobile V2. Son rapport reste volontairement en écart.

Le resolver utilise exclusivement `starters/<runtime>` et ne reconnaît plus
`baseSource`.

## Preuves

- rapport calculé :
  - Next.js : `24 COMPLIANT / 0 PARTIAL / 0 MISSING` ;
  - Angular : `24 COMPLIANT / 0 PARTIAL / 0 MISSING` ;
- tests comportementaux des invariants Common/Web ;
- Next.js : typecheck, lint, tests, build et E2E des en-têtes de sécurité ;
- Angular : 108 tests, build production et contrat E2E sur processus démarré ;
- goldens `nestjs-next-base` et `nestjs-angular-base` avec génération,
  installation, démarrage Web, audit gouverné et lock reproductible ;
- analyse, test, format et build APK Flutter verts après aplatissement ;
- fitness function refusant `base/` et `composition.baseSource`.

## Conséquences

- cinq adapters sur sept sont conformes au Platform Baseline V2 ;
- les bases API et Web utilisent toutes une source unique ;
- les deux runtimes Mobile sont la prochaine frontière de convergence ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` n’est revendiqué ;
- aucune capability ou topologie supplémentaire n’est livrée par cette décision.

## Risques

- une preuve structurelle pourrait surévaluer une simple présence de fichier ;
  les invariants sensibles exigent donc des tests comportementaux et les
  goldens démarrent réellement les applications Web ;
- l’extraction des anciennes surfaces Flutter réduit temporairement ses tests ;
  le rapport Mobile rend cette dette visible au lieu de la masquer ;
- les politiques d’en-têtes Angular restent dépendantes de l’adapter de
  déploiement ; le golden vérifie la politique distribuée avec le runtime.

## Rollback

Le rollback restaure le code précédent depuis Git. Réintroduire un dossier
`base/` ou `baseSource` est exclu : un autre modèle de composition nécessiterait
un nouvel ADR, une migration atomique du resolver et de nouvelles preuves.
