# ADR-069 — Conformité produit de la capability RBAC et évaluateur générique

- Statut : Validé et implémenté
- Date : 2026-07-28
- Décideur : Owner Foundation
- Complète : ADR-048, ADR-055, ADR-067 et ADR-068

## Contexte

ADR-068 a rendu la conformité produit d’**une** capability mesurable. L’outillage
était volontairement écrit pour Authentication : chemin du contrat, identité
`authentication-product`, `capability must be auth` et identifiants d’invariants
`AUTH-*` étaient codés en dur en sept endroits.

RBAC est le deuxième cas réel, `files` est visible comme troisième. Deux voies
étaient possibles : dupliquer l’évaluateur par capability — donc un pipeline
parallèle interdit par le mandat §8.1 — ou le généraliser maintenant, sur un cas
concret plutôt que par anticipation.

RBAC pose en outre une question qu’Authentication n’avait pas posée : sa target
React Native est `not-applicable`. L’autorisation fine est une préoccupation
serveur ; le mobile consomme les décisions de l’API et ne possède aucune surface
RBAC. Cette absence est légitime et ne doit ni compter comme conformité, ni
comme écart.

## Décision

### 1. Un évaluateur unique, paramétré par capability

`factory/conformance/capability-product.mjs` devient agnostique. Les contrats
produit sont **découverts par convention** —
`capabilities/<id>/contracts/<nom>.product.v<major>.json` — sans liste centrale :
déposer un contrat suffit à être mesuré. La validation devient structurelle
(identité `<nom>-product`, version semver, `capability` égal au répertoire
propriétaire, identifiants d’invariants `<CAP>-<RÔLE>-<NNN>`).

Le pilote `capability-report.mjs` remplace `authentication-report.mjs` et évalue
toutes les capabilities, ou celles passées en argument. Le script npm
`factory:auth-conformance` devient `factory:capability-conformance`.

Le chemin de rapport reste dérivé, jamais déclaré :
`authentication-product` → `reports/authentication-v1.json` (inchangé),
`authorization-product` → `reports/authorization-v1.json`.

### 2. `not-applicable` est une absence, pas une conformité

Une target sans surface légitime conserve son statut (`NOT_APPLICABLE`), sans
rôle, sans invariant, sans preuve, et reste exclue du verdict. Un test le
verrouille explicitement pour React Native : le jour où quelqu’un requalifierait
la target en `ready` sans preuve, la mesure le refuserait.

### 3. Contrat produit Authorization

`capabilities/rbac/contracts/authorization.product.v1.json` déclare deux rôles et
neuf invariants : six pour l’autorité de décision (état serveur courant, refus
générique, 401 avant 403, deny-by-default, audit du refus, résumé effectif) et
trois pour le client (rendu conditionnel uniquement, requête liée à une session
authentifiée et non mise en cache, aucune fuite).

### 4. Un refus redevient un refus (défaut corrigé)

La mesure a révélé un défaut latent et sérieux : sur Spring, **tout refus
d’autorisation renvoyait `500 INTERNAL_ERROR` au lieu de `403`**.

`@PreAuthorize` lève `AccessDeniedException` **à l’intérieur** du dispatcher, où
le `@ExceptionHandler(Exception.class)` du `GlobalExceptionHandler` la classait
en erreur interne avant que la chaîne de sécurité ne la voie. La suite existante
ne pouvait pas le détecter : elle invoquait la méthode protégée directement,
jamais via HTTP.

Correction : `SecurityExceptionHandler`, advice prioritaire de l’overlay Auth,
traduit `AccessDeniedException` en `403 AUTH_FORBIDDEN` canonique et audite le
refus.

Spring refuse en deux endroits distincts — règles évaluées avant dispatch
(`accessDeniedHandler` de la chaîne) et method security (advice). Ce sont **deux
points d’entrée pour une seule politique** : tous deux partagent
`SecurityErrorCodes` et `SecurityAuditEvents`. Ce n’est pas un pipeline
parallèle, c’est la reconnaissance d’une réalité du framework.

### 5. Convergence RBAC de Spring

| Invariant | Divergence constatée | Correction |
|---|---|---|
| `RBAC-AUTHORITY-002` | refus = `500 INTERNAL_ERROR` ; sinon `errorCode: "FORBIDDEN"` | `403` + `AUTH_FORBIDDEN`, sans nommer le droit manquant |
| `RBAC-AUTHORITY-005` | **aucun** événement d’audit RBAC | `AUTHORIZATION_DENIED` émis et testé |
| `RBAC-AUTHORITY-001` | reflet immédiat non prouvé sur HTTP | test : même token, droit accordé → accès immédiat |

### 6. Propriété du chemin de refus

Le 403 est produit par la chaîne de sécurité, qui appartient à l’overlay **Auth**,
alors que c’est un invariant **RBAC**. Plutôt que d’introduire une surcharge RBAC
du handler — deux handlers pour une même réponse selon la composition — la
réponse de refus reste définie là où elle est produite. Une preuve RBAC peut donc
désigner un fichier d’un autre overlay via `owner`, ce qui rend l’emprunt
explicite au lieu de le laisser passer silencieusement.

## Conséquences

### Acquis

- RBAC est `CONFORMANT` sur ses trois targets `ready` ; Authentication le reste,
  mesurée par le même évaluateur.
- Un refus d’autorisation Spring est de nouveau un `403` et non un `500`.
- Tout refus est auditable sur les deux autorités.
- Ajouter une capability au périmètre de mesure ne demande plus de code moteur.

### Rupture de contrat assumée

Le code d’erreur 403 de Spring passe de `FORBIDDEN` à `AUTH_FORBIDDEN`, et un
appel refusé qui répondait `500` répond désormais `403`. Le second changement
corrige un défaut : aucun client correct ne pouvait dépendre d’un `500`.

### Non revendiqué

- `files` n’a pas encore de contrat produit neutre.
- La granularité d’audit diffère : NestJS distingue rôle et permission refusés,
  Spring émet un événement unique. L’invariant porte sur la garantie observable
  — tout refus est audité — pas sur la granularité.
- Aucun statut `PRODUCT_EQUIVALENT` ni `PRODUCTION_READY`.

## Alternatives écartées

- **Un évaluateur par capability.** Pipeline parallèle, divergence garantie.
- **Un registre central des capabilities mesurées.** Deuxième source de vérité à
  côté des manifests ; la découverte par convention l’évite.
- **Laisser le refus en `500` et adapter le contrat.** Aurait transformé un
  défaut en norme.
- **Surcharge RBAC du handler de refus.** Deux réponses possibles pour un même
  événement selon la composition installée.

## Migration

Le script `factory:auth-conformance` n’existe plus ; utiliser
`factory:capability-conformance`. Les applications Spring générées avant cet ADR
répondent `500` sur refus : la mise à jour se fait par régénération, le lifecycle
in-place n’existant pas.

## Tests

```bash
npm run factory:capability-conformance   # 2/2 capabilities CONFORMANT
npm run factory:test                     # 447 tests
npm run factory:baseline-gap             # 7 runtimes inchangés
```

Preuves d’exécution réelle (PostgreSQL via Testcontainers) :

- Spring `auth + rbac` : 64/64, dont le refus HTTP `403 AUTH_FORBIDDEN`, son
  audit et la prise d’effet immédiate d’un droit ;
- Spring `auth` seul : 54/54 — la chaîne de sécurité modifiée ne régresse pas ;
- Spring `auth + rbac + files` : 98/98.

## Rollback

Révoquer le commit : évaluateur générique, contrat Authorization, descripteurs et
correction du refus forment une unité. Le refus Spring redeviendrait un `500`.
