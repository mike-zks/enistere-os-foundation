# AI Core

**Statut** : `IMPLEMENTATION_PARTIELLE`

AI Core cadre l'usage avance de l'IA dans Enistere OS Foundation : prompts gouvernes, assistants
specialises, redaction, RAG documentaire, evaluation et connecteurs provider futurs.

Ce core contient actuellement des preuves techniques locales : un registre de prompts gouvernes,
un validateur Node pur, une redaction layer pure, un context builder allow-list et un provider seam avec
fake provider deterministe. Il ne contient toujours :

- aucun SDK IA ;
- aucun provider reel configure ;
- aucune cle API ;
- aucun RAG runtime ;
- aucune base vectorielle ;
- aucun endpoint ;
- aucun workflow de deploiement.

## Prompt Registry

Livrables AI Core 2 :

- `prompt-registry.json` : registre local des prompts gouvernes existants ;
- `src/prompt-registry/model.mjs` : modele et validation de forme ;
- `src/prompt-registry/validator.mjs` : validation fichier JSON + references locales ;
- `scripts/validate-prompt-registry.mjs` : CLI locale ;
- `test/prompt-registry.test.mjs` : tests Node purs.

Commandes :

```bash
node cores/ai-core/scripts/validate-prompt-registry.mjs
node --test cores/ai-core/test/prompt-registry.test.mjs
```

Le registre ne rend aucun prompt executable automatiquement. Il ne fait que declarer et valider les
metadonnees de gouvernance : role, perimetre, documents requis, fichiers autorises/interdits, gates,
risque et statut.

## Redaction Layer

Livrables AI Core 3 :

- `src/redaction/redaction.mjs` : redaction de texte libre et de valeurs structurees ;
- `src/redaction/index.mjs` : exports publics du module ;
- `test/redaction.test.mjs` : tests Node purs.

La couche masque notamment :

- cles sensibles (`Authorization`, `access_token`, `refreshToken`, `API_KEY`, `password`, `email`) ;
- credentials `Bearer` / `Basic` ;
- JWT ;
- parametres d'URL signee ;
- secrets `.env` ;
- blocs de cle privee ;
- emails ;
- chemins locaux `file://`, `content://`, `ph://`.

Commandes :

```bash
node --test cores/ai-core/test/redaction.test.mjs
```

La redaction est une brique locale. Elle n'envoie rien a un provider et ne persiste aucune trace.

## Context Builder

Livrables AI Core 4 :

- `src/context/context-builder.mjs` : construction de contexte depuis une allow-list explicite ;
- `src/context/index.mjs` : exports publics du module ;
- `test/context-builder.test.mjs` : tests Node purs.

Le builder :

- normalise les chemins relatifs ;
- refuse les chemins absolus, `..`, `.env`, `node_modules`, `dist`, `build`, `.git` et dossiers similaires ;
- lit uniquement les fichiers explicitement demandés ;
- applique la redaction AI Core 3 avant toute sortie ;
- signale les fichiers manquants, refusés, tronqués et redigés ;
- borne la taille par fichier et la taille totale du contexte.

Commandes :

```bash
node --test cores/ai-core/test/context-builder.test.mjs
```

Le builder ne fait pas de RAG, pas d'indexation globale et pas d'appel provider. Il prepare seulement un
contexte local minimal, auditable et redacté.

## Provider Seam

Livrables AI Core 5 :

- `src/provider/provider-model.mjs` : erreurs controlees, capabilities et validation de requete ;
- `src/provider/fake-provider.mjs` : fake provider deterministe ;
- `src/provider/provider-adapter.mjs` : adapter sûr qui redige la requete avant provider ;
- `src/provider/index.mjs` : exports publics du module ;
- `test/provider.test.mjs` : tests Node purs.

Le fake provider :

- ne contacte aucun reseau ;
- ne charge aucun modele ;
- ne stocke aucun prompt ;
- renvoie une completion deterministe ;
- expose seulement des metadonnees non sensibles ;
- passe par la redaction avant invocation via `createSafeProviderAdapter`.

Commandes :

```bash
node --test cores/ai-core/test/provider.test.mjs
```

## References

- `CORE_SPECIFICATION.md`
- `strategy/10_AI_STRATEGY.md`
- `cores/quality-core/AI_PROMPT_GOVERNANCE.md`
- `prompts/README.md`
- `strategy/07_SECURITY.md`
- `strategy/06_DEPENDENCY_STRATEGY.md`

## Responsabilites cible

AI Core preparera a terme :

- un registre de prompts versionnes ;
- un context builder minimal et auditable ;
- une redaction layer obligatoire ;
- des provider adapters injectables ;
- un fake provider pour tests ;
- un evaluation harness ;
- un futur RAG documentaire avec corpus allow-list ;
- des rapports d'execution IA sans secrets.

## Limites actuelles

La Foundation ne choisit pas encore :

- provider IA par defaut ;
- modele ;
- SDK ;
- embedding model ;
- vector store ;
- stockage des traces IA ;
- evaluation automatique en CI.

Ces choix sont structurants et devront etre faits par mission dediee, avec ADR si necessaire.

## Missions

| Mission | Statut | Objet |
|---|---|---|
| AI Core 1 | Realise | Core specification + README |
| AI Core 2 | Realise | Prompt registry model + validator local |
| AI Core 3 | Realise | Redaction layer pure + tests |
| AI Core 4 | Realise | Context builder allow-list |
| AI Core 5 | Realise | Provider adapter seam + fake provider |
| AI Core 6 | Propose | Evaluation harness initial |
| AI Core 7 | Propose | Retrieval/RAG design decision |

## Gates

Mission documentaire :

```bash
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
```

Mission Prompt Registry :

```bash
node cores/ai-core/scripts/validate-prompt-registry.mjs
node --test cores/ai-core/test/prompt-registry.test.mjs
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
```

Mission Redaction Layer :

```bash
node --test cores/ai-core/test/redaction.test.mjs
node --test cores/ai-core/test/prompt-registry.test.mjs
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
```

Mission Context Builder :

```bash
node --test cores/ai-core/test/context-builder.test.mjs
node --test cores/ai-core/test/redaction.test.mjs cores/ai-core/test/prompt-registry.test.mjs
node cores/ai-core/scripts/validate-prompt-registry.mjs
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
```

Mission Provider Seam :

```bash
node --test cores/ai-core/test/provider.test.mjs
node --test cores/ai-core/test/context-builder.test.mjs cores/ai-core/test/redaction.test.mjs cores/ai-core/test/prompt-registry.test.mjs
node cores/ai-core/scripts/validate-prompt-registry.mjs
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
```

Futures missions avec code devront ajouter des tests locaux dedies et rester sans provider reel par defaut.
