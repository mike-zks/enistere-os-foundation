# Revue d'architecture — 2026-07-28

Périmètre : moteur Factory, chaîne de conformité, overlays Auth/RBAC/Files.
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
