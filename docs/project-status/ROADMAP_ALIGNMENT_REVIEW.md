# ROADMAP_ALIGNMENT_REVIEW.md — Revue stratégique d'alignement (post Cloud Core 9)

> **Revue stratégique** (2026-06-11, `main` = `5589198`). **Aucune fonctionnalité ajoutée, aucun code modifié.**
> Objet : vérifier si l'effort réel reste aligné sur l'objectif originel et la roadmap globale après la longue
> séquence **Cloud Core 1 → 9** (+ finalisations B/C), et décider **une** prochaine priorité.

## 1. Objectif originel (rappel sourcé)

`strategy/01_VISION_FINAL.md` : Enistere OS Foundation est un **socle de production logiciel réutilisable**
servant de base aux projets **mobiles, web, backend, cloud, IA…**, pour « passer d'une idée à une base
exploitable en production ». La vision inclut **explicitement** une « chaîne CI/CD exploitable » **et** une
« infrastructure cloud standardisée » → **le travail Cloud/CI n'est PAS hors-sujet**.

`strategy/04_ROADMAP_GLOBAL.md` impose toutefois un **ordre** :
- **Cores prioritaires V1** (§7.2) : **1. API NestJS · 2. Mobile RN · 3. Web Next · 4. Cloud minimal · 5. UI Kit**.
- **Cloud Core minimal V1** (§11) = **infra locale** (Docker/Compose/**Traefik/PostgreSQL/Redis/MinIO**, volumes,
  `.env.example`, scripts setup ; `docker-compose.base/local/prod.yml`).
- **CI/CD = V2** (§5, §13.2 « GitHub Actions ») ; **Registry + déploiement = V3/VF** (« Cloud Core avancé/complet »).
- **Ordre recommandé** (§30) : API(5) → **Cloud minimal(6)** → **Mobile(7)** → Web(8) → UI Kit(9) → Quality/Docs(V2)…

**Conclusion de cadrage** : la roadmap plaçait **Mobile Core RN avant Web** et **avant** toute CI/CD avancée ou
registry/staging.

## 2. État réel des cores (vérifié)

| Core | Statut | Preuves | Dernière avancée | Valeur obtenue | Dette principale | Prochaine action logique | Priorité |
|---|---|---|---|---|---|---|---|
| **API Core NestJS** | `IMPLEMENTATION_AVANCEE` | 377 u + 101 e2e, 3 revues, image runtime **corrigée & bootable** | CC8 (fix image) | **V1 backend complet** (auth/RBAC/files/health/OpenAPI) | Redis/queues/mail (V2+) | hardening/review (optionnel) | basse (stable) |
| `@enistere/api-contracts` | `AVANCEE` (local) | 11 tests, generate:check | — | contrat typé canonique | publication | publier (non requis V1) | basse |
| `@enistere/api-client-fetch` | `AVANCEE` (local) | 29 + live 16/16 | intégré Web | client typé réutilisable | publication | publier (non requis V1) | basse |
| **UI Kit** | `IMPLEMENTATION_PARTIELLE` | 9 primitives Web, 78 tests 100 % | Web UI 1 | tokens + primitives **consommés par Web** | primitives interactives ; **ThemeProvider RN absent** ; Tailwind/shadcn absents | UI Kit 4 (Dialog/Select/Toast) | **moyenne** |
| **Web Core Next.js** | `IMPLEMENTATION_PARTIELLE` | 307 tests ×2, runtime 49/49 | Files 1 | Health + **Auth BFF** + UI + Files lecture | upload Web (Files 2) ; CSP/HSTS | Files 2 (optionnel) | moyenne-basse |
| **Cloud Core** | `IMPLEMENTATION_PARTIELLE` | 4 workflows CI + GHCR + staging local exécuté | CC9 (exécution locale) | **CI non-régression, images bootables, runbooks, api-smoke** | **serveur réel/HTTPS/déploiement (CC10)** ; **compose local V1 Traefik/Redis NON livré** | **PAUSE contrôlée** ; CC10 quand serveur réel dispo | **EN PAUSE** |
| **Mobile Core React Native** | `SPECIFICATION_DOCUMENTAIRE` | spec (1013 l), **ZÉRO code** | aucune | **aucune** (gap V1 #2) | **tout le starter** | **Mobile Core RN 1 — starter** | **HAUTE (prioritaire)** |
| Mobile Core Flutter | `DOSSIER_SEULEMENT` | — | — | — | spec + ADR-034 | V3 | très basse |
| API Core Spring Boot | `DOSSIER_SEULEMENT` | — | — | — | spec | V3 | très basse |
| Web Core Angular | `DOSSIER_SEULEMENT` | — | — | — | spec + ADR-035 | V3 | très basse |
| Quality Core | `DOSSIER_SEULEMENT` | — | — | — | spec | V2 | basse |
| Docs Core | `DOSSIER_SEULEMENT` | — | — | — | spec | V2 | basse |
| AI Core | `DOSSIER_SEULEMENT` | — | — | — | spec | VF | très basse |

## 3. Bilan de la séquence Cloud Core (1 → 9)

| Critère | Évaluation |
|---|---|
| **Nécessité** | **Partielle mais réelle** : la non-régression CI (CC1–4) et des **images qui démarrent** (CC8) étaient nécessaires — le dry-run CC7 a **découvert un défaut bloquant réel** (image API non bootable) qu'aucun test « depuis les sources » ne voyait. |
| **Valeur** | **Élevée** sur CC1–8 : 4 workflows CI (non-régression, runtime API, E2E navigateur, registry), **protection de branche**, **images GHCR bootables**, **`api-smoke`** (gate du push), runbooks déploiement/rollback, stratégie migrations tranchée. |
| **Complexité** | Croissante : CC5→CC9 entrent dans le **registry + staging** (territoire V3/VF), avec ~13 sous-missions (CC1–9 + 5B/6B/7B/8B/8C). |
| **Risque réduit** | régression silencieuse, **image non-déployable publiée**, secrets en Git, déploiement non documenté/non reproductible. |
| **Risque ajouté** | **coût d'opportunité** : Mobile Core (V1 #2) **non démarré** ; « Cloud minimal V1 » (compose local Traefik/Redis) **non livré** au profit de CI/GHCR/staging. |
| **Maturité obtenue** | CI/CD **réelle** (V2 atteint), registry **partiel** (V3/VF entamé), staging **local validé** ; **déploiement serveur réel = non atteint** (et bloqué sur infra externe). |
| **Point d'arrêt raisonnable** | **OUI, maintenant.** Après CC9, la suite (**CC10 serveur réel**) dépend de **ressources externes** (serveur, HTTPS, DNS, pare-feu) **indisponibles** et relève de l'**ops par déploiement**, pas du **socle réutilisable**. |

## 4. Dérives / honnêteté

1. **Sur-investissement séquentiel Cloud** : ~13 sous-missions Cloud d'affilée ont mené **jusqu'à V3/VF**
   (registry, staging) **avant** d'avoir touché **Mobile Core RN (V1 priorité #2)** — inversion de l'ordre
   roadmap (§30 : Mobile=7 avant Web=8 ; et avant CI/CD V2).
2. **« Cloud Core minimal V1 » au sens roadmap non livré** : pas de `docker-compose.base/local.yml` avec
   **Traefik/Redis** ni scripts setup (la cible §11). Le Cloud réel a livré **autre chose** (CI + GHCR + staging),
   utile mais **décalé** de la définition V1.
3. **Mobile Core = angle mort total** : top-3 V1, **dépendances satisfaites** (API + packages + tokens UI Kit
   RN-safe — cf. §29) — mais **zéro ligne de code**. C'est **le** retard le plus net vs la roadmap.

> **Ce qui n'est PAS une dérive** : le travail Cloud n'est pas « gaspillé ». La vision le réclame, et il a
> **réellement** sécurisé la suite (images bootables, non-régression). Le problème est **l'ordre et la durée**,
> pas la nature.

## 5. Réponses explicites (questions §5 de la mission)

1. **Objectif originel ?** Socle de production réutilisable multi-cores (mobile/web/api/cloud/IA) pour démarrer
   vite des produits **prêts production**, cohérents et sécurisés.
2. **Cores prioritaires ?** V1 : **API · Mobile RN · Web · Cloud minimal · UI Kit**.
3. **Cores ayant réellement avancé ?** **API** (avancé), **Web** (partiel substantiel), **UI Kit** (partiel),
   **Cloud** (partiel, sur-investi), **packages** (avancés locaux).
4. **Cloud trop loin ou juste assez ?** **Juste assez jusqu'à CC8** (CI + image bootable) ; **CC6–9 staging =
   utile mais à la limite** ; **CC10 = trop tôt** (ops/infra externe).
5. **Risques réduits par CI/CD ?** régression, image cassée publiée, secrets en Git, déploiement non documenté.
6. **Risques ouverts ?** Mobile non démarré ; pas de serveur staging réel/HTTPS ; URL signée + Auth/Files staging
   non validés en réel ; UI Kit incomplet ; aucun **projet pilote** (roadmap §33) testant l'intégration.
7. **Cores en retard ?** **Mobile Core RN** (le plus), puis UI Kit (interactives), Quality/Docs (V2).
8. **Continuer Cloud 10 maintenant ?** **Non** — dépend d'un serveur réel indisponible ; rendements décroissants
   pour un *socle*.
9. **Revenir vers quel core ?** **Mobile Core RN** (V1 #2, dépendances prêtes) — devant UI Kit/Web/API.
10. **Prochaine action la plus alignée ?** **Mobile Core React Native 1 — starter foundation.**

## 6. Décision (UNE seule)

### ✅ Option B — **Cloud Core en PAUSE CONTRÔLÉE**, puis **retour Mobile Core RN**

- **Cloud Core** : **pause** après CI/GHCR/staging-local (CC1–9). **Reprise = Cloud Core 10** (serveur staging
  sécurisé) **uniquement quand** un serveur réel + HTTPS/DNS/pare-feu sont disponibles. État gelé **propre** :
  images bootables publiées, `api-smoke` en place, runbooks à jour.
- **Prochaine action unique** : **Mobile Core React Native 1 — starter foundation** (mission suivante) — démarrer
  le starter Expo/RN (navigation auth/privé, secure storage ADR-015, `api-client-fetch`, TanStack Query, tokens
  UI Kit via ThemeProvider ADR-010), **sans** logique métier, **un seul core**.

**Justification** : aligne l'exécution sur la roadmap (§7.2/§30 : Mobile est V1 #2, dépendances **satisfaites**),
résorbe **le** retard le plus net, et évite de pousser Cloud dans une zone **ops/externe** prématurée. Le socle
gagne sa **première brique mobile** — condition d'un futur **projet pilote** (Kivvoo/RFashion, §34).

## 7. Prochaine action unique

```
Mobile Core React Native 1 — starter foundation
```

(Cloud Core 10 — préparation serveur staging sécurisé : **reporté**, repris quand un serveur réel est disponible.)

## 8. Handoff nouvelle conversation

Voir `docs/project-status/SESSION_HANDOFF.md` (bloc mis à jour) : rôle, objectif, état des cores, derniers
commits, statuts, **décision roadmap (pause Cloud → Mobile RN 1)**, prochaine action unique, interdits, risques.
