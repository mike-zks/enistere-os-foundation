# Packages Distribution 1 — Decision de distribution des packages officiels

> Date : 2026-07-17.
> Portee : `packages/api-contracts`, `packages/api-client-fetch`, documentation de gouvernance.
> Statut : **DECISION_DOCUMENTEE**, aucune publication effectuee.

## 1. Verdict

La distribution cible des packages TypeScript officiels Enistere est :

1. **Cible principale** : **GitHub Packages npm registry** pour le scope `@enistere/*`.
2. **Repli gouverne** : artefacts de **GitHub Release** (`npm pack` tarballs) si le registry npm prive
   n'est pas encore disponible pour une release donnee.
3. **Non retenu par defaut** : publication publique `npmjs.com`.
4. **Interdit** : dependance a une URL Swagger/OpenAPI de production pour consommer les contrats.

Cette mission ne publie rien. Elle tranche seulement la strategie de distribution, conformement a
ADR-016 §13.8 : package npm prive versionne ou artefact de release, jamais Swagger production.

## 2. Documents lus

- `strategy/04_ROADMAP_GLOBAL.md` — V2 : industrialisation, versioning, scripts, release.
- `docs/adr/ADR-016-openapi-typed-client-generation.md` — OpenAPI + clients types.
- `docs/project-status/DECISIONS_REGISTER.md` — ADR-016 partiellement implemente, publication restante.
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` — packages valides localement, non publies.
- `docs/project-status/IMPLEMENTATION_MATRIX.md` — packages en `IMPLEMENTATION_AVANCEE (local)`.
- `packages/api-contracts/package.json` / `README.md`.
- `packages/api-client-fetch/package.json` / `README.md`.

## 3. Etat courant verifie

| Package | Version | Etat actuel | Publication |
|---|---:|---|---|
| `@enistere/api-contracts` | `0.1.0` | types OpenAPI canoniques, build/test locaux, consomme par Web/Mobile | non publie, `private: true` |
| `@enistere/api-client-fetch` | `0.1.0` | client Fetch type, wrappers auth/files/upload, integre Web/Mobile | non publie, `private: true` |

Les deux packages ont deja des exports propres (`dist`, `README.md`), des commandes de build/test et
un perimetre compatible distribution. L'absence de publication reste le dernier ecart ADR-016 sur la
partie TypeScript ; les integrations Web et Mobile React Native sont deja faites.

## 4. Options et decision

| Option | Verdict | Raison |
|---|---|---|
| GitHub Packages npm prive | **retenu** | aligne avec GitHub, PR/CI/releases, scope prive `@enistere/*`, acces controle |
| GitHub Release tarballs | **retenu en repli** | utile sans registry configure, artefact immuable associe a une release |
| npmjs public | rejete par defaut | expose des packages Foundation encore pre-1.0 sans decision produit/licence publique |
| file/workspace uniquement | rejete comme etat final | suffisant en monorepo, insuffisant pour projets derives et releases versionnees |

## 5. Regles de publication futures

Une mission de publication future devra respecter ces regles :

- ne jamais ajouter de token ou secret au depot ;
- garder `openapi.json` versionne comme source canonique, pas une URL de production ;
- publier d'abord `@enistere/api-contracts`, puis `@enistere/api-client-fetch` ;
- verifier `generate:check`, typecheck, build, tests et `npm pack --dry-run` pour chaque package ;
- figer explicitement la relation de version entre les deux packages avant le premier publish ;
- produire un rapport de release indiquant versions, commits, checks et artefacts ;
- garder `npm publish` manuel ou workflow `workflow_dispatch` avec environnement protege, jamais automatique
  sur simple merge tant qu'une release policy package n'est pas validee.

## 6. Ce qui n'est pas fait

- aucun `npm publish` ;
- aucun `publishConfig` ajoute ;
- aucun passage `private:false` ;
- aucun token, `.npmrc`, secret GitHub ou workflow ;
- aucun changement de code runtime ou de contrat OpenAPI ;
- aucun changement de version package.

## 7. Impact gouvernance

ADR-016 reste **PARTIELLEMENT_IMPLEMENTE** : la strategie de distribution est maintenant decidee, mais
la publication effective et le gate `pack/publish dry-run` restent a livrer.

Les packages restent **`IMPLEMENTATION_AVANCEE (local)`** jusqu'a une mission technique qui prepare
les manifests et prouve les artefacts distribuables.

## 8. Prochaine mission unique recommandee

**Packages Distribution 2 — preparation publish-ready sans publication**.

Objectif : rendre les deux packages techniquement prets a distribuer sans les publier : metadata
package, `publishConfig` GitHub Packages, relation SemVer explicite, `npm pack --dry-run` verifie,
rapport d'artefacts, documentation d'installation depuis GitHub Packages ou release tarballs.

Interdits : `npm publish`, secrets, workflow automatique, changement de contrat ou de code runtime.
