# AI_CORE7_RETRIEVAL_RAG_DECISION.md

## 1. Verdict

**Décision : Retrieval documentaire V1 = allow-list locale, sans RAG runtime.**

AI Core 7 ne choisit aucun provider IA, modèle d'embedding, base vectorielle, SDK, service réseau,
stockage d'index ou pipeline d'indexation automatique.

Le modèle retenu pour la Foundation V1 est :

```txt
Documents officiels versionnés
→ allow-list explicite par mission/prompt
→ Context Builder AI Core 4
→ Redaction AI Core 3
→ Provider seam/fake provider AI Core 5 si nécessaire
→ Evaluation Harness AI Core 6
→ Revue humaine
```

## 2. Documents lus

- `strategy/10_AI_STRATEGY.md` §33–§37 ;
- `strategy/04_ROADMAP_GLOBAL.md` §20 ;
- `cores/ai-core/CORE_SPECIFICATION.md` §5.4, §6, §8, §10, §18 ;
- `docs/adr/ADR_BACKLOG.md` ;
- `docs/project-status/NEXT_ACTIONS.md` ;
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` ;
- `docs/project-status/IMPLEMENTATION_MATRIX.md` ;
- `docs/project-status/SESSION_HANDOFF.md`.

## 3. Options étudiées

| Option | Description | Verdict |
|---|---|---|
| A | Rester sans décision RAG | Rejeté : ambigu pour les prochaines missions AI Core |
| B | Implémenter embeddings + vector DB maintenant | Rejeté : choix structurant sans ADR, dépendances, stockage et coûts |
| C | Ajouter un service RAG réseau/provider | Rejeté : hors V1, secrets/provider/cloud à cadrer |
| D | Retrieval documentaire local par allow-list | **Retenu** |

## 4. Règles V1 retenues

- Corpus autorisé : documents versionnés de la Foundation uniquement.
- Entrée : liste explicite de fichiers ou dossiers gouvernés par prompt/mission.
- Chemins interdits : `.env`, secrets, artefacts de build, dépendances, dossiers cachés sensibles, données client.
- Redaction : obligatoire avant toute sortie vers un provider, un rapport ou un log.
- Sources : toute sortie assistée doit pouvoir citer les fichiers lus.
- Indexation : aucune indexation globale du repository.
- Persistance : aucun stockage d'index, embedding, prompt complet, trace sensible ou donnée client.
- Evaluation : le harness AI Core 6 contrôle périmètre, docs requis, gates, format et secrets détectables.
- Revue : l'évaluation automatique assiste mais ne remplace jamais la revue humaine.

## 5. Corpus Foundation V1

Corpus documentaire autorisé par défaut, à condition d'être explicitement allow-listé :

- `strategy/*.md` ;
- `docs/adr/*.md` hors secrets inexistants ;
- `docs/project-status/*.md` ;
- `docs/checklists/*.md` ;
- `docs/guides/*.md` ;
- `docs/onboarding/*.md` ;
- `docs/glossary/*.md` ;
- `cores/*/CORE_SPECIFICATION.md` ;
- `cores/*/README.md` ;
- `prompts/*.md` et `prompts/**/*.md` ;
- `CHANGELOG.md` ;
- `README.md`.

Le code source peut être inclus uniquement dans une mission qui l'autorise explicitement et avec une liste
de chemins bornée.

## 6. ADR requis plus tard

Un ADR devient obligatoire si la Foundation veut choisir un ou plusieurs éléments suivants :

- modèle d'embedding ;
- base vectorielle ;
- SDK/provider IA ;
- service RAG déployé ;
- stockage d'index persistant ;
- ingestion automatique du repository ;
- données projet dérivé/client dans un corpus IA ;
- politique de coûts/quotas IA ;
- rétention/audit de traces IA.

Cette décision ne crée donc pas de nouvel ADR. Elle empêche seulement un choix implicite.

## 7. Impact statut

`ai-core` reste **`IMPLEMENTATION_PARTIELLE`**.

AI Core 7 ferme l'ambiguïté Retrieval/RAG V1, mais ne livre pas encore les rapports d'exécution versionnables
nécessaires avant une revue V1 plus ambitieuse.

## 8. Prochaine action

**AI Core 8 — Governance/execution report schema** :

- définir un format local de rapport IA versionnable ;
- lier prompt id/version, documents lus, fichiers modifiés, gates, limites, findings d'évaluation ;
- garantir redaction et absence de secret ;
- rester sans provider réel, réseau, stockage externe ou workflow CI automatique.
