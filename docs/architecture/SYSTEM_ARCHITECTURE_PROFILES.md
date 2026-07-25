# Profils d'architecture système

## Règles communes

Un profil est un preset de décisions et de contraintes, jamais un second modèle interne. Il se normalise
dans le même `CanonicalSystem`. Le choix doit être expliqué par les exigences, la structure des équipes,
les contraintes de données et les objectifs de disponibilité — pas par la mode.

Tous les profils appliquent le Platform Baseline, l'ownership explicite, des contrats versionnés, la
sécurité par défaut, la corrélation, l'audit technique et des preuves de conformité.

## 1. `api`

**Finalité.** Fournir une autorité backend ou une API spécialisée sans imposer de client.

**Cas d'usage.** API partenaire, backend headless, service IA, intégration, façade sur système existant.

| Dimension | Règle |
|---|---|
| Topologie | une application API ; primitives attachées ; workers facultatifs |
| API / clients | une API ; zéro client géré |
| Déploiement | une unité API, unités de primitives distinctes |
| Données | API owner de ses données ; aucun accès externe direct |
| Communications | HTTP synchrone par défaut ; messages si besoin démontré |
| Sécurité | authentification selon exposition, authorization aux frontières, rate limit, secrets |
| Observabilité/audit | baseline complet, audit des accès et opérations sensibles |
| Résilience | timeouts, graceful shutdown, idempotence aux frontières mutables |
| Infrastructure | DB optionnelle, cache/storage/queue selon capabilities |

**Sélectionner si** l'API est le produit ou si les clients sont hors scope. **Refuser si** le produit exige
une expérience client générée ou plusieurs domaines autonomes. **Évolution :** ajouter des clients et passer
à `multi-client`, ou intégrer l'API comme unité d'un profil distribué.

## 2. `monolith`

**Finalité.** Maximiser la vitesse et la cohérence transactionnelle avec une frontière de déploiement
principale et des modules métier explicites.

**Cas d'usage.** Nouveau SaaS, back-office, produit transactionnel, équipe petite ou moyenne.

| Dimension | Règle |
|---|---|
| Topologie | API modulaire centrale + un ou plusieurs clients ; workers co-déployés ou séparés |
| API / clients | une API ; 1..n clients |
| Déploiement | backend principal, clients déployables indépendamment si nécessaire |
| Données | schéma/DB partagés possibles, ownership par module obligatoire |
| Communications | appels en processus entre modules ; événements internes explicites |
| Sécurité | politique centrale, frontières modules, séparation admin/public |
| Observabilité/audit | contexte de module dans logs/traces/audit |
| Résilience | transactions locales ; isolation des intégrations externes |
| Infrastructure | PostgreSQL typique ; Redis/MinIO/etc. seulement si requis |

**Sélectionner si** une unité métier et une cadence coordonnée dominent. **Refuser si** des domaines exigent
déjà autonomie de release, isolation réglementaire ou profils de scalabilité incompatibles. **Évolution :**
extraire un module via contrats, outbox et ownership vers `modular-distributed`.

## 3. `multi-client`

**Finalité.** Servir plusieurs expériences cohérentes depuis une autorité métier commune.

**Cas d'usage.** Portail client + administration + applications mobiles.

| Dimension | Règle |
|---|---|
| Topologie | une API principale ; plusieurs Web/Mobile |
| API / clients | une API ; 2..n clients |
| Déploiement | chaque client et l'API peuvent être livrés séparément |
| Données | API seule owner des données serveur ; stockage local client borné |
| Communications | clients → API via contrats générés ; push/realtime optionnels |
| Sécurité | sessions adaptées à chaque canal, permissions cohérentes, CORS/CSRF/deep links |
| Observabilité/audit | correlation propagée par client et API ; télémétrie client consentie |
| Résilience | offline/degradation mobile selon besoin ; compatibilité contractuelle |
| Infrastructure | primitives de l'API + mail/push éventuels |

