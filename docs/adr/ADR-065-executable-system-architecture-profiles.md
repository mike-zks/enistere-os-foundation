# ADR-065 — Profils d’architecture système exécutables

- **Statut :** accepté
- **Date :** 2026-07-27
- **Décision précédente :** [ADR-060](ADR-060-system-profile-taxonomy.md)

## Contexte

ADR-060 a séparé le cas d’usage du système des dimensions de topologie. Le
dépôt savait normaliser les quatre profils canoniques, mais trois écarts
subsistaient :

- `init` partait encore d’une combinaison de frameworks ;
- la validation Blueprint refusait plusieurs backends avant la création du CSM,
  empêchant le resolver d’expliquer la différence entre représentation et
  génération ;
- le plan exposait un champ `profile` historique pour les presets de composition
  sans preuve distincte du support du profil système.

Une topologie distribuée pouvait donc être documentée mais pas parcourir la
chaîne canonique complète.

## Décision

La CLI, le resolver et le plan utilisent désormais les profils système comme
première décision :

```text
backend-service
product-platform
distributed-platform
service-ecosystem
```

`enistere init` exige `--architecture=<profil>` avant les sélections de runtime.
Les runtimes décrivent ensuite les applications ; ils ne déterminent pas le
profil.

Le pipeline sépare deux portes :

```text
Blueprint structure
  → CSM representation validation
  → resolution of effective generation support
```

Une `distributed-platform` à plusieurs backends est donc :

- valide et `IMPLEMENTED` en représentation ;
- planifiable avec diagnostics structurés ;
- `PLANNED` et bloquée en génération.

Un `service-ecosystem` reste `TARGET`, avec représentation disponible mais
génération `PLANNED`.

## Contrat de sortie

`ResolvedSystem` et `GenerationPlan` exposent séparément :

```yaml
architectureProfile:
  id: distributed-platform
  status: PLANNED
  representation: IMPLEMENTED
  generation: PLANNED
  generatable: false

compositionPreset: null
```

Le champ `profile` du plan est conservé uniquement pour compatibilité Blueprint
v1 et reflète `compositionPreset`. Un système multi-surface ou multi-backend ne
reçoit jamais un preset déduit de sa première application.

Les six dimensions restent indépendantes mais doivent être cohérentes avec le
profil. Par exemple, plusieurs clients ne changent pas un
`modular-monolith` en système distribué ; un `service-ecosystem` exige en
revanche `microservices`, déploiements indépendants, données par service et
maturité opérationnelle distribuée.

## Commandes

```bash
enistere architecture list
enistere architecture describe product-platform
enistere architecture recommend --clients=4
enistere init enistere.yaml marketplace \
  --architecture=product-platform \
  --api=nestjs \
  --web=nextjs,angular \
  --mobile=react-native,flutter
enistere validate enistere.yaml
enistere plan enistere.yaml --explain
```

`validate` prouve que l’intention est représentable. `plan --explain` expose le
support effectif et ses blockers. `generate` refuse tout plan non prêt.

## Invariants

- les sorties canoniques n’émettent aucun ancien nom de profil ;
- un profil de système n’est jamais un preset de starters ;
- la génération distribuée n’est pas revendiquée sans preuve ;
- il n’existe qu’un pipeline canonique ;
- chaque starter reste matérialisé à `starters/<runtime>` : aucun dossier
  `base/` ni `composition.baseSource`.

## Preuves

- tests des alias, dimensions, initialisation system-first et recommandations ;
- tests CSM des incohérences profil/dimensions ;
- tests du parcours multi-backend jusqu’au resolver et au plan bloqué ;
- tests empêchant l’attribution d’un preset mono-backend à une topologie
  distribuée ;
- suite Factory et fitness functions.

## Conséquences

`backend-service` et `product-platform` sont exécutables sur les compositions
déjà prouvées. `distributed-platform` peut guider les décisions et produire un
plan explicable sans support fictif. `service-ecosystem` demeure une cible.

La prochaine mission ne doit pas ajouter une capability. Elle doit prouver les
profils supportés par des goldens système dédiés et stabiliser le contrat de
graphe/ownership nécessaire à `distributed-platform`.
