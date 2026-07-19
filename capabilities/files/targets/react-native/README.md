# Files — payload React Native parqué (non câblé)

Code Files RN (upload seam, écran de diagnostics upload, test) extrait du starter
React Native lors de la mission Capability Packs 1A (extraction Auth). Ce payload
n'est **pas** un overlay actif : pas d'`overlay.json`, la capability reste
`planned` sur toutes les targets et `enistere generate` refuse toujours `files`.

Une mission dédiée transformera ce payload en overlay déclaratif (dépendances,
route `(app)/upload`, intégration `expo.provider` si nécessaire).
