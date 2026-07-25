# Platform Baseline Specification

## 1. Statut

Spécification normative adoptée par
[ADR-057](../adr/ADR-057-reference-architecture-and-platform-baseline.md).

Implémentation exécutable adoptée par
[ADR-058](../adr/ADR-058-executable-platform-baseline-v2.md) :
`factory/conformance/contracts/platform-baseline.v2.json`.

## 2. Applicabilité

Tout runtime Enistere DOIT déclarer `baseline.contractVersion` et implémenter le contrat commun plus celui
de sa famille. `Observability` et `Technical Audit` NE DOIVENT PAS être déclarés dans `capabilities`.

```yaml
baseline:
  contractVersion: "2.0"
  familyContract: api/2.0
  observability:
    standard: opentelemetry
  technicalAudit:
    policy: production
```

La version exécutable courante est `2.0.0`, avec `common/2.0.0`, `api/2.0.0`, `web/2.0.0` et
`mobile/2.0.0`.

## 3. Invariants communs

Le runtime DOIT :

1. valider sa configuration avant de servir ;
2. produire des erreurs canoniques sans donnée sensible ;
3. émettre des logs structurés redacted ;
4. accepter ou créer un correlation ID et le propager ;
5. instrumenter requêtes/tâches, erreurs et dépendances en logs, métriques et traces applicables ;
6. exposer des hooks OpenTelemetry sans dépendre d'un backend propriétaire ;
7. émettre les événements d'audit technique applicables ;
8. appliquer les contrôles de sécurité de sa famille ;
9. fournir health/diagnostics adaptés à son mode ;
10. fournir harness et tests du baseline ;
11. exposer les hooks lifecycle et extension points versionnés ;
12. passer les gates de build, qualité, sécurité et provenance.

## 4. Audit

### 4.1 Événement technique

```yaml
auditEvent:
  schemaVersion: "1"
  id: "<uuid>"
  type: platform.permission.changed
  occurredAt: "<rfc3339>"
  actor: { type: user, id: "<stable-id>" }
  workload: core-api
  correlationId: "<id>"
  traceId: "<id>"
  outcome: success
  sensitivity: restricted
  attributes: {}
```

Un événement NE DOIT PAS contenir secret, token, mot de passe, credential, contenu complet non nécessaire
ou stack trace. L'horodatage, l'acteur lorsqu'il est disponible, l'outcome et le contexte DOIVENT être
présents.

### 4.2 Événement métier

Une capability ou un domaine PEUT déclarer un événement métier. Sa déclaration DOIT spécifier schéma,
déclencheur, champs, classification, rétention, accès et criticité. L'émission DOIT passer par le port
d'audit du baseline.

## 5. Contrat API

Une API DOIT en plus fournir :

- serveur et arrêt gracieux ;
- validation d'entrée ;
- `ApiErrorResponse` ou version canonique adoptée ;
- OpenAPI généré et vérifié ;
- liveness/readiness ;
- ports persistence, migration et transaction ;
- rate limiting de base ;
- hooks authn/authz/files/events sans activer ces capabilities ;
- tests HTTP, contrat et intégration.

## 6. Contrat Web

Un Web runtime DOIT en plus fournir routing, client API typé, hooks session/access-control, error
boundaries, forms, états loading/error/empty, accessibilité, security headers, telemetry et fondation E2E.

Un hook sans capability DOIT être neutre ou refuser explicitement ; il NE DOIT PAS simuler une session ou
une permission.

## 7. Contrat Mobile

Un Mobile runtime DOIT en plus fournir navigation, client API, secure storage, hooks session, état réseau,
error handling, permissions, deep links, hooks offline/push, crash reporting et fondation de build.

L'accès à une permission ou au stockage sécurisé DOIT être abstrait, testable et soumis aux politiques de
plateforme.

## 8. Manifest et preuves

```yaml
baseline:
  common:
    status: CONFORMANT
    evidence: [conformance/common.json]
  family:
    id: web
    status: BOOTABLE
    evidence: [goldens/web-nextjs.json]
```

Les statuts DOIVENT être calculés. Une preuve expirée, non reproductible ou ne couvrant pas la version
résolue ne permet pas la promotion.

## 9. Échec et diagnostics

Un invariant absent produit `BASELINE_REQUIRED_INVARIANT_MISSING`. Une capability nommée `audit`,
`technical-audit` ou `observability` produit `BASELINE_CONCERN_MISCLASSIFIED`. Un sink absent en production
produit un refus lorsque la policy l'exige.

## 10. Conformance minimale

La suite commune couvre configuration invalide, erreur/redaction, propagation de correlation, émission de
métriques/traces, audit sensible, health, lifecycle, extension point, build reproductible et gates. Les
suites de famille ajoutent les scénarios spécifiques des sections 5 à 7.
