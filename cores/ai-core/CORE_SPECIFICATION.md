# AI Core — Core Specification

> Statut : PREUVE_TECHNIQUE
> Mission courante : AI Core 2 — Prompt registry model + validator local
> Date : 2026-07-16

## 1. Objectif

AI Core definit le socle d'industrialisation IA d'Enistere OS Foundation.

Son role n'est pas de remplacer les decisions humaines ni de brancher immediatement un fournisseur IA. Il
formalise les capacites futures necessaires pour utiliser des agents IA de facon gouvernee, verifiable et
securisee dans les projets derives.

AI Core couvre a terme :

- catalogue de prompts gouvernes ;
- assistants specialises ;
- RAG documentaire ;
- evaluation de sorties IA ;
- redaction et masquage des donnees sensibles ;
- journalisation/audit des executions IA ;
- connecteurs provider via seams ;
- politiques d'usage et limites par role.

## 2. Positionnement

AI Core est un core transversal. Il s'appuie sur :

- `strategy/10_AI_STRATEGY.md` pour les principes d'usage IA ;
- `cores/quality-core/AI_PROMPT_GOVERNANCE.md` pour la gouvernance des prompts ;
- `prompts/README.md` pour le catalogue initial ;
- `strategy/07_SECURITY.md` pour les contraintes secrets/donnees ;
- `strategy/06_DEPENDENCY_STRATEGY.md` pour les dependances provider/SDK ;
- `docs/project-status/*` pour l'etat officiel du projet.

AI Core ne remplace pas Quality Core. Quality Core gouverne les gates, les checklists et les prompts de
mission existants. AI Core preparera les capacites IA avancees : RAG, evaluation, orchestration d'agents,
connecteurs provider et preuves d'execution.

## 3. Principes

```txt
L'IA assiste.
L'humain decide.
Les standards cadrent.
Les gates valident.
Les logs sont redactes.
Les secrets restent hors contexte IA.
```

## 4. Perimetre V1 documentaire

La premiere validation du core est documentaire.

Livrables V1 attendus :

- `CORE_SPECIFICATION.md` ;
- `README.md` ;
- cartographie des capacites IA cible ;
- modeles d'objets et interfaces conceptuelles ;
- exigences de securite ;
- criteres de readiness ;
- missions futures ordonnees.

Hors perimetre V1 :

- aucun SDK OpenAI/Anthropic/Gemini/local LLM ;
- aucun endpoint IA ;
- aucun RAG runtime ;
- aucune base vectorielle ;
- aucun prompt dynamique executable ;
- aucun secret provider ;
- aucun workflow deploye ;
- aucune evaluation automatique CI ;
- aucun agent autonome.

## 5. Architecture cible

```txt
AI Core
├── Prompt Registry
├── Context Builder
├── Redaction Layer
├── Retrieval / RAG Layer
├── Agent Orchestrator
├── Evaluation Harness
├── Provider Adapters
├── Audit Trail
└── Governance Reports
```

### 5.1 Prompt Registry

Registre versionne des prompts utilisables par les agents IA.

Responsabilites :

- identifier un prompt par `id`, `version`, `role`, `scope` ;
- pointer vers les documents obligatoires ;
- declarer les entrees attendues ;
- declarer les interdits ;
- declarer le format de sortie attendu ;
- lier une mission a ses gates.

Source actuelle : `prompts/`.

Preuve technique livree par AI Core 2 :

- `prompt-registry.json` reference les prompts gouvernes existants ;
- `src/prompt-registry/model.mjs` valide la forme des definitions ;
- `src/prompt-registry/validator.mjs` valide le fichier et les references locales ;
- `scripts/validate-prompt-registry.mjs` expose une commande locale ;
- `test/prompt-registry.test.mjs` couvre les invariants principaux.

Cette preuve ne rend aucun prompt executable automatiquement et ne branche aucun provider IA.

### 5.2 Context Builder

Construit un contexte minimal pour une mission IA.

Responsabilites :

- lire uniquement les fichiers requis ;
- respecter le principe de minimisation ;
- exclure secrets, `.env`, artefacts de build, donnees personnelles ;
- produire un contexte explicite et auditable ;
- signaler les documents absents.

### 5.3 Redaction Layer

Couche obligatoire avant tout envoi a un provider IA ou tout log.

Doit masquer :

- tokens ;
- cookies ;
- mots de passe ;
- cles API ;
- URL signees ;
- chemins de fichiers locaux sensibles ;
- emails et PII si non necessaires ;
- extraits `.env` ;
- payloads utilisateurs.

La redaction doit etre conservative : sur-redaction acceptable, fuite non acceptable.

### 5.4 Retrieval / RAG Layer

Couche de recherche documentaire pour les projets derives.

Exigences :

- corpus allow-list ;
- indexation explicite ;
- metadonnees de source ;
- citations ou references de fichiers ;
- expiration/reindex documentee ;
- exclusion des secrets ;
- pas de donnees client par defaut.

La base vectorielle et le modele d'embedding sont des decisions futures, sous ADR si structurants.

