# QUALITY_CORE_RELEASE_HELPER_REPORT.md — Quality Core release helper

> Date : 2026-07-12
> Statut Quality Core : **IMPLEMENTATION_AVANCEE** (inchangé)
> Périmètre : helper local de préparation release/changelog, sans publication

## Synthèse

Quality Core ajoute un helper local de préparation de notes de release :

```bash
node cores/quality-core/scripts/release-helper.mjs types
node cores/quality-core/scripts/release-helper.mjs draft --type quality-v2-increment --version quality-v2.8 --since foundation-v1.0.0
```

Le script produit un brouillon Markdown sur stdout à partir d'un type de release gouverné et d'une plage
de commits Git. Il ne modifie aucun fichier, ne crée aucun tag, ne crée aucune GitHub Release et ne
pousse rien.

## Livrables

- `cores/quality-core/scripts/release-helper.mjs` ;
- `cores/quality-core/scripts/release-helper.test.mjs`.

## Comportement

| Commande | Rôle |
|---|---|
| `types` | Liste les 5 types du `RELEASE_PROCESS_RUNBOOK.md`. |
| `draft` | Génère un brouillon Markdown : résumé, périmètre, commits, sécurité/gouvernance, gates attendus, gates exclus, limites, prochaine action. |

Types supportés :

- `foundation-v1-baseline` ;
- `core-v1-validation` ;
- `quality-v2-increment` ;
- `staging-candidate` ;
- `hotfix`.

## Sécurité / gouvernance

- Sortie stdout uniquement.
- Aucune écriture de fichier.
- Aucun tag Git.
- Aucun billet GitHub Release.
- Aucun appel réseau.
- Aucun workflow GitHub modifié.
- Aucune dépendance ajoutée.
- Redaction basique des formes sensibles dans les lignes de commits (`token=`, `secret=`, `password=`,
  `Authorization`, Bearer, `x-amz-signature`).
- Les gates sont marqués `À compléter`, jamais comme passés automatiquement.
- Les notes restent un brouillon à relire par un mainteneur.

## Vérifications

| Commande | Résultat |
|---|---|
| `node --test cores/quality-core/scripts/release-helper.test.mjs` | ✅ |
| `node cores/quality-core/scripts/release-helper.mjs types` | ✅ |
| `node cores/quality-core/scripts/release-helper.mjs draft --type quality-v2-increment --version quality-v2.8 --since foundation-v1.0.0 --scope "Quality Core"` | ✅ |

## Hors périmètre

- Pas de génération automatique de `CHANGELOG.md`.
- Pas de création de tag.
- Pas de création de GitHub Release.
- Pas de modification de workflow.
- Pas de publication de package.
- Pas de collecte de couverture.

## Prochaine action recommandée

Quality Core coverage/reporting baseline : cadrer une première sortie locale de synthèse de couverture ou
de statut de tests, sans workflow obligatoire et sans publier d'artefacts.
