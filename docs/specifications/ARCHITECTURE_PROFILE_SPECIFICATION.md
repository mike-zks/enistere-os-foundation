# Architecture Profile Specification

## 1. Objet normatif

Cette spécification définit comment un profil architectural est déclaré, validé, recommandé et résolu.
Les mots **DOIT**, **NE DOIT PAS**, **DEVRAIT** et **PEUT** sont normatifs.

## 2. Identifiants

Les valeurs autorisées de `spec.architecture.profile` sont :

```text
api | monolith | multi-client | modular-distributed | microservices
```

`evolutionTarget` PEUT nommer un autre profil. Il exprime une intention, jamais une génération simultanée.

## 3. Forme

```yaml
architecture:
  profile: multi-client
  evolutionTarget: modular-distributed
  rationale:
    drivers: [multiple-channels, shared-domain-authority]
    rejected: [microservices]
```

Le normalizer DOIT produire une seule représentation canonique, qu'un profil soit saisi directement ou
issu d'une recommandation.

## 4. Contraintes

| Profil | APIs | Clients gérés | Données | Communications |
|---|---:|---:|---|---|
| `api` | 1 | 0 | owner API explicite | sync ; async optionnel |
| `monolith` | 1 | 1..n | ownership logique par module | in-process/interne |
| `multi-client` | 1 | 2..n | owner API | contrats clients → API |
| `modular-distributed` | 2..n | 0..n | owner exclusif par domaine | sync/async explicites |
| `microservices` | 2..n | 0..n | datastore par service owner | sync/async gouvernés |

Des workers ne comptent pas comme API mais DOIVENT avoir un owner, un runtime/adapter et un contrat de
lifecycle.

## 5. Validation commune

Tout profil DOIT :

- référencer des applications uniques ;
- identifier les owners des données persistantes ;
- résoudre chaque communication vers deux endpoints existants ;
- définir protocole, mode, contrat, timeout et politique d'identité ;
- appliquer le Platform Baseline à chaque runtime ;
- associer chaque deployment unit à un environnement et une stratégie ;
- produire des diagnostics structurés pour toute target ou adapter absent.

## 6. Validations distribuées

`modular-distributed` et `microservices` DOIVENT en plus :

- interdire l'accès direct au datastore d'un autre owner ;
- exiger compatibilité et version pour chaque contrat ;
- définir timeouts et budgets de retry ;
- définir idempotence pour les mutations rejouables ;
- définir propagation du contexte et tracing distribué ;
- associer une stratégie de panne à chaque dépendance ;
- décrire migration, ordre de déploiement et rollback ;
- exiger un owner opérationnel et des SLI/SLO par unité.

`microservices` DOIT également fournir une justification organisationnelle et un modèle de dépréciation
des contrats. L'absence de ces preuves produit un refus, pas un simple avertissement.

## 7. Recommandation

`enistere architecture recommend` DOIT :

1. collecter les drivers et contraintes ;
2. évaluer le profil le plus simple qui les satisfait ;
3. expliquer le choix, les alternatives et les refus ;
4. afficher le statut de support séparément ;
5. demander confirmation avant de produire un blueprint.

L'IA PEUT proposer ; le resolver déterministe valide.

## 8. Support

Le registry déclare séparément :

```yaml
status:
  architecture: TARGET
  representation: IMPLEMENTED
  generation: PLANNED
  evidence: []
```

Un profil représentable NE DOIT PAS être présenté comme `GENERATABLE`. Les statuts sont ceux du
[Conformance Model](CONFORMANCE_MODEL.md).

## 9. Conformité

Les preuves minimales sont : schema/normalization tests, graph validation, plan déterministe, golden de
topologie, boot des unités, contract tests, security gates, observability/audit assertions et scénario de
défaillance adapté.
