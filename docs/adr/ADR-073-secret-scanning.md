# ADR-073 — Analyse de secrets bloquante

- Statut : Validé et implémenté
- Date : 2026-07-28
- Décideur : Owner Foundation
- Complète : ADR-013 et ADR-071

## Contexte

Le mandat §12 confie au projet le secret scanning, le SAST, le SBOM, les
signatures et la provenance. La revue du 2026-07-28 a établi qu'à l'exception
des exceptions d'audit npm — scopées, datées et réellement vérifiées — **tout
§12 était documentaire** : des politiques dans `deployment/docs/`, aucune
exécution.

Le secret scanning est celui dont l'absence coûte le plus vite et de façon
irréversible : un secret poussé est compromis dès la publication, et le retirer
du HEAD ne le retire pas de l'historique.

## Décision

### 1. L'analyse porte sur l'historique, pas sur le diff

`gitleaks detect --log-opts=--all` sur un checkout `fetch-depth: 0`. Un secret
retiré d'un commit ultérieur reste lisible dans les précédents ; analyser le
seul diff aurait donné une assurance fausse.

### 2. Binaire épinglé et vérifié, pas d'action tierce

Le binaire est téléchargé depuis la release amont et son SHA-256 est vérifié
avant exécution. Une action tierce dans le gate de sécurité déplacerait la
confiance vers un dépôt qu'on ne relit pas ; §12 demande précisément l'inverse.
La version et l'empreinte sont dans le workflow, donc revues comme du code.

### 3. Aucune détection n'est publiée en clair

`--redact` : une détection dans un journal CI conservé et lisible transformerait
le gate en canal de fuite. Vérifié — un canari planté est rapporté avec la
valeur `REDACTED`.

### 4. Les faux positifs sont des exceptions justifiées, jamais des désactivations

Aucune règle par défaut n'est retirée. Les exceptions vivent dans
`.gitleaks.toml` et chacune doit porter une justification et **soit** une
échéance, **soit** une revendication de permanence motivée. Le format est
appliqué par `secret-allowlist-check.mjs`, exécuté avant le scan.

Le point de conception : gitleaks accepte volontiers une exception muette. C'est
ainsi qu'un scanner devient décoratif — quelqu'un fait taire une détection, plus
personne n'y revient. Le gate refuse une entrée sans explication, une
justification trop courte pour être relue, et une échéance dépassée.

### 5. `permanent` existe, et c'est délibéré

Le modèle d'`audit-exceptions.json` impose une échéance à toute exception. Le
copier tel quel aurait imposé une revue annuelle sur des fixtures de tests de
censure — un travail récurrent qui ne prouve rien : **un test de censure doit
contenir une chaîne ressemblant à un secret, sinon il ne teste rien**. Ces cas
sont structurellement irréductibles et sont déclarés `permanent`, avec leur
raison. Une exception temporaire — un secret réel en attente de rotation — garde
son échéance, et le gate échoue quand elle est dépassée : cela se traite par la
rotation, pas par une exception qui dort.

## État mesuré

L'analyse de l'historique complet (352 commits) relève **quatre** détections,
toutes des fixtures de tests de censure et de journalisation, sous leurs chemins
actuels et historiques. Aucun secret réel n'est présent dans le dépôt.

Les artefacts de build non versionnés (`node_modules`, `.next`, `dist`,
`target`, `.venv`) sont exclus : ils ne sont jamais committés, donc jamais
exposés par le dépôt, et leur inclusion ne produirait que du bruit.

## Conséquences

### Acquis

- Un secret introduit dans une PR bloque la CI — vérifié par canari : jeton
  factice détecté, code de sortie 1 ; historique propre, code de sortie 0.
- Le premier point §12 réellement exécuté au-delà des exceptions npm.
- La discipline d'exception est testée pour elle-même (6 tests) : le gate qui
  garde les exceptions est lui-même gardé.

### Non revendiqué

- **Le reste de §12 demeure documentaire** : SAST, SBOM, signatures d'artefacts,
  provenance, licence scanning, threat modeling. Cette décision n'en couvre
  aucun et ne doit pas être lue comme « la sécurité est traitée ».
- L'analyse détecte des motifs ; elle ne vérifie pas qu'un secret détecté est
  actif, et ne remplace pas une rotation.
- Les projets **générés** n'héritent pas de ce gate : il protège la Foundation,
  pas encore les systèmes qu'elle produit.

## Alternatives écartées

- **`gitleaks-action`.** Plus court, mais déplace la confiance du gate de
  sécurité vers une action tierce, et son édition organisation exige une clé de
  licence — une dépendance opérationnelle de plus.
- **Analyse du diff seul.** Plus rapide, mais laisse l'historique — c'est-à-dire
  l'endroit exact où un secret reste exploitable.
- **`trufflehog` avec vérification active.** Vérifie qu'un secret est vivant en
  appelant les fournisseurs : sortie réseau dans un gate, et fuite potentielle
  du secret vers des tiers.
- **Copier `audit-exceptions.json` à l'identique.** Imposerait une échéance à des
  fixtures irréductibles ; la revue serait rituelle et vide.

## Tests

```bash
node factory/quality/scripts/secret-allowlist-check.mjs   # 2 exceptions conformes
npm run factory:test                                      # 465 tests
```

Canari vérifié dans les deux sens : jeton factice → code 1 et valeur `REDACTED`
au rapport ; historique réel → code 0.

## Rollback

Retirer le job `secret-scan` du workflow. La configuration et le gate
d'allowlist restent utilisables à la main.
