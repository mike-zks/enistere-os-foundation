# RELEASE_PLAN.md

> Projet derive : `<project-name>`.
> Statut : `DRAFT`.
> Date : `<YYYY-MM-DD>`.

## 1. Objectif release

| Champ | Valeur |
|---|---|
| Release cible | `<v0.1.0/v1.0.0/...>` |
| Type | `<prototype/staging/v1/hotfix>` |
| Profil stack | `<stack-profile>` |
| Foundation ref | `<commit-or-tag>` |

## 2. Périmètre release

### Inclus

- `<élément inclus>`

### Exclus

- `<élément exclu>`

## 3. Gates pré-release

| Gate | Statut attendu | Commande / preuve |
|---|---|---|
| Documentation | `PASS` | `<commande>` |
| API | `<PASS/N/A>` | `<commande>` |
| Web | `<PASS/N/A>` | `<commande>` |
| Mobile | `<PASS/N/A>` | `<commande>` |
| E2E/smoke | `<PASS/N/A>` | `<preuve>` |
| Audit sécurité | `PASS` | `<commande/preuve>` |

## 4. Environnements

| Environnement | Requis | Validation |
|---|---:|---|
| Local | oui | `<preuve>` |
| Staging | `<oui/non>` | `<preuve>` |
| Production | `<oui/non>` | `<preuve>` |

## 5. Migration et données

- Migrations DB :
- Données seed :
- Backup requis :
- Restore testé :

## 6. Rollback

| Scenario | Action rollback | Responsable |
|---|---|---|
| `<scenario>` | `<action>` | `<role>` |

## 7. Versioning

- Version :
- Tag :
- Changelog :
- Notes de release :
- Artefacts :

## 8. Acceptation

- [ ] functional brief validé ;
- [ ] technical blueprint validé ;
- [ ] stack decision validée ;
- [ ] security notes validées ;
- [ ] gates verts ;
- [ ] rollback documenté ;
- [ ] release notes prêtes ;
- [ ] décision humaine de release.

