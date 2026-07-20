# Factory AI Runtime

Primitives internes du control plane IA. Ce répertoire n'est ni un produit IA autonome, ni un core
applicatif.

```bash
node factory/ai/runtime/scripts/validate-prompt-registry.mjs
node --test factory/ai/runtime/test/*.test.mjs
```

Les agents locaux sont dans `../adapters/`, l'orchestration et les approbations dans
`../orchestration/`, et les prompts gouvernés dans `../prompts/`.

Voir `AI_RUNTIME_SPECIFICATION.md` et `docs/architecture/AI_GOVERNANCE_AND_AGENT_ARCHITECTURE.md`.
