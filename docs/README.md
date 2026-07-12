# Documentation Enistere OS Foundation

> Index central Docs Core.
> Derniere mise a jour : 2026-07-12.

Cette page est la porte d'entree documentaire du repository.

Elle oriente vers les sources de verite, les rapports de statut, les decisions d'architecture, les
runbooks, les checklists qualite et les prompts IA.

## Lecture rapide

| Besoin | Lire |
|---|---|
| Reprendre une session ou preparer une mission | [`project-status/SESSION_HANDOFF.md`](project-status/SESSION_HANDOFF.md) |
| Connaitre l'etat courant du projet | [`project-status/FOUNDATION_CURRENT_STATE.md`](project-status/FOUNDATION_CURRENT_STATE.md) |
| Voir les statuts par core/package | [`project-status/IMPLEMENTATION_MATRIX.md`](project-status/IMPLEMENTATION_MATRIX.md) |
| Connaitre la prochaine action autorisee | [`project-status/NEXT_ACTIONS.md`](project-status/NEXT_ACTIONS.md) |
| Comprendre les decisions d'architecture | [`adr/`](adr/) |
| Choisir les gates qualite | [`../cores/quality-core/QUALITY_GATES_MATRIX.md`](../cores/quality-core/QUALITY_GATES_MATRIX.md) |
| Preparer une PR | [`checklists/PR_QUALITY_CHECKLIST.md`](checklists/PR_QUALITY_CHECKLIST.md) |
| Preparer une release ou promotion | [`checklists/RELEASE_READINESS_CHECKLIST.md`](checklists/RELEASE_READINESS_CHECKLIST.md) |
| Preparer une mission IA | [`../cores/quality-core/AI_PROMPT_GOVERNANCE.md`](../cores/quality-core/AI_PROMPT_GOVERNANCE.md) |

## Sources de pilotage

Le dossier [`project-status/`](project-status/) est la source de pilotage operationnelle.

| Fichier | Role |
|---|---|
| [`project-status/README.md`](project-status/README.md) | Role des fichiers, ordre de lecture, protocoles debut/fin de mission |
| [`project-status/SESSION_HANDOFF.md`](project-status/SESSION_HANDOFF.md) | Resume de reprise compact |
| [`project-status/FOUNDATION_CURRENT_STATE.md`](project-status/FOUNDATION_CURRENT_STATE.md) | Photographie officielle de l'etat reel |
| [`project-status/IMPLEMENTATION_MATRIX.md`](project-status/IMPLEMENTATION_MATRIX.md) | Matrice par core/package/module |
| [`project-status/NEXT_ACTIONS.md`](project-status/NEXT_ACTIONS.md) | Prochaine action unique et historique des missions |
| [`project-status/DECISIONS_REGISTER.md`](project-status/DECISIONS_REGISTER.md) | Lecture rapide ADR vs implementation |

## Decisions d'architecture

Les ADR sont dans [`adr/`](adr/).

Points d'entree :

- [`adr/ADR_BACKLOG.md`](adr/ADR_BACKLOG.md) ;
- [`adr/ADR_V1_BLOCKING_REVIEW.md`](adr/ADR_V1_BLOCKING_REVIEW.md) ;
- ADR valides `ADR-001` a `ADR-016`, `ADR-039`, `ADR-040`.

Un ADR valide documente une decision. Il ne prouve pas que l'implementation correspondante est terminee.
Verifier le statut d'implementation dans [`project-status/DECISIONS_REGISTER.md`](project-status/DECISIONS_REGISTER.md).

## Strategy

Les documents strategie sont dans [`../strategy/`](../strategy/).

Pour piloter une mission :

- [`../strategy/04_ROADMAP_GLOBAL.md`](../strategy/04_ROADMAP_GLOBAL.md) ;
- [`../strategy/05_EXECUTION_CHAIN.md`](../strategy/05_EXECUTION_CHAIN.md) ;
- [`../strategy/10_AI_STRATEGY.md`](../strategy/10_AI_STRATEGY.md).

Les documents strategy cadrent la vision et la roadmap. L'etat courant reste dans `project-status/`.

## Cores actifs

| Core | Documentation principale |
|---|---|
| API Core NestJS | [`../cores/api-nestjs/README.md`](../cores/api-nestjs/README.md), [`../cores/api-nestjs/CORE_SPECIFICATION.md`](../cores/api-nestjs/CORE_SPECIFICATION.md) |
| Web Core Next.js | [`../cores/web-nextjs/README.md`](../cores/web-nextjs/README.md), [`../cores/web-nextjs/CORE_SPECIFICATION.md`](../cores/web-nextjs/CORE_SPECIFICATION.md) |
| Mobile Core React Native | [`../cores/mobile-react-native/README.md`](../cores/mobile-react-native/README.md), [`../cores/mobile-react-native/CORE_SPECIFICATION.md`](../cores/mobile-react-native/CORE_SPECIFICATION.md) |
| UI Kit | [`../cores/ui-kit/README.md`](../cores/ui-kit/README.md), [`../cores/ui-kit/CORE_SPECIFICATION.md`](../cores/ui-kit/CORE_SPECIFICATION.md), [`../cores/ui-kit/docs/components.md`](../cores/ui-kit/docs/components.md) |
| Cloud Core | [`../cores/cloud/README.md`](../cores/cloud/README.md), [`../cores/cloud/CORE_SPECIFICATION.md`](../cores/cloud/CORE_SPECIFICATION.md), [`../cores/cloud/docs/`](../cores/cloud/docs/) |
| Quality Core | [`../cores/quality-core/README.md`](../cores/quality-core/README.md), [`../cores/quality-core/CORE_SPECIFICATION.md`](../cores/quality-core/CORE_SPECIFICATION.md) |
| Docs Core | [`../cores/docs-core/README.md`](../cores/docs-core/README.md), [`../cores/docs-core/CORE_SPECIFICATION.md`](../cores/docs-core/CORE_SPECIFICATION.md) |

## Runbooks et checklists

Runbooks specialises :

- Cloud : [`../cores/cloud/docs/`](../cores/cloud/docs/) ;
- Quality Core : [`../cores/quality-core/`](../cores/quality-core/).

Checklists transverses :

- [`checklists/PR_QUALITY_CHECKLIST.md`](checklists/PR_QUALITY_CHECKLIST.md) ;
- [`checklists/RELEASE_READINESS_CHECKLIST.md`](checklists/RELEASE_READINESS_CHECKLIST.md) ;
- [`checklists/CORE_STATUS_REVIEW_CHECKLIST.md`](checklists/CORE_STATUS_REVIEW_CHECKLIST.md).

## Prompts IA

Les prompts sont dans [`../prompts/`](../prompts/).

Points d'entree :

- [`../prompts/README.md`](../prompts/README.md) ;
- [`../prompts/global/mission-brief-template.md`](../prompts/global/mission-brief-template.md) ;
- [`../cores/quality-core/AI_PROMPT_GOVERNANCE.md`](../cores/quality-core/AI_PROMPT_GOVERNANCE.md).

## Regles d'entretien

- Mettre a jour `project-status/` quand une mission change un statut, une preuve ou une prochaine action.
- Preferer un lien vers le document source plutot qu'une duplication longue.
- Signaler les documents historiques au lieu de les faire passer pour l'etat courant.
- Ne jamais versionner de secret, token, URL signee, donnees personnelles ou fichier `.env` reel.
- Une mission documentaire ne modifie pas les runtimes applicatifs.