### 5.5 Agent Orchestrator

Orchestre des roles IA specialises sans autonomie dangereuse.

Roles cibles :

- Architect Assistant ;
- Code Generator ;
- Code Reviewer ;
- Security Reviewer ;
- DevOps Reviewer ;
- UX/UI Reviewer ;
- Documentation Assistant ;
- Testing Assistant.

Chaque execution doit avoir :

- un objectif ;
- un perimetre ;
- une liste de fichiers autorises ;
- des interdits ;
- un niveau de risque ;
- des gates attendus ;
- un rapport final.

### 5.6 Evaluation Harness

Evalue les sorties IA.

Exemples de controles :

- respect du perimetre ;
- absence de secrets ;
- coherence avec strategy/ADR/spec ;
- presence de tests ;
- absence d'affirmations non prouvees ;
- format de rapport complet ;
- non-regression documentaire.

Les evaluations automatiques peuvent aider, mais ne remplacent pas la revue humaine.

### 5.7 Provider Adapters

Seams pour fournisseurs IA.

Interface conceptuelle :

```txt
AiProviderAdapter
├── complete(request)
├── stream?(request)
├── embed?(request)
└── describeCapabilities()
```

Contraintes :

- provider injectable ;
- aucune cle dans Git ;
- timeouts et limites de taille ;
- journalisation sans prompt complet par defaut ;
- modele et version traces ;
- erreurs controlees ;
- fallback explicite, jamais silencieux.

Les providers concrets (OpenAI, Anthropic, Gemini, local LLM, embeddings, vector DB) sont hors perimetre
de cette mission et necessitent une decision separee.

### 5.8 Audit Trail

Trace minimale des executions IA.

Donnees autorisees :

- prompt id/version ;
- role ;
- scope ;
- commit/branche ;
- provider/model metadata non sensible ;
- statut ;
- gates declares/executés ;
- horodatage ;
- auteur humain.

Donnees interdites par defaut :

- prompt complet contenant du code proprietaire sensible ;
- secrets ;
- tokens ;
- PII ;
- sorties contenant donnees client ;
- fichiers `.env`.

## 6. Securite

AI Core applique `strategy/07_SECURITY.md`.

Regles obligatoires :

- aucun secret dans un prompt ;
- aucun `.env` transmis a un provider ;
- aucune cle provider versionnee ;
- aucune URL signee dans les logs ;
- aucune donnees personnelles sans base explicite ;
- redaction avant persistence ou emission externe ;
- allow-list de fichiers pour le RAG ;
- separation entre donnees Foundation et donnees projet/client ;
- audit des actions IA sensibles.

## 7. Donnees et classification

| Donnee | Classification | Politique |
|---|---|---|
| Strategy/ADR/spec publics du repo | Interne projet | Utilisable dans contexte IA |
| Code source Foundation | Interne projet | Utilisable sous perimetre explicite |
| Secrets `.env` | Secret | Jamais transmis |
| Logs avec tokens/PII | Sensible | Redaction obligatoire |
| Donnees client/projet derive | Sensible | Exclusion par defaut |
| Prompts versionnes | Interne projet | Versionnes et revus |
| Sorties IA | Interne projet | Relues avant merge |

## 8. Dependances

V1 documentaire : aucune dependance.

Toute dependance IA future est structurante et doit etre justifiee :

- SDK provider ;
- base vectorielle ;
- librairie embeddings ;
- orchestrateur agent ;
- outil evaluation ;
- stockage de traces.

Une dependance critique IA peut necessiter un ADR.

## 9. Integration avec Quality Core

AI Core doit utiliser les processus Quality Core :

- prompts gouvernes ;
- checklists PR ;
- branch protection ;
- release runbook ;
- quality gates ;
- rapports project-status.

AI Core peut ajouter plus tard des helpers, mais ne doit pas dupliquer `quality-gates.mjs` sans raison.

## 10. Integration avec Docs Core

Le RAG futur doit respecter Docs Core :

- liens internes valides ;
- corpus documente ;
- chemins stables ;
- rapports sources ;
- pas de generation documentaire non relue.

## 11. Integration avec Cloud Core

Tout service IA deploye est hors V1 et devra respecter Cloud Core :

- secrets par environnement ;
- logs redactes ;
- health checks ;
- limites de cout ;
- rate limiting ;
- observabilite ;
- backup/retention si stockage ;
- deploiement uniquement via runbook.

## 12. Integration avec les cores applicatifs

AI Core ne doit pas injecter de logique IA dans les cores applicatifs par defaut.

Les projets derives peuvent consommer AI Core pour :

- aide a la generation de modules ;
- recherche documentaire interne ;
- assistant de support ;
- revue de PR ;
- extraction de checklist ;
- classification non critique.

Toute fonctionnalite IA metier doit rester dans le projet derive ou un module dedie, avec decisions propres.

## 13. Modeles conceptuels

### 13.1 PromptDefinition

