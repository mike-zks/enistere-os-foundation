---
name: Sujet sécurité
about: Signaler un risque, une faiblesse ou une question de sécurité (sans donnée sensible)
title: "[Security] "
labels: type:security
assignees: ""
---

> ⚠️ **IMPORTANT — Ne jamais inclure de secret dans cette issue.**
> Si la vulnérabilité est sensible (credentials, token, clé privée, données personnelles exposées,
> contournement d'authentification), **ne pas la décrire ici**.
> Utiliser GitHub Security Advisories (onglet "Security" → "Report a vulnerability") pour un
> signalement confidentiel.

## Résumé

Décrire le sujet de sécurité sans exposer de secret, valeur, clé ou donnée personnelle.

## Classification de l'impact

- [ ] **Faible** — documentation, pratique à améliorer, risque théorique
- [ ] **Moyen** — fuite d'information non critique, contournement partiel
- [ ] **Élevé** — exposition de données sensibles, contournement d'autorisation → envisager le canal privé
- [ ] **Critique** — secret exposé, élévation de privilège, exécution de code → **utiliser le canal privé**

## Périmètre concerné

Scopes sensibles de ce monorepo :

- [ ] Auth / sessions / JWT / refresh tokens
- [ ] CSRF / Origin / Referer validation (BFF Web)
- [ ] URL signées MinIO (ne jamais loguer ni mettre en cache)
- [ ] PII (données personnelles utilisateurs)
- [ ] Secrets / clés / variables d'environnement
- [ ] Accès staging / SSH / infrastructure (`cores/cloud/`)
- [ ] RBAC / permissions / rôles (api-nestjs)
- [ ] Dépendances npm (`npm audit`)
- [ ] Templates, scripts, CI (exposition involontaire)
- [ ] Autre :

## Reproduction (sans secret)

Décrire les étapes permettant d'observer le problème, sans inclure de valeur sensible.

1.
2.

## Impact potentiel

Préciser les risques possibles sans exposer de donnée réelle.

## Recommandation

Décrire la correction ou la décision attendue.

## Contexte supplémentaire

ADR concerné, section de spécification, core affecté, etc.
