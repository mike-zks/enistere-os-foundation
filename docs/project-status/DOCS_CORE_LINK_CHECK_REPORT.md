# DOCS_CORE_LINK_CHECK_REPORT.md — Docs Core 4

> Date : 2026-07-12.
> Perimetre : liens Markdown internes, documentation uniquement.

## Verdict

**Docs Core 4 — revue de liens documentaires ciblee : REALISE.**

Un script Node pur controle les liens Markdown internes du perimetre documentaire central :

- `README.md` ;
- `docs/` ;
- `factory/quality/core/` ;
- `factory/ai/prompts/README.md`.

## Livrables

- `factory/quality/core/scripts/docs-link-check.mjs` ;
- `factory/quality/core/scripts/check-doc-links.test.mjs` ;
- ce rapport.

## Comportement du script

Le script :

- scanne les fichiers `.md` / `.mdx` ;
- extrait les liens Markdown inline ;
- ignore les liens externes (`http`, `https`, `mailto`, etc.) ;
- ignore les anchors seuls (`#section`) ;
- ignore les liens dans les blocs de code fences ;
- accepte les cibles fichiers et dossiers ;
- affiche une erreur detaillee si une cible interne manque.

Il ne verifie pas encore les fragments d'ancres internes. Ce controle est volontairement differe pour eviter
les faux positifs sur les titres generes par differents moteurs Markdown.

## Preuve locale

```bash
node --test factory/quality/core/scripts/check-doc-links.test.mjs
node factory/quality/core/scripts/docs-link-check.mjs
```

Resultat observe :

```txt
Docs Core link check passed (53 files).
```

## Decision de statut

Docs Core passe de **SPECIFICATION_DOCUMENTAIRE** a **IMPLEMENTATION_PARTIELLE**.

Justification :

- index central present et maintenu ;
- onboarding minimal present ;
- glossaire initial present ;
- audit de navigation versionne ;
- controle de liens interne reproductible et teste ;
- aucun runtime applicatif, workflow, dependance, RAG ou site docs.

## Limites

- Pas de verification d'ancres.
- Pas de controle des liens externes.
- Pas d'integration CI obligatoire.
- Pas de generation de site documentaire.

## Prochaine mission recommandee

Docs Core V2 Readiness Review — verifier les criteres roadmap §13.4 appliques au Docs Core et decider si le
core reste `IMPLEMENTATION_PARTIELLE` ou peut passer a `IMPLEMENTATION_AVANCEE`.