```txt
PromptDefinition
├── id
├── version
├── title
├── role
├── allowedInputs
├── requiredDocuments
├── allowedFiles
├── forbiddenFiles
├── expectedOutput
├── gates
└── riskLevel
```

### 13.2 AiRun

```txt
AiRun
├── id
├── promptId
├── promptVersion
├── role
├── scope
├── provider
├── model
├── branch
├── commit?
├── status
├── startedAt
├── completedAt?
└── reportPath?
```

### 13.3 RedactionResult

```txt
RedactionResult
├── safeText
├── redactedKinds
├── truncated
└── warnings
```

### 13.4 RetrievalSource

```txt
RetrievalSource
├── path
├── title
├── section?
├── commit
├── score
└── excerpt
```

## 14. Erreurs

Les erreurs AI Core doivent etre controlees et non sensibles.

Categories :

- `InvalidPrompt`
- `ForbiddenInput`
- `ContextTooLarge`
- `SensitiveDataDetected`
- `ProviderUnavailable`
- `ProviderRejected`
- `EvaluationFailed`
- `RetrievalUnavailable`
- `Unknown`

Les messages publics ne doivent jamais contenir un secret, un prompt complet ou une sortie sensible.

## 15. Logs

Logs autorises :

- operation ;
- prompt id/version ;
- role ;
- scope ;
- provider/model non secret ;
- statut ;
- duree ;
- tailles agrégées ;
- erreurs controlees.

Logs interdits :

- prompt complet ;
- secret ;
- token ;
- cookie ;
- `.env` ;
- PII ;
- URL signee ;
- contenu client.

## 16. Tests futurs

Tests cibles :

- redaction secrets/PII ;
- prompt registry validation ;
- context builder allow-list ;
- provider adapter fake ;
- evaluator scope compliance ;
- retrieval source citation ;
- audit event sanitization ;
- no-secret snapshots.

Les tests doivent utiliser des fakes/placeholders, jamais un provider IA reel par defaut.

## 17. Readiness V1 documentaire

AI Core peut passer a `SPECIFICATION_DOCUMENTAIRE` si :

- `CORE_SPECIFICATION.md` existe ;
- `README.md` existe ;
- les limites V1 sont explicites ;
- les integrations Quality/Docs/Security sont documentees ;
- aucune dependance/provider/secret n'est ajoute ;
- les docs de statut et le changelog sont mis a jour ;
- `quality-gates docs` passe.

## 18. Readiness avancee future

AI Core pourra viser `IMPLEMENTATION_PARTIELLE` quand il aura au minimum :

- registre de prompts typé ou valide ;
- redaction layer testee ;
- context builder local ;
- provider fake ;
- evaluation harness initial ;
- rapports d'execution versionnables ;
- tests automatises.

## 19. VALIDE_V1 futur

Un AI Core `VALIDE_V1` futur doit prouver :

- aucune fuite de secrets dans les tests ;
- prompts gouvernes executable localement ;
- provider fake stable ;
- redaction obligatoire ;
- RAG local ou retrieval documentaire sans donnees sensibles ;
- evaluation de perimetre ;
- documentation et runbooks ;
- gates Quality Core adaptés.

## 20. Hors perimetre explicite

AI Core ne doit pas :

- choisir un provider IA par defaut sans decision ;
- deployer un service IA ;
- gerer des secrets provider ;
- envoyer du code a un provider externe automatiquement ;
- indexer tout le repo sans allow-list ;
- traiter des donnees client par defaut ;
- remplacer une revue humaine ;
- decider une release ;
- contourner la protection `main`.

## 21. Missions futures recommandees

1. AI Core 2 — Prompt registry model + validator documentaire/local. **Realise**.
2. AI Core 3 — Redaction layer pure + tests.
3. AI Core 4 — Context builder allow-list + reports.
4. AI Core 5 — Provider adapter seam + fake provider.
5. AI Core 6 — Evaluation harness initial.
6. AI Core 7 — Retrieval/RAG design decision (ADR si choix vector DB/provider).
7. AI Core V1 Readiness Review.

## 22. Decisions pendantes

| Decision | Statut |
|---|---|
| Provider IA par defaut | Non decide |
| SDK provider | Non decide |
| Embedding model | Non decide |
| Vector store | Non decide |
| Stockage des traces IA | Non decide |
| Politique couts/quotas | Non decide |
| Evaluation automatique en CI | Non decide |
| Donnees projet derive autorisees | Non decide |

## 23. Gouvernance de changement

Tout changement AI Core doit :

- declarer le perimetre ;
- lister les documents lus ;
- ne modifier qu'un core sauf mission explicite ;
- mettre a jour `docs/project-status/` ;
- mettre a jour `CHANGELOG.md` ;
- executer les gates adaptes ;
- produire un rapport final factuel.

## 24. Statut initial

Apres AI Core 1, le core passe de `DOSSIER_SEULEMENT` a `SPECIFICATION_DOCUMENTAIRE`.

Cette promotion ne signifie pas qu'un service IA existe. Elle signifie uniquement que le core IA est cadre,
gouverne et pret pour des missions incrementales futures.
