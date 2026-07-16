# AI Core

**Statut** : `PREUVE_TECHNIQUE`

AI Core cadre l'usage avance de l'IA dans Enistere OS Foundation : prompts gouvernes, assistants
specialises, redaction, RAG documentaire, evaluation et connecteurs provider futurs.

Ce core contient actuellement une premiere preuve technique locale : un registre de prompts gouvernes
et un validateur Node pur. Il ne contient toujours :

- aucun SDK IA ;
- aucun provider configure ;
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
| AI Core 3 | Propose | Redaction layer pure + tests |
| AI Core 4 | Propose | Context builder allow-list |
| AI Core 5 | Propose | Provider adapter seam + fake provider |
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

Futures missions avec code devront ajouter des tests locaux dedies et rester sans provider reel par defaut.
