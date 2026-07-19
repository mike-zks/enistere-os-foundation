# RBAC — non applicable au starter React Native

Statut déclaré : **`not-applicable`** (et non `planned`).

L'autorisation fine est une préoccupation **serveur** : l'application mobile consomme les décisions
de l'API (401/403) et ne possède aucune surface RBAC propre. Aucun overlay n'est créé ici — un
overlay vide serait une surface factice.

Conséquence pour la Factory : une composition `base + auth + rbac` incluant React Native reste
**générable**. Le mobile reste sur `base + auth` et ne reçoit rien de RBAC. Cette sémantique est
implémentée dans `assessCapabilitySupport` et documentée dans
`factory/engine/OVERLAY_CONTRACT.md`.
