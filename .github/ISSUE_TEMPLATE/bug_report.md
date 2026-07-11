---
name: Rapport de bug
about: Signaler une incohérence, une erreur, un problème de structure ou un comportement inattendu
title: "[Bug] "
labels: type:bug
assignees: ""
---

## Description

Décrire le problème observé.

## Environnement

- **Core concerné** : (ex. api-nestjs / web-nextjs / mobile-react-native / ui-kit / quality-core / …)
- **Branche / commit** :
- **Système** : (ex. Linux / macOS / CI GitHub)
- **Versions** : Node / npm / runtime si pertinent

## Reproduction

1.
2.
3.

## Comportement attendu

Décrire le résultat attendu.

## Comportement observé

Décrire le résultat observé.

## Logs / output

> ⚠️ Ne jamais inclure de secret, token, mot de passe, PII ou URL signée dans un log.
> Masquer toute valeur sensible avant de coller.

```
Coller ici les logs pertinents, en masquant tout contenu sensible.
```

## Impact sécurité

- [ ] Ce bug n'a pas d'impact sécurité connu
- [ ] Ce bug expose potentiellement des données sensibles → utiliser le canal privé (Security Advisories)
- [ ] Ce bug contourne une règle d'autorisation (RBAC, CSRF, Origin, session)

## Gate qualité susceptible de détecter ce bug

- [ ] Tests unitaires (`npm test` dans le core concerné)
- [ ] Tests e2e API (`npm run test:e2e` — PostgreSQL + MinIO requis)
- [ ] E2E navigateur Playwright (stack réelle API+PG+MinIO+Web)
- [ ] Smoke Android / iOS (émulateur ou device requis)
- [ ] `npm audit` (vulnérabilité de dépendance)
- [ ] `git diff --check` (whitespace / formatage)
- [ ] Aucun gate ne couvre ce cas actuellement

## Contexte supplémentaire

Ajouter tout contexte utile (ADR concerné, section de `CORE_SPECIFICATION.md`, numéro de PR, etc.).
