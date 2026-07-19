# RBAC — overlay Next.js (actif)

Overlay déclaratif livré par Capability Packs 1B. Voir [`../../README.md`](../../README.md) pour le
contrat de la capability et [`overlay.json`](overlay.json) pour les opérations déclarées.

Surface : BFF `GET /api/auth/authorization`, client same-origin (primitive `bffGet` d'Auth), clé de
cache dérivée de `authKeys.all` (purgée au logout), hook `useAuthorization`, vue et panneau d'état.
L'affichage est conditionnel uniquement : **l'API reste l'autorité**.
