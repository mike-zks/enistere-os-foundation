# Revue d'architecture — 2026-07-28

Périmètre : projet complet — moteur Factory, chaîne de conformité, overlays,
les sept starters, CLI, runtime IA, packages, déploiement, sécurité, docs.
Méthode : inspection directe (tailles, couplage, cycles, exécution des schémas),
pas de reprise des rapports existants. Les constats chiffrés sont reproduits
par les commandes citées.

## 1. Solidité architecturale

**Acquis solides.**

- Pipeline canonique unique, sans cycle d'import direct dans `factory/engine`
  (vérifié par balayage des paires d'imports croisés). Modules bornés :
  le plus gros fait 596 lignes (`capabilities.mjs`), la moyenne ~275.
- La hiérarchie de vérité (§5) est réellement pratiquée : 15 ADR structurants en
  cinq semaines, chacun adossé à des preuves exécutées, et les trois refontes de
  cette session (parité par famille, gates hermétiques, CI factory) ont chacune
  corrigé un écart entre l'affirmé et le mesuré.
- La conformité par preuves est désormais **à trois étages** : suites locales →
  évaluateur produit neutre → re-vérification dans l'application matérialisée,
  branchée sur les goldens. C'est ce triple étage qui a détecté les défauts que
  les suites locales validaient (500-au-lieu-de-403, URL après suppression,
  interblocage du pool).
- Ports/adapters propres côté runtime : `StorageService` (Minio/Fake),
  `AuditService`, registre d'adapters — le moteur ne connaît aucun framework.

## 2. Défauts de conception

**D1 — Le schéma `capability.schema.json` n'est exécuté nulle part.**
*(Refermé le 2026-07-28 par [ADR-072](../adr/ADR-072-normative-capability-schema.md).)*
`grep -rln "capability.schema.json" factory/` ne retourne rien hors le fichier
lui-même ; aucun test ne charge ajv. La validation réelle est
`validateCapabilityManifest` (à la main, dans `capabilities.mjs`). Il existe donc
**deux sources de vérité pour le même contrat**, dont une morte — violation
directe de §5, qui place les « schémas exécutables » au rang 3 : celui-ci n'est
pas exécutable. Aggravant : ADR-070 a consciencieusement mis à jour les deux,
entretenant la duplication au lieu de la voir. C'est le défaut prioritaire.

**D2 — Les preuves de conformité sont des marqueurs de contenu, pas des
exécutions.** 99 blocs `contains` lient des titres de tests à des invariants.
Deux fragilités symétriques : renommer un titre de test casse la conformité sans
qu'aucun comportement n'ait changé ; un test présent mais rouge satisfait
l'évaluateur — seuls les goldens ferment cette boucle. Le design est assumé
(ADR-068), mais le couplage titre-de-test → descripteur est une duplication non
outillée : rien ne signale un marqueur orphelin avant l'échec.

**D3 — Les codes d'erreur partagés sont dupliqués par runtime.**
`AUTH_INVALID_CREDENTIALS`, `AUTH_FORBIDDEN`, `FILE_*` sont définis
indépendamment dans les overlays NestJS et Spring ; le contrat produit ne les
porte qu'en prose. La dérive `FILES_` vs `FILE_` corrigée cette session est
exactement l'accident que cette duplication produit. La source neutre existe
(`capabilities/*/contracts/`) mais ne génère rien. Relève de la phase 11
« Polyglot Contracts » — le constat est consigné, le chantier est plus large
qu'une mission.

**D4 — Deux évaluateurs concentrés.** `platform-contract.mjs` (1014 lignes)
évalue trois familles dans un seul module ; `golden-runtime.mjs` (769 lignes)
est un script procédural qui grandit à chaque gate. Ni l'un ni l'autre n'est un
problème aujourd'hui ; les deux le deviendront au prochain runtime.

## 3. Robustesse

**Forts.** Transitions d'état conditionnelles en une requête (le perdant d'une
course est observable, jamais silencieusement annulé) ; verrous consultatifs par
propriétaire et de maintenance non bloquants ; quota prouvé sous course réelle ;
suites d'intégration sur PostgreSQL et MinIO réels ; gates mobiles hermétiques
(ADR-071).

**Faibles.**

