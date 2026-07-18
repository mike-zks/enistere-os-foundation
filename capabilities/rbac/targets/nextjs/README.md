# RBAC — payload Next.js parqué (non câblé)

Surface RBAC web (handler `authorization`, route BFF `/api/auth/authorization`,
vue et hook d'autorisation, tests) extraite du starter Next.js lors de la mission
Capability Packs 1A (extraction Auth). Ce payload n'est **pas** un overlay actif :
pas d'`overlay.json`, la capability reste `planned` et `enistere generate` refuse
toujours `rbac`. La mission Capability Packs 1B transformera ce payload en overlay
déclaratif (intégration `nextjs.provider`/route, dépendances).
