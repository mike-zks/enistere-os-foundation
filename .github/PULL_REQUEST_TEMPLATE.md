# Pull Request

## Résumé

Décrire brièvement le changement.

## Core concerné

- [ ] api-nestjs
- [ ] api-spring
- [ ] mobile-react-native
- [ ] mobile-flutter
- [ ] web-nextjs
- [ ] web-angular
- [ ] cloud
- [ ] ui-kit
- [ ] ai-core
- [ ] docs-core
- [ ] quality-core
- [ ] repo/global

## Type de changement

- [ ] Feature
- [ ] Fix
- [ ] Documentation
- [ ] Refactor
- [ ] Test
- [ ] Security
- [ ] CI/CD
- [ ] Breaking change

## Quality gates

> Référence : [`docs/checklists/PR_QUALITY_CHECKLIST.md`](../docs/checklists/PR_QUALITY_CHECKLIST.md)
> Script : `node cores/quality-core/scripts/quality-gates.mjs plan <scope>`

### Scope applicable

- [ ] `docs` — docs-only (`git diff --check`)
- [ ] `packages` — api-contracts + api-client-fetch
- [ ] `ui-kit` — typecheck / lint / test / build / tokens:check
- [ ] `web` — typecheck / lint / test / build
- [ ] `mobile-static` — typecheck / lint / test / doctor
- [ ] `root-audit` — `npm audit`
- [ ] `all-safe` — packages + ui-kit + web + root-audit (recommandé pré-PR)
- [ ] autre / runtime — décrire dans "Commandes exécutées"

### Commandes exécutées

```
# Indiquer les commandes réellement exécutées et leurs résultats
# Exemple :
# node cores/quality-core/scripts/quality-gates.mjs run all-safe  → 17/17 ✓
# git diff --check                                                  → 0 whitespace error
# npm audit                                                         → 0 vulnérabilité
```

### Gates non exécutés

| Gate | Raison de l'exclusion |
|---|---|
| (exemple : expo export -p ios) | (machine Linux — bloqué RN31) |

## Hors périmètre confirmé

- [ ] Aucun workflow GitHub modifié (`.github/workflows/*.yml` intacts)
- [ ] Aucune dépendance ajoutée sans justification
- [ ] Aucun secret, token, URL signée dans le diff

## Sécurité

- [ ] Aucun secret ajouté (env, credentials, clé privée, token)
- [ ] Pas de logs sensibles (PII, tokens, URL signées, mots de passe)
- [ ] Dépendances justifiées si ajoutées (`npm audit` 0 vuln)
- [ ] Impact sécurité vérifié (auth, CSRF, Origin, RBAC si applicable)

## Statut / gouvernance

> Remplir uniquement si cette PR modifie `docs/project-status/` ou change le statut d'un core.

- [ ] `IMPLEMENTATION_MATRIX.md` mis à jour avec preuve
- [ ] `FOUNDATION_CURRENT_STATE.md` mis à jour
- [ ] `NEXT_ACTIONS.md` mis à jour
- [ ] `SESSION_HANDOFF.md` mis à jour
- [ ] Rapport de revue versionné dans `docs/project-status/` si promotion de statut

## Documentation

- [ ] README mis à jour si nécessaire
- [ ] CHANGELOG mis à jour si nécessaire
- [ ] ADR ajouté si nécessaire
- [ ] Documentation du core mise à jour si nécessaire

## Risques

Décrire les risques, limites ou migrations nécessaires.

## Checklist finale

- [ ] Périmètre respecté
- [ ] Gates minimaux verts (locaux)
- [ ] Documentation claire
- [ ] Revue humaine prévue