- `MinioStorageService` : aucun retry, aucun timeout applicatif (0 occurrence).
  Un stockage lent immobilise le thread de requête pour la durée du transfert.
- `objectExists` avale toute exception en `false` sans journaliser : le choix
  fail-safe est correct pour la quarantaine, mais un stockage en panne devient
  indistinguable d'un objet absent, sans trace.
- La tenue en charge du verrou par propriétaire est **non mesurée** (dette
  déclarée dans NEXT_ACTIONS) : le test de course reste sous la taille du pool.
- Les gates non mobiles ne sont pas audités contre le principe ADR-071.

## 4. Patterns et SOLID

**Respectés.** DIP systématique côté runtimes (ports injectés, fakes de test
sans mock du framework) ; OCP réel dans la chaîne de conformité (ajouter une
capability mesurée = déposer un contrat, zéro code moteur) ; registre
d'adapters en Strategy ; overlays déclaratifs sans héritage.

**Écarts.**

- **SRP : `FileService` Spring (364 lignes) cumule sept responsabilités** —
  upload, download-url, list, metadata, delete, quarantine, restore — là où
  NestJS les répartit (`FileQuarantineService`, `FileQuotaService`,
  services de réconciliation ; 209 lignes pour le service principal). La parité
  §8.4 n'exige pas un code identique, mais Spring a suivi le découpage NestJS
  pour quota et maintenance et pas pour la quarantaine : c'est une incohérence
  de cette session, pas un héritage. Extraction simple et sans risque.
- `SecurityConfig` Spring cumule chaîne de filtres, CORS, encodeur de mots de
  passe et audit de refus — cohésion faible mais surface stable ; à surveiller,
  pas à refactorer préventivement.

## 5. Recommandations priorisées

1. **Rendre le schéma capability exécutable — ou le supprimer** (D1). Une
   vérité par contrat. Recommandation : le schéma devient normatif et exécuté
   par le test de registre ; `validateCapabilityManifest` se réduit à ce qu'un
   JSON Schema ne peut pas exprimer (références croisées, symétrie des
   conflits, parité). → prochaine mission unique.
2. **Extraire `FileQuarantineService` côté Spring** (SRP, symétrie de
   découpage) — petite, sans changement de comportement.
3. **Timeout + journalisation d'échec sur le port de stockage** (robustesse).
4. **Outiller la détection de marqueurs orphelins** (D2) — un test factory qui
   vérifie que chaque `contains` de type test correspond à un titre présent.
5. **Codes d'erreur générés depuis la source neutre** (D3) — à instruire avec
   la phase 11, pas avant.

Les points 2 et 3 peuvent accompagner une mission Files ultérieure ; le point 1
est la seule action structurante immédiate.

## 6. Starters — la disparité de profondeur intra-famille

Fichiers source / fichiers de test par starter :

```text
API     nestjs 110/13   spring 53/13   fastapi 6/2
Web     nextjs  85/46   angular 38/73
Mobile  rn     172/95   flutter 32/2
```

Les sept satisfont leur contrat v2 — c'est mesuré et vrai. Mais la **profondeur
de preuve** n'est pas homogène : Flutter tient 25 invariants avec 2 fichiers de
test là où React Native en a 95 ; FastAPI tient 28 invariants en 6 fichiers.
Ce n'est pas une violation (FastAPI n'a aucune capability, statut déclaré
`unsupported` partout ; les invariants passent), mais c'est le prochain point de
friction prévisible : le jour où une capability visera Flutter, la parité de
famille ADR-070 exigera un niveau de preuve que ce starter n'a jamais pratiqué.
Angular (73 tests pour 38 sources) montre l'inverse — plus testé que codé.

**Constat** : le contrat v2 borne le minimum, rien ne borne l'écart. À garder en
tête au moment de promouvoir `angular`/`flutter` en target de capability.

## 7. CLI (§14)

`enistere.mjs`, 426 lignes, une seule commande file, parsing des flags à la
main. Défendable par §8.2 (aucun framework CLI, zéro dépendance), et les
commandes expliquent ce qu'elles font. Limites réelles : le parsing manuel ne
signale pas un flag inconnu, et il n'existe ni mode interactif ni sortie
diagnostique structurée (`--json`) — deux exigences §14 non couvertes. Croît
linéairement ; à découper quand une commande `lifecycle` arrivera.

## 8. Runtime IA (§15)

