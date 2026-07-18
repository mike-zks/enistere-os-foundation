# États UI & composants structurels — Web Core (Web UI 1)

> Compositions Web standardisant les **états d'interface** (loading / empty / error / unauthorized /
> forbidden / unavailable / success informationnel) au-dessus des **primitives UI Kit**. Génériques,
> accessibles, réutilisables (Health, Auth, futur Files). **Aucun composant métier.**

## Séparation des responsabilités

| Couche | Rôle | Exemples |
|---|---|---|
| **UI Kit** (`@enistere/ui-kit`) | **primitives visuelles génériques**, sans connaissance HTTP/Auth | `Alert`, `Card`, `FormField`, `Button`, `Text`, `Spinner`… |
| **Web Core** (`src/shared/components/`) | **compositions sémantiques** liées aux états applicatifs | `LoadingState`, `EmptyState`, `ErrorState`, `UnauthorizedState`, `ForbiddenState`, `ServiceUnavailableState`, `PageHeader` |

`UnauthorizedState`/`ForbiddenState`/`ServiceUnavailableState` portent une **sémantique HTTP/Auth** → ils
vivent dans le **Web Core**, jamais dans le UI Kit.

## Matrice des états

| Composant | Sémantique | Rôle ARIA | Action | Données sensibles |
|---|---|---|---|---|
| `LoadingState` | chargement | `status` (poli) | — | aucune |
| `EmptyState` | aucun élément (informationnel) | — (ni alert ni status) | `action?` | aucune |
| `ErrorState` | erreur inattendue | `alert` (via Alert danger) | `onReset?` (retry) | **jamais** (titre/desc génériques + `requestId?`) |
| `UnauthorizedState` | **401** non authentifié | `status` (Alert info) | lien `/login` (ou `action`) | aucune |
| `ForbiddenState` | **403** autorisation insuffisante | `status` (Alert warning) | `action?` | **jamais** (permission **non révélée**) |
| `ServiceUnavailableState` | service indisponible (panne) | `alert` | `retryHref` (lien) / `onRetry` (bouton) | aucune (+ `requestId?`) |
| `PageHeader` | en-tête de page | `h1` par défaut (configurable) | `actions?` | aucune |

### 401 vs 403 vs indisponible (distinction stricte)

- **401 → `UnauthorizedState`** : l'utilisateur n'est **pas authentifié** → propose la **connexion** (`/login`).
- **403 → `ForbiddenState`** : l'utilisateur **est authentifié** mais n'a pas l'autorisation → **aucune
  connexion proposée**, **aucune permission révélée**.
- **indisponible → `ServiceUnavailableState`** : panne temporaire de l'infrastructure → **jamais** assimilée
  à une session anonyme (l'utilisateur n'est pas réputé déconnecté).

## Request id & retry

- Les états d'erreur acceptent un **`requestId`** optionnel, affiché **séparément** du message comme simple
  **référence technique** (jamais une preuve de sécurité, jamais un secret).
- Le **retry** est soit une **action client** (`onReset`/`onRetry` → `Button`), soit un **lien**
  (`retryHref` → `<a>`, server-safe : rechargement → nouvelle résolution serveur).

## Absence de données sensibles

Les états **n'affichent jamais** automatiquement : `stack`, `cause`, réponse brute API, token, cookie,
mot de passe, `API_INTERNAL_URL`. Seuls des messages **publics génériques** + un `requestId` de référence.

## Compact vs pleine page

Chaque état accepte `inline?` : par défaut **plein écran** (centré, `.state`), pour `loading.tsx` /
`error.tsx` / `not-found.tsx` / layout protégé ; `inline` pour l'**intégration** dans une page (panneau
Health, galerie). Aucune animation imposée ; `prefers-reduced-motion` respecté par les primitives.

## PageHeader

`eyebrow?` / `title` / `description?` / `actions?` ; titre **`h1` par défaut** (`as="h2"` configurable pour
préserver la hiérarchie — **un seul `h1` par page**). Actions **responsives** (passent sous le contenu sur
petit écran). Sans breadcrumbs, tabs ni navigation métier.

## Intégrations réelles (Web UI 1)

- **Accueil** (`features/foundation-status`) : `PageHeader` (en-tête unique `h1`) + **galerie technique**
  `StatesShowcase` (Alert × variantes, Card, états en mode `inline`).
- **Health** (`features/health/health-panel`) : `EmptyState` pour l'état « API non configurée ».
- **Frontières d'erreur** : `app/error.tsx` / `(protected)/error.tsx` → `ErrorState` ; `not-found.tsx` →
  `NotFoundState` ; `loading.tsx` → `LoadingState`.
- **Auth** : `features/auth/service-unavailable-view` **délègue** désormais à `ServiceUnavailableState`
  (dé-duplication ; comportement et flux Auth **inchangés**).

## Règles de réutilisation

- Une primitive **générique** (Alert/Card/FormField) ne connaît **ni HTTP ni Auth** → UI Kit.
- Un état **sémantique** (401/403/indisponible) → Web Core.
- Toujours préférer la **composition** explicite ; ne pas dupliquer une vue d'état existante.
- L'**API reste l'autorité finale** : un état d'accès (Unauthorized/Forbidden) est de l'**affichage**, pas
  une protection.
