# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-09). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Revue globale Auth Web (1 → 5)** (`cores/web-nextjs/`) : **revue de socle** (pas une fonctionnalité).
> Auditer le **parcours complet** public → `/login` → privé ; **rejouer les preuves** ; vérifier
> cookies / CSRF / Origin-Referer / navigation / cache TanStack / SSR / hydratation ; **classer les dettes** ;
> décider si le **socle Auth Web peut être déclaré stable V1**. **Ne pas ajouter de nouvelle fonctionnalité.**

**Justification** : **Web Auth 5 est terminé** (commit `feat(web-nextjs): add secure login experience`). Le
parcours Auth Web est désormais **complet de bout en bout** : `/login` (formulaire, login BFF, `returnTo`
interne assaini, navigation `replace`/`refresh`), layout protégé (résolution serveur read-only + hydratation),
session/autorisations, BFF login/refresh/logout/csrf — **263 tests** + **preuves API réelles** (Auth 26/26 +
login 22/22 ; **aucun open redirect**, **aucune fuite de token/mot de passe**). Avant d'ouvrir de nouvelles
capacités (écrans authentifiés, thème, Files Web…), une **revue transversale** s'impose pour arbitrer la
**stabilité V1** du socle Auth et la dette restante (E2E navigateur, CI, CSP…).

**Pré-recommandation (non bloquante, reportée)** : amorcer une **CI minimale** (ADR-013) imposant l'**ordre de
build des paquets** (`packages/*/dist` non versionnés) et la non-régression.

**Alternative (justifiée)** : **compléter le UI Kit**, démarrer le **Mobile Core**, ou avancer **Cloud/CI-CD**.
À arbitrer par décision humaine.

**Note gouvernance** : `main` est poussé sur `origin` (SSH). Cette mission ajoute le commit
`feat(web-nextjs): add secure login experience`.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Revue globale Auth Web (1 → 5)** — audit du parcours public→login→privé, rejeu des preuves, classement des dettes, décision de stabilité V1 ; **sans nouvelle fonctionnalité**. ✦ prochaine action.
2. **CI minimale (ADR-013)** — imposer l'ordre de build des paquets + non-régression (recommandée).
3. **UI Kit (suite)** — composants supplémentaires (FormField, Alert, Card, états UI) ; pas de bibliothèque exhaustive d'un coup.
4. **Mobile Core React Native minimal** — starter Expo/RN ; intégration `api-client-fetch` ; secure storage (ADR-015) ; tokens via ThemeProvider (ADR-010).
5. **Cloud Core minimal** — CI/CD (ADR-013) + registry (ADR-014) + conteneurisation.

**Alternative envisageable (justifiée)** : avancer **Cloud Core / CI-CD (ADR-013)** plus tôt pour
sécuriser la non-régression (aucune CI aujourd'hui) et préparer la publication des packages. Reste
**non recommandé en premier** car il n'apporte pas de valeur produit immédiate et le UI Kit débloque
deux cores. À arbitrer par décision humaine.

## 3. Actions bloquées

| Action | Bloquée par |
|---|---|
| Intégrer les packages API (public) dans le Web Core | **FAIT** — `api-client-fetch` instancié (Health), preuve API réelle |
| Usage **authentifié** des packages (Web) | **FAIT** — login/refresh/logout + CSRF (Web Auth 2) **et** me/authorization + session/autorisations (Web Auth 3), preuve API réelle |
| Premier layout/route protégé (Web) | **FAIT** — Web Auth 4 : résolution serveur read-only (Option C) + hydratation, page `/protected` |
| Page de connexion `/login` + navigation Auth (Web) | **FAIT** — Web Auth 5 : formulaire, login BFF, `returnTo` interne assaini, `replace`/`refresh`, preuve API réelle 22/22 |
| Middleware Auth « autoritaire » (Web) | **rejeté (checkpoint)** — un middleware ne valide pas un token / ne connaît pas la révocation ; UX léger (présence de cookie) seulement |
| Intégrer les packages dans le Mobile | starter Mobile inexistant |
| Publier les packages | décision registry/CI (ADR-013/014) non implémentée |
| Mobile Core Flutter | spécification absente + **ADR-034 non rédigé** |
| Web Core Angular | spécification absente + **ADR-035 non rédigé** |
| AI / Docs / Quality Cores | spécifications absentes |
| API Core Spring Boot | spécification absente |

## 4. Prérequis

- Commit Git de référence (gouvernance) — **avant tout**.
- Pour UI Kit : aucun prérequis technique manquant (ADR-008/009/010 Validés).
- Pour Web/Mobile : UI Kit initialisé + packages disponibles (déjà le cas).

## 5. Critères d'entrée (avant de démarrer la prochaine action)

1. Avoir lu `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, ce fichier.
2. Avoir vérifié le repository réel (ne rien supposer absent de la matrice).
3. Avoir signalé toute divergence entre les docs de statut et le repository.
4. Disposer d'une mission **explicite** ciblant **un seul** core.

## 6. Critères de sortie (fin de la prochaine action)

1. Core ciblé exécutable (build + lint + typecheck + tests verts) **et** revu.
2. Aucune régression du API Core, du UI Kit ni des packages.
3. `docs/project-status/` mis à jour (matrice, état, décisions si l'implémentation change, prochaines actions, handoff).
4. `CHANGELOG.md` mis à jour.
5. État Git propre / commit effectué.

## 7. Interdits pour la prochaine mission

- Initialiser **plus d'un** core à la fois.
- Modifier le API Core ou les packages sans mission explicite dédiée.
- Modifier des ADR ou des `CORE_SPECIFICATION.md` sans décision.
- Ajouter des dépendances non couvertes par un ADR validé.
- Déclarer un core « validé » sans tests + revue.
- Supprimer une preuve sans vérifier qu'elle est remplacée.