Meilleur que présumé : l'architecture cible est partiellement réelle, pas
seulement déclarée. Providers interchangeables effectifs (`claude` et `codex`
dans `local-agent.mjs`, contrat commun), et le runtime (2 208 lignes) couvre
prompt-registry, context-builder, redaction, evaluation-harness,
execution-report, approval-flow — chacun testé dans `factory:test`. Manquent du
schéma cible : context policies formalisées et sandbox d'exécution dédiée
(l'adapter délègue la sandbox au CLI appelé). Aucune autorité interdite (§15)
n'est contournable : l'orchestration passe par approval-flow.

## 9. Sécurité (§12) — le plus grand écart déclaré/exécuté du projet

- **Exceptions d'audit npm : bien tenues.** 19 exceptions scopées et datées
  (échéances jusqu'au 2026-10-31), vérifiées par la CI — le modèle du genre.
- **Tout le reste de §12 est documentaire.** Secret scanning : aucun outil en
  CI. SBOM, signatures, provenance : des politiques dans `deployment/docs/`,
  aucune exécution. Threat model : absent.
- Le mandat dit « intégrer progressivement » — la dette est donc licite, mais
  il faut être lucide : au rythme actuel, `progressivement` signifie `jamais
  déclenché`. Un secret scanning en CI est au même rapport coût/valeur que le
  job factory qui vient d'être ajouté : une heure de travail, un angle mort
  fermé.

## 10. Documentation — l'accumulation d'audits contredit §18

125 fichiers Markdown, 52 ADR : la gouvernance documentaire est réelle et le
README des audits désigne un « audit courant ». Mais deux dérives :

- **`docs/audits/` accumule des matrices d'écarts refermés.**
  `RUNTIME_CONFORMANCE_GAP_MATRIX` (2026-07-27) affiche des « non conformes »
  alors que les 7 runtimes sont conformes ; `CAPABILITY_PARITY_GAP_MATRIX`
  (2026-07-25) décrit des cellules non conformes qui ne le sont plus. §18 :
  « ne laisse jamais deux visions actives ». Un lecteur qui tombe sur ces
  matrices sans lire l'état courant repart avec une image fausse.
- **`deployment/docs/` contient des rapports d'exécution historiques**
  (CC10/CC11 staging reports) — des archives, que §18 confie à Git.

Recommandation : marquer chaque audit refermé d'un bandeau « clos le X, voir
état courant », ou le supprimer ; déplacer les rapports d'exécution hors du
dépôt actif.

## 11. Workflows CI

Six workflows, découpage net (contrats → client → ui-kit → web → factory →
audit ; goldens en matrice de 24 compositions ; Angular/E2E/API séparés).
Le job `factory` ajouté ce jour ferme le dernier angle mort structurel de la
chaîne. Reste, hérité d'ADR-071 : seuls les gates mobiles sont audités contre
le principe d'hermétisme.

## 12. Synthèse générale

Le projet est **au-dessus de la moyenne de sa catégorie** sur ce qui compte :
une seule représentation interne, des statuts par preuves réellement exécutées,
une gouvernance ADR vivante, et une chaîne de conformité qui a démontré sa
valeur en attrapant cinq défauts réels que les suites locales validaient.

Ses risques ne sont pas là où un audit superficiel les chercherait (le moteur
est sain) mais dans les **écarts entre le déclaré et l'exécuté** : un schéma
normatif que rien n'exécute (D1), une sécurité §12 restée documentaire (§9),
des audits périmés qui contredisent l'état courant (§10), et une profondeur de
preuve non bornée entre runtimes d'une même famille (§6). Tous partagent la
même racine — l'écart déclaratif — et la même réponse : faire exécuter ce qui
est écrit, ou l'effacer.

## 13. Recommandations consolidées (ordre proposé)

1. ~~Schéma capability exécutable (D1)~~ — **fait** (ADR-072).
2. ~~Secret scanning en CI (§9)~~ — **fait** (ADR-073).
3. Clôture des audits périmés (§10) — hygiène documentaire, une PR docs.
4. `FileQuarantineService` Spring + timeout/log du port stockage (D4, §3).
5. Marqueurs orphelins outillés (D2).
6. Codes d'erreur générés (D3) et audit d'hermétisme des autres gates — phase
   ultérieure.
