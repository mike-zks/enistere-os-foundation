# ADR-074 — La parité de famille couvre tous les runtimes, pas seulement les `ready`

- Statut : Validé et implémenté
- Date : 2026-07-28
- Décideur : Owner Foundation
- Complète : ADR-062 et ADR-070

## Contexte

ADR-070 a posé la parité par famille : les runtimes d'une même famille sont des
implémentations interchangeables du même produit, donc les targets `ready` d'une
famille doivent déclarer les mêmes responsabilités.

La règle ne s'appliquait qu'aux targets **`ready`**. Un membre de famille pouvait
donc se déclarer `unsupported` et échapper entièrement à la mesure. C'est
exactement l'état de FastAPI : conforme au Platform Baseline (28/28), annoncé
comme troisième runtime API, et `unsupported` sur les trois capabilities. Il
échappait à la parité **en ne supportant rien**.

Le décompte réel : sur sept runtimes cibles, **trois ne portent aucune
capability** — FastAPI (`unsupported`), Angular et Flutter (`planned`). Un
produit généré avec l'un d'eux n'a ni authentification, ni autorisation, ni
fichiers. La plateforme annonce sept runtimes et en sert quatre.

ADR-070 mesurait donc la parité entre ceux qui jouent, en ignorant ceux qui ne
jouent pas.

## Décision

### 1. La parité s'apprécie sur tous les runtimes d'une famille

`familyParityGaps` considère désormais **chaque** runtime d'une famille servie,
quel que soit son statut. Un runtime ne s'exonère plus en déclarant qu'il ne
supporte rien.

### 2. La barre est la couverture des pairs, pas le périmètre de la capability

Un runtime doit ce que ses pairs de famille tiennent **réellement** — jamais
l'intégralité des responsabilités déclarées. Conséquences vérifiées :

- `files/flutter` ne doit qu'`upload`, parce que React Native ne tient
  qu'`upload` ;
- `rbac/flutter` ne doit **rien** : aucun runtime mobile n'implémente RBAC.

Une famille où personne n'implémente une responsabilité n'en doit aucune tant
qu'un membre ne l'implémente pas.

### 3. `not-applicable` reste la seule exemption, et doit se justifier

Une absence structurelle de surface reste légitime — l'autorisation fine est une
préoccupation serveur, une application mobile n'a pas de surface RBAC propre.
Mais sans raison lisible par la machine, `not-applicable` deviendrait la nouvelle
échappatoire que `unsupported` était jusqu'ici.

Le schéma exige désormais `rationale` (40 caractères minimum) quand le statut
vaut `not-applicable`, et l'interdit ailleurs. La raison de `rbac/react-native`,
qui vivait dans un README, est passée dans le manifest.

### 4. Le verdict d'une capability couvre la famille entière

Une capability est conforme quand ses targets `ready` prouvent leurs invariants
**et** qu'aucun runtime d'une famille servie n'est laissé de côté.

**Les trois capabilités deviennent `NON_CONFORMANT`.** Ce n'est pas une
régression : c'est le premier verdict honnête. Les preuves des targets `ready`
passent toutes ; ce qui change est que la mesure cesse d'ignorer les absents.

### 5. Les écarts connus sont déclarés, datés — et rien d'autre ne passe

`factory/quality/parity-gaps.json` liste les huit écarts actés, chacun avec sa
justification, son échéance et l'action de revue. Le gate :

- **tolère** un écart déclaré, non expiré et de portée exacte ;
- **échoue** sur un écart non déclaré, plus large que déclaré, ou expiré ;
- **échoue** sur toute preuve manquante, comme avant.

C'est le modèle éprouvé par `audit-exceptions.json` et l'allowlist de secrets :
rendre la dette visible et bornée dans le temps, pas l'excuser. Sans ce socle il
fallait choisir entre une CI rouge pendant des semaines et un gate sans dent.

Vérifié par canari dans les deux sens : écart retiré du socle → `undeclared
family-parity breach` ; échéance reculée → `declared gap expired`.

### 6. FastAPI n'est pas une exception

ADR-062 avait livré FastAPI « sans capability ni IA implicite ». Cette décision
reste vraie sur ce qu'elle décrivait — un adapter de base conforme — mais elle ne
constitue pas un état final acceptable : appartenir à la famille API impose d'en
tenir le contrat. L'écart est déclaré au même titre que ceux d'Angular et de
Flutter.

## Conséquences

### Acquis

- La mesure cesse de flatter : trois runtimes sur sept ne portent rien, et le
  rapport le dit.
- Un nouveau runtime ne pourra plus entrer dans une famille en s'exonérant par
  `unsupported`.
- `not-applicable` est vérifiable au lieu d'être déclaratif.
- La dette est datée : huit écarts, échéance au 2026-12-31.

### Assumé

- **Le titre du projet change** : de « 3/3 capabilities CONFORMANT » à « 0/3,
  huit écarts déclarés ». C'est moins flatteur et plus vrai.
- Un socle d'écarts déclarés peut devenir un tapis sous lequel balayer. Les
  échéances et le refus des écarts non déclarés sont ce qui l'empêche ; leur
  respect reste une décision humaine.

### Non revendiqué

- Aucun portage n'est réalisé. Cette décision **statue** ; l'implémentation suit,
  runtime par runtime.
- Le risque de profondeur de preuve reste entier : Flutter tient ses 25
  invariants de baseline avec 2 fichiers de test là où React Native en a 95. La
  parité exigera de lui un niveau de preuve que ce starter n'a jamais pratiqué.

## Alternatives écartées

- **Laisser ADR-070 tel quel.** Confortable — tout restait vert — mais la mesure
  ignorait précisément les runtimes qui ne servent à rien en produit.
- **Passer Angular et Flutter en `unsupported`.** Aurait aligné le discours sur
  la réalité, mais en renonçant à la cible à sept runtimes sans décision de
  produit, et sans rien régler pour FastAPI.
- **Faire échouer la CI jusqu'à implémentation.** Bloque tout travail pendant
  des semaines pour une dette déjà connue et actée.
- **Rapporter sans jamais bloquer.** Un gate qui n'échoue jamais n'est pas un
  gate ; un nouvel écart passerait inaperçu.

## Migration

Aucune sur les projets générés. `rbac/react-native` gagne un `rationale` ;
aucun autre manifest ne change.

## Tests

```bash
npm run factory:capability-conformance   # 8 écarts déclarés, exit 0
npm run factory:test                     # 468 tests
```

Verrouillé : la barre est la couverture des pairs (`files/flutter` doit
`upload`, `rbac/flutter` ne doit rien) ; `not-applicable` reste exempt grâce à sa
raison ; les trois capabilities sont `NON_CONFORMANT` ; les targets `ready`
n'ont aucune preuve manquante.

## Rollback

Révoquer le commit rétablit la parité limitée aux `ready` — et rend invisibles
les trois runtimes qui ne portent rien.
