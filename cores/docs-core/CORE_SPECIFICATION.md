# Docs Core — Core Specification

> Statut : **IMPLEMENTATION_PARTIELLE**.
> Derniere mise a jour : 2026-07-12.

## 1. Objectif

Docs Core organise la documentation centrale d'Enistere OS Foundation.

Il ne remplace pas les documents sources. Il fournit une porte d'entree stable pour retrouver :

- la strategie ;
- les ADR ;
- les statuts projet ;
- les runbooks ;
- les checklists ;
- les prompts IA ;
- les specifications de cores ;
- les gates qualite.

## 2. Position dans la roadmap

Docs Core appartient a la V2 de la roadmap globale.

Reference : `strategy/04_ROADMAP_GLOBAL.md` §13.

La V2 attend notamment :

- une documentation centrale ;
- une documentation centrale navigable ;
- une documentation structuree ;
- des prompts IA classes ;
- des checklists qualite.

Docs Core 1→4 livre le cadrage initial, l'index central, l'onboarding minimal, le glossaire initial et
un controle local des liens internes. Il ne livre pas encore de site documentaire, de RAG, de moteur de
recherche ou de generation automatique.

## 3. Perimetre V2 initial

Inclus :

- index central `docs/README.md` ;
- conventions de lecture et d'entretien ;
- cartographie des documents de pilotage ;
- liens vers ADR, project-status, runbooks, prompts et Quality Core ;
- onboarding et glossaire initiaux ;
- controle local des liens Markdown internes ;
- statut explicite dans les fichiers de pilotage.

Exclus :

- site statique de documentation ;
- moteur de recherche ;
- RAG documentaire ;
- agents IA de documentation ;
- generation automatique de changelog ou de notes ;
- migration massive des documents existants ;
- changement de workflow GitHub ;
- changement runtime dans les cores applicatifs.

## 4. Sources de verite

La documentation suit cette hierarchie :

1. code, tests, scripts et configurations reels ;
2. ADR valides ;
3. `CORE_SPECIFICATION.md` du core concerne ;
4. `strategy/` ;
5. README, rapports et changelog.

En cas de contradiction, Docs Core ne decide pas seul. Il doit signaler l'ecart dans les documents de
pilotage ou recommander une mission de correction.

## 5. Structure documentaire cible

```txt
docs/
├── README.md                # index central Docs Core
├── adr/                     # decisions d'architecture
├── checklists/              # checklists qualite/release/statut
├── project-status/          # source de pilotage operationnelle
├── runbooks/                # futurs runbooks transverses
├── guides/                  # futurs guides de contribution/usage
├── onboarding/              # futur parcours nouveaux contributeurs
└── glossary/                # futur glossaire
```

Les runbooks specialises restent dans leur core quand ils dependent d'un contexte technique precis
exemple : `cores/cloud/docs/`, `cores/quality-core/`.

## 6. Regles de documentation

- Toute page doit annoncer son role.
- Toute promotion de statut doit citer une preuve.
- Les documents de pilotage doivent rester alignes entre eux.
- Les secrets, tokens, URLs signees et donnees personnelles ne doivent jamais etre versionnes.
- Les rapports historiques doivent etre identifies comme historiques quand ils ne refletent plus l'etat courant.
- Une mission documentaire ne doit pas modifier le runtime applicatif.

## 7. Gates applicables

Docs Core utilise les gates docs/quality :

- `git diff --check` ;
- `node cores/docs-core/scripts/check-doc-links.mjs` ;
- `node --test cores/docs-core/scripts/check-doc-links.test.mjs` si Docs Core est touche ;
- `node cores/quality-core/scripts/quality-gates.mjs plan docs` ;
- `node --test cores/quality-core/scripts/quality-gates.test.mjs` si Quality Core est touche ;
- `npm audit` racine avant PR.

Les gates Cloud, E2E navigateur, smoke mobile et tests runtime sont exclus sauf si la mission modifie les
cores concernes.

## 8. Criteres d'avancement

`SPECIFICATION_DOCUMENTAIRE` :

- specification Docs Core presente ;
- README Docs Core present ;
- index central `docs/README.md` present ;
- project-status alignes.

`IMPLEMENTATION_PARTIELLE` :

- index central maintenu sur plusieurs missions ;
- conventions de navigation appliquees ;
- liens vers tous les cores actifs et rapports V1/V2 majeurs ;
- dette documentaire suivie.

`IMPLEMENTATION_AVANCEE` :

- onboarding documentaire complet ;
- glossaire et guides principaux presents ;
- controle regulier des liens ou script de verification ;
- processus de revue documentaire integre aux gates.

`VALIDE_V1` :

- documentation centrale suffisamment stable pour guider un contributeur sans contexte conversationnel ;
- tous les cores actifs ont un chemin de lecture clair ;
- les rapports historiques et courants sont distingues ;
- gates documentaires reproductibles.
