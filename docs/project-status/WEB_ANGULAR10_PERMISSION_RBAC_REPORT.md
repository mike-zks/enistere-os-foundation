# WEB_ANGULAR10_PERMISSION_RBAC_REPORT.md — Web Core Angular 10

**Date** : 2026-07-16  
**Mission** : Web Core Angular 10 — PermissionService + PermissionDirective  
**Statut** : `IMPLEMENTATION_AVANCEE` → **`VALIDE_V1`**

---

## 1. Objectif

Fermer le dernier blocker V1 du Web Core Angular : **B2 — PermissionService + PermissionDirective**
lié au critère `CORE_SPECIFICATION.md` §29.13.

La mission livre un affichage conditionnel RBAC **UX uniquement**. L'API Core reste
l'autorité finale sur toute décision d'autorisation, conformément à ADR-006 et
`strategy/07_SECURITY.md` §6.

---

## 2. Livrables

- `core/permissions/permission.service.ts`
  - `PermissionService` signal-based, in-memory, sans persistance.
  - `hasRole(role)`, `hasAnyRole(roles)`, `hasPermission(permission)`,
    `hasAllPermissions(permissions)`, `hasAnyPermission(permissions)`.
  - Normalisation défensive : trim, lowercase, déduplication, tri stable,
    rejet des wildcards `*`, valeurs vides et caractères invalides.
- `core/permissions/permission.directive.ts`
  - Directive standalone `*enisterePermission`.
  - Entrées supportées : permission simple, liste de permissions,
    objet `{ role, roles, permission, permissions, mode }`.
  - Modes `all` et `any`.
- `AuthService`
  - Purge des permissions sur erreur login, refresh expiré, logout et restore cold-start.
- `DashboardComponent`
  - Preuve runtime minimale : contenu conditionnel visible uniquement avec `files.upload`.

---

## 3. Tests

19 tests ajoutés :

- `permission.service.spec.ts` : 10 tests.
- `permission.directive.spec.ts` : 7 tests.
- `dashboard.component.spec.ts` : 2 tests d'intégration du contenu permissionné.

Résultat global Angular : **267 / 267 ✅**.

---

## 4. Sécurité

- Aucun token, rôle ou permission n'est persisté.
- Pas de wildcard RBAC.
- Pas de décision d'autorisation critique côté Angular.
- La directive masque ou affiche du contenu pour l'ergonomie seulement.
- Toute mutation et tout accès protégé restent à vérifier côté API.

---

## 5. Décision readiness

B2 est fermé. Le Web Core Angular passe à **`VALIDE_V1`** :

- 14 / 15 critères §29 satisfaits.
- 1 / 15 partiel : R1 CDK a11y FocusTrap/LiveAnnouncer, réserve non bloquante.
- 0 blocker V1 restant.

Prochaine action recommandée : ajouter un gate CI `web-angular` dédié dans Quality Core,
ou poursuivre le prochain core prioritaire de la roadmap.
