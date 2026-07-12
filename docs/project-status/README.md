# docs/project-status/ — Checkpoint documentaire officiel

> **Source de vérité de pilotage** d'Enistere OS Foundation. Reflète l'**état réel du repository**
> (vérifié fichier par fichier), pas l'historique de conversation. Dernière mise à jour : 2026-07-12.
>
> Index documentaire central : [`../README.md`](../README.md).

## Rôle de chaque fichier

| Fichier | Rôle |
|---|---|
| [`SESSION_HANDOFF.md`](./SESSION_HANDOFF.md) | **Transfert de session** compact (2–5 pages) : à lire en premier pour démarrer une mission / une conversation. Contient le bloc de démarrage à copier. |
| [`FOUNDATION_CURRENT_STATE.md`](./FOUNDATION_CURRENT_STATE.md) | **Photographie générale** : statut global, principes de vérité, cores, packages, ADR, tests, preuves, risques, incohérences. |
| [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md) | **Matrice** par core/package/module : dossier, spéc, ADR, starter, code, tests, revue, statut officiel + matrice détaillée API Core + contradictions + dette. |
| [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md) | **Lecture rapide des ADR** : statut ADR vs **statut d'implémentation** (ne remplace pas les ADR). |
| [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md) | **Prochaine action unique**, suites, actions bloquées, prérequis, critères d'entrée/sortie, interdits. |
| [`GIT_BASELINE_REPORT.md`](./GIT_BASELINE_REPORT.md) | **Preuve historique de la baseline Git** (commit `7dcb543`, exclusions, validations, audit secrets). L'état Git courant est dans `FOUNDATION_CURRENT_STATE.md` / `IMPLEMENTATION_MATRIX.md`. |
| `README.md` | Ce fichier : rôles, ordre de lecture, protocoles, responsabilités. |

## Ordre de lecture

1. `SESSION_HANDOFF.md` → 2. `FOUNDATION_CURRENT_STATE.md` → 3. `IMPLEMENTATION_MATRIX.md` →
4. `NEXT_ACTIONS.md` → 5. `DECISIONS_REGISTER.md`. Puis, pour le API Core, les rapports natifs sous
`cores/api-nestjs/docs/`.

## Protocole de DÉBUT de mission (obligatoire)

```
1. Lire docs/project-status/SESSION_HANDOFF.md
2. Lire FOUNDATION_CURRENT_STATE.md
3. Lire IMPLEMENTATION_MATRIX.md
4. Lire NEXT_ACTIONS.md
5. Vérifier le repository réel (find/ls/git status)
6. Signaler les divergences entre les docs et le repository
7. Exécuter UNIQUEMENT la prochaine action autorisée
```

## Protocole de FIN de mission (obligatoire)

```
1. Exécuter les validations (build/lint/test/e2e selon le périmètre)
2. Mettre à jour IMPLEMENTATION_MATRIX.md
3. Mettre à jour FOUNDATION_CURRENT_STATE.md
4. Mettre à jour DECISIONS_REGISTER.md si une implémentation a changé
5. Mettre à jour NEXT_ACTIONS.md
6. Mettre à jour SESSION_HANDOFF.md
7. Mettre à jour CHANGELOG.md
```

## Règles de mise à jour

- Toute affirmation doit être **vérifiable** dans le repository (fichiers/tests/scripts).
- Statuts cohérents **entre tous les fichiers** (même statut, même prochaine action, mêmes chemins).
- Ne jamais marquer « validé » sans preuve ; ne pas confondre spécification / ADR / preuve / package /
  intégration.
- Les incohérences se **documentent**, ne se corrigent pas hors mission dédiée.

## Responsabilités

- **IA (Codex / Claude Code)** : applique les protocoles, vérifie le repository, met à jour ces
  documents en fin de mission, signale les divergences et l'état Git.
- **Humain** : arbitre les choix ouverts, valide les décisions de gouvernance (ex. commit de
  référence, ordre des cores, publication des packages), tranche les statuts `A_REVOIR`.