**Sélectionner si** plusieurs canaux partagent règles et données. **Refuser si** les clients ont des backends
et domaines réellement autonomes ou si une seule surface suffit. **Évolution :** BFF ciblés ou extraction
de domaines vers `modular-distributed`, sans dupliquer l'autorité métier.

## 4. `modular-distributed`

**Finalité.** Distribuer seulement les domaines qui bénéficient d'une autonomie de scalabilité, de sécurité,
de données ou de release, tout en conservant une architecture gouvernable.

**Cas d'usage.** Plateforme avec core transactionnel, service documentaire, automatisation et IA à cycles
distincts.

| Dimension | Règle |
|---|---|
| Topologie | 2..n applications API/worker, gateway/BFF facultatif, plusieurs clients |
| API / clients | plusieurs APIs ; clients via gateway ou contrats de services autorisés |
| Déploiement | unités indépendantes, versions compatibles et orchestration de migration |
| Données | ownership exclusif par domaine ; aucun accès cross-database |
| Communications | HTTP/gRPC pour requête ; broker pour événements ; contrats versionnés |
| Sécurité | identité workload, authorization interservice, secrets par unité |
| Observabilité/audit | traces distribuées obligatoires ; audit corrélé et ownership des sinks |
| Résilience | timeouts, retries bornés, circuit breakers, idempotence, outbox/DLQ selon flux |
| Infrastructure | DBs par owner possibles, broker, telemetry backend, secrets |

**Sélectionner si** au moins une frontière distribuée possède une justification et un owner opérationnel.
**Refuser si** l'équipe ne peut pas opérer plusieurs unités, si les transactions synchrones globales restent
nécessaires ou si les frontières sont spéculatives. **Évolution :** extraction/integration incrémentale ;
un module peut être réintégré si le coût distribué dépasse le bénéfice.

## 5. `microservices`

**Finalité.** Soutenir une autonomie forte de domaines et d'équipes avec isolation du déploiement, des
données et de la capacité.

**Cas d'usage.** Organisation multi-équipes mature, exigences réglementaires distinctes, charge très
hétérogène, disponibilité indépendante.

| Dimension | Règle |
|---|---|
| Topologie | services nombreux et bornés, gateways, workers, clients, control plane |
| API / clients | plusieurs APIs internes/externes ; BFF possibles |
| Déploiement | service indépendamment versionné, déployé et rollbackable |
| Données | datastore par service/owner ; réplication seulement par contrats/événements |
| Communications | contrats sync et async ; compatibilité et dépréciation gouvernées |
| Sécurité | zero-trust pragmatique, identité workload, policy enforcement, segmentation |
| Observabilité/audit | traces bout en bout, SLO par service, audit inviolable et corrélé |
| Résilience | bulkheads, backpressure, DLQ, outbox, chaos ciblé, budgets d'erreur |
| Infrastructure | broker, secrets, telemetry, registry, orchestration selon contexte |

**Sélectionner si** les preuves organisationnelles et non fonctionnelles justifient le coût. **Refuser si**
une équipe unique opère le système, si les frontières/SLI sont inconnues, ou si le monolithe répond aux
contraintes. **Évolution :** extraire depuis `modular-distributed`; fusionner les services trop fins.

## Comparaison de sélection

| Question | api | monolith | multi-client | modular-distributed | microservices |
|---|---:|---:|---:|---:|---:|
| Client généré requis | non | oui | plusieurs | plusieurs | plusieurs |
| Autonomie de déploiement backend | faible | faible | faible | ciblée | forte |
| Ownership de datastore isolé | API | par module logique | API | par domaine distribué | par service |
| Transactions multi-domaines simples | oui | oui | oui | non, orchestration | non, orchestration |
| Maturité opérationnelle requise | faible | faible | moyenne | élevée | très élevée |

## Invariants d'évolution

- aucune extraction sans contrat, owner, SLO, migration et rollback ;
- aucun service ne lit le datastore d'un autre ;
- les clients ne deviennent pas autorités métier ;
- les événements sont versionnés et observables ;
- la distribution n'abaisse jamais le baseline ;
- le profil cible et le support réel sont reportés séparément.
