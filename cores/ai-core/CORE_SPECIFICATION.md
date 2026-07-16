# AI Core — Core Specification

> Statut : IMPLEMENTATION_AVANCEE
> Mission courante : AI Core 9 — Prompt execution runner
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

Preuve technique livree par AI Core 4 :

- `src/context/context-builder.mjs` construit un contexte local depuis une allow-list explicite ;
- `src/context/index.mjs` expose le module ;
- `test/context-builder.test.mjs` couvre la normalisation de chemins, le refus des chemins interdits,
  les fichiers manquants, la deduplication, la redaction appliquee, les limites par fichier et les limites
  globales.

Le builder est local, auditable, sans provider, sans RAG runtime, sans indexation globale, sans appel reseau,
sans stockage de traces et sans dependance.

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

Preuve technique livree par AI Core 3 :

- `src/redaction/redaction.mjs` fournit `redactText`, `redactValue`, `isSensitiveKey` et marqueurs controles ;
- `src/redaction/index.mjs` expose le module ;
- `test/redaction.test.mjs` couvre les cles sensibles, credentials Authorization, JWT, URLs signees,
  secrets `.env`, cles privees, emails, chemins locaux, erreurs, cycles et profondeur maximale.

La couche est pure, locale, sans provider, sans stockage, sans appel reseau et sans dependance.

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

Decision AI Core 7 :

- Retrieval/RAG V1 = retrieval documentaire local par allow-list explicite ;
- le Context Builder AI Core 4 reste le mecanisme V1 pour assembler le contexte ;
- la redaction AI Core 3 reste obligatoire avant toute sortie ;
- l'Evaluation Harness AI Core 6 controle perimetre, documents requis, gates, format et secrets detectables ;
- aucun embedding, vector store, provider reel, SDK IA, index persistant, appel reseau, ingestion automatique
  ou donnees client par defaut ;
- un ADR futur devient obligatoire avant de choisir embedding model, vector DB, provider/SDK, service RAG,
  stockage d'index, retention de traces ou ingestion automatique.

Rapport : `docs/project-status/AI_CORE7_RETRIEVAL_RAG_DECISION.md`.

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

Preuve technique livree par AI Core 6 :

- `src/evaluation/evaluation-harness.mjs` evalue localement le perimetre modifie, les fichiers interdits,
  les documents requis, les gates attendus, le format de rapport, la preuve de verification et les secrets
  detectables via la redaction AI Core 3 ;
- `src/evaluation/index.mjs` expose le module ;
- `test/evaluation-harness.test.mjs` couvre les statuts `pass`/`warn`/`fail`, le score, les chemins hors
  perimetre, les gates manquants, les documents manquants, le format de rapport et la detection de secrets.

Cette preuve n'ajoute aucun LLM judge, provider, SDK IA, appel reseau, embeddings, base vectorielle,
workflow CI automatique ou stockage de traces.

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

Preuve technique livree par AI Core 5 :

- `src/provider/provider-model.mjs` definit les capabilities, erreurs controlees et validation de requete ;
- `src/provider/fake-provider.mjs` fournit un fake provider deterministe sans reseau ni modele reel ;
- `src/provider/provider-adapter.mjs` applique validation + redaction avant invocation provider ;
- `src/provider/index.mjs` expose le module ;
- `test/provider.test.mjs` couvre validation, capabilities, completions deterministes, erreurs controlees,
  redaction avant provider et metadonnees non sensibles.

Cette couche ne choisit aucun provider reel, n'ajoute aucun SDK, ne gere aucune cle API, ne contacte aucun reseau
et ne stocke aucune trace.

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

## 15.1 Rapports d'execution IA

Preuve technique livree par AI Core 8 :

- `src/reports/execution-report.mjs` definit un schema local `ai-execution-report/v1` ;
- `src/reports/index.mjs` expose le module ;
- `test/report-schema.test.mjs` couvre creation, validation, redaction, refus des prompts bruts, statuts
  conservateurs, deduplication et bornes.

Le rapport relie :

- mission ;
- prompt id/version/role ;
- documents lus ;
- fichiers modifies ;
- gates executes ;
- limites ;
- resultat d'evaluation ;
- prochaine action.

Le module ne stocke rien, n'ecrit aucun fichier, n'appelle aucun provider, n'effectue aucun appel reseau et
refuse les payloads de prompt complet (`promptText`, `rawPrompt`, `fullPrompt`, `messages`).

### 15.2 Prompt execution runner

Preuve technique livree par AI Core 9 :

- `src/runner/prompt-runner.mjs` compose le registry, le context builder, le safe provider adapter, le fake
  provider, l'evaluation harness et le schema de rapport ;
- `src/runner/index.mjs` expose le module ;
- `test/prompt-runner.test.mjs` couvre execution complete, redaction, refus de contexte hors allow-list,
  documents requis manquants, prompt inactif et absence de prompt brut dans le rapport.

Le runner execute uniquement un prompt `active`, construit son contexte depuis `requiredDocuments + allowedFiles`,
refuse l'execution si le contexte est incomplet, et utilise un fake provider deterministe par defaut.

Il ne choisit aucun provider reel, n'ajoute aucun SDK IA, n'appelle aucun reseau, n'ecrit aucune trace et ne
remplace pas la revue humaine.

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

Apres AI Core 8, le seuil technique minimal `IMPLEMENTATION_PARTIELLE` est couvert : registry, redaction,
context builder, provider fake, evaluation harness, decision retrieval/RAG V1, rapports d'execution
versionnables et tests. La promotion eventuelle au-dela de `IMPLEMENTATION_PARTIELLE` doit passer par une
readiness review dediee.

Apres AI Core 9, le runner de prompt gouverne est livre et B1 est ferme. Le statut reste
`IMPLEMENTATION_AVANCEE` : `VALIDE_V1` reste differe par le helper de citation retrieval et le runbook
d'usage AI Core.

Revue AI Core V1 (2026-07-16) :

- rapport : `docs/project-status/AI_CORE_V1_READINESS_REVIEW.md` ;
- §18 : **7/7 satisfaits** ;
- §19 futur : **5/8 satisfaits + 3/8 partiels + 0 non satisfaits** ;
- decision : **`IMPLEMENTATION_PARTIELLE` → `IMPLEMENTATION_AVANCEE`** ;
- `VALIDE_V1` differe : runner de prompt gouverne, helper de citation retrieval et runbook d'usage AI Core
  restent a livrer.

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
2. AI Core 3 — Redaction layer pure + tests. **Realise**.
3. AI Core 4 — Context builder allow-list + reports. **Realise**.
4. AI Core 5 — Provider adapter seam + fake provider. **Realise**.
5. AI Core 6 — Evaluation harness initial. **Realise**.
6. AI Core 7 — Retrieval/RAG design decision (ADR si choix vector DB/provider). **Realise**.
7. AI Core 8 — Governance/execution report schema. **Realise**.
8. AI Core V1 Readiness Review. **Realise**.
9. AI Core 9 — Prompt execution runner (fake provider only). **Realise**.
10. AI Core 10 — Retrieval source citation helper.

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
