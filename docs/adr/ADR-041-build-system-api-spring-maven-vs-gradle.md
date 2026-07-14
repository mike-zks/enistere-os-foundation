# ADR-041 — Build system API Core Spring Boot : Maven vs Gradle

## 1. Titre

Choix du build system pour le API Core Spring Boot.

## 2. Statut

Validé.

## 3. Date

2026-07-14.

## 4. Contexte

Le API Core Spring Boot d'Enistere OS Foundation doit disposer d'un build system défini avant la
mission Spring Boot 2 (starter minimal). La mission Spring Boot 1 (`CORE_SPECIFICATION.md`,
`cores/api-spring/`) a établi la spécification documentaire complète (42 sections) et identifié
explicitement ce choix comme décision pendante bloquante avant toute génération de fichier de build
(§40 — `Build system | Maven vs Gradle | Mission Spring Boot 2`).

Le choix du build system impacte directement :

- le fichier de build racine (`pom.xml` ou `build.gradle`) ;
- la structure du projet et les commandes de base ;
- la configuration Spring Boot (parent POM BOM ou plugin Gradle) ;
- les commandes CI (`mvn verify` ou `gradle build`) ;
- les plugins de sécurité (OWASP Dependency Check) ;
- la gestion des dépendances et leur verrouillage ;
- la courbe de prise en main pour les contributeurs ;
- la cohérence avec la documentation officielle Spring Boot et Spring Security.

Cette ADR formalise le choix build system avant toute création de `pom.xml`, `build.gradle`,
dossier `src/` ou starter Java.

## 5. Problème

Sans décision build system, la mission Spring Boot 2 risque d'introduire des conventions
incohérentes ou de provoquer un changement de build tool coûteux après les premières missions :

- commandes CI divergentes entre les premiers starters ;
- configuration Spring Boot Parent BOM vs plugin Gradle incompatibles à changer tardivement ;
- documentation officielle et exemples Spring Boot référencent majoritairement Maven ;
- certaines configurations Gradle DSL (Groovy vs Kotlin) introduisent des choix supplémentaires ;
- les contributeurs peu familiers avec Gradle DSL introduisent des erreurs silencieuses ;
- OWASP Dependency Check et les audits de sécurité sont plus documentés pour Maven dans le
  contexte Spring Boot.

Il faut choisir une solution claire pour V1, sans chercher à supporter les deux outils en parallèle
dans la fondation.

## 6. Options étudiées

### Option A — Maven comme build system principal

Utiliser Apache Maven avec `pom.xml`, Spring Boot Parent POM et le plugin Spring Boot Maven.

Avantages :

- default de Spring Initializr — le standard de facto Spring Boot ;
- Spring Boot Parent POM comme BOM : gestion de versions centralisée, sans redondance ;
- commande CI canonique `mvn verify` (unit + intégration + validate en un appel) ;
- XML verbose mais déterministe — pas de DSL Groovy/Kotlin à maîtriser ;
- documentation Spring Boot, Spring Security et Spring Data utilise Maven en priorité ;
- OWASP Dependency Check plugin Maven = bien documenté, commande `mvn verify -P security` ;
- Maven Wrapper (`mvnw`) inclus par Spring Initializr — reproducible sans installation locale ;
- lockfile via `pom.xml` explicite (versions et BOM) et Maven Enforcer Plugin si nécessaire ;
- GitHub Actions — la majorité des exemples officiels Java utilisent `mvn` ;
- `mvn dependency:tree`, `mvn versions:display-dependency-updates` — outils d'audit standards ;
- compatibilité longue durée : Maven est stable depuis 20 ans, API très peu changeante.

Inconvénients :

- XML verbeux — certaines tâches avancées nécessitent plus de configuration ;
- builds incrémentaux moins performants que Gradle sans configuration spécifique ;
- moins flexible pour les projets multi-modules complexes ;
- pas nativement orienté scripts Kotlin.

### Option B — Gradle comme build system principal

Utiliser Gradle avec `build.gradle` (Kotlin DSL recommandé) et le plugin Spring Boot Gradle.

Avantages :

- build scripts plus courts et expressifs en Kotlin DSL ;
- builds incrémentaux natifs et cache de build (plus rapide sur gros projets) ;
- très flexible — possible de tout configurer par programmation ;
- écosystème Android Kotlin utilise Gradle comme standard ;
- Spring AI et certains projets Spring récents utilisent Gradle ;
- meilleur support des builds multi-projets complexes.

Inconvénients :

- deux DSL possibles (Groovy et Kotlin) — choix supplémentaire non décidé dans cette ADR ;
- courbe d'apprentissage plus élevée pour les contributeurs non-Android/Kotlin ;
- moins d'exemples Spring Boot officiels en Gradle ;
- comportements parfois surprenants (task graph, lazy configuration) ;
- lockfile nécessite une configuration explicite (`dependencyLocking`) moins naturelle que Maven ;
- les problèmes de build Gradle sont souvent moins bien documentés que Maven dans les issues
  Spring Boot ;
- OWASP Dependency Check fonctionne mais demande plus de configuration Gradle spécifique.

### Option C — Support des deux outils

Fournir à la fois `pom.xml` et `build.gradle` dans le starter, laissant le choix aux projets.

Avantages :

- flexibilité maximale ;
- projets dérivés peuvent choisir.

Inconvénients :

- complexité double depuis V1 ;
- documentation, CI et conventions à maintenir en double ;
- risque d'incohérences entre les deux configurations ;
- chaque mise à jour de dépendance doit être synchronisée en double ;
- contraire à la stratégie de dépendances Enistere : `06_DEPENDENCY_STRATEGY.md §5.4` (pas de
  doublon fonctionnel pour le même rôle sans justification).

## 7. Décision

Enistere OS Foundation retient **l'Option A — Maven comme build system principal** pour API Core
Spring Boot V1.

La décision officielle est :

```txt
Enistere OS Foundation adopte Maven comme build system principal pour API Core Spring Boot V1.
```

Précisions obligatoires :

```txt
Maven est le standard API Core Spring Boot V1.
Gradle peut être utilisé par exception dans un projet dérivé si le besoin est justifié et documenté.
La fondation ne doit pas maintenir les deux outils en parallèle dans V1.
Le fichier de build Spring Boot 2 est pom.xml avec Spring Boot Parent POM.
```

Cette ADR ne crée aucun `pom.xml`, structure `src/` ou dépendance Java.

## 8. Raisons de la décision

Maven est retenu pour V1 principalement pour :

- alignement avec le standard Spring Boot (Spring Initializr, documentation officielle) ;
- `mvn verify` comme commande CI canonique — aucune ambiguïté ;
- Spring Boot Parent POM BOM — gestion de versions centralisée sans configuration manuelle ;
- Maven Wrapper (`mvnw`) — reproductibilité sans installation locale pour les contributeurs ;
- `pom.xml` déterministe — pas de DSL supplémentaire à maîtriser au-delà du XML ;
- meilleure couverture documentation Spring Security, Spring Data JPA, Flyway ;
- OWASP Dependency Check — plugin Maven bien documenté pour les audits de sécurité CI ;
- cohérence avec `strategy/06_DEPENDENCY_STRATEGY.md §5.2` — préférer les standards de
  l'écosystème.

Cette stratégie réduit la complexité du starter Spring Boot et rend les conventions backend plus
faciles à documenter, relire, et réutiliser pour les contributeurs et les agents IA.

## 9. Comparaison Maven vs Gradle

| Critère | Maven | Gradle |
|---|---|---|
| Standard Spring Boot | Default Spring Initializr, doc officielle | Supporté, moins prioritaire dans les exemples |
| Configuration BOM | Spring Boot Parent POM natif | Plugin Gradle, platform() |
| Commande CI | `mvn verify` canonique | `gradle build` ou `gradle check` |
| DSL | XML — verbeux mais déterministe | Groovy/Kotlin DSL — expressif mais avec courbe |
| Reproductibilité | Maven Wrapper inclus | Gradle Wrapper disponible |
| Lockfile | pom.xml + Enforcer Plugin | dependencyLocking (configuration explicite) |
| OWASP audit | Plugin bien documenté Maven | Plugin disponible, moins couvert |
| Performances | Correctes pour V1 | Meilleure incrémentalité sur projets larges |
| Multi-modules | Supporté, configuration XML | Natif et plus flexible |
| Documentation Spring | Prioritaire | Secondaire |
| Courbe contributeur | Faible (XML connu) | Moyenne (Kotlin/Groovy DSL) |
| GitHub Actions Java | Majorité exemples Maven | Exemples moins nombreux |
| Flexibilité avancée | Limitée (XML) | Élevée (script) |
| Stabilité API | Très stable (20 ans) | Changements plus fréquents |

Maven est moins flexible mais plus prévisible. Pour un starter de fondation générique à destination
de contributeurs variés, la prévisibilité prime sur la flexibilité.

## 10. Conséquences positives

- La mission Spring Boot 2 peut créer `pom.xml` sans ambiguïté.
- Le build CI `mvn verify` est défini avant l'implémentation.
- La documentation Spring Boot officielle est directement réutilisable.
- Les contributeurs n'ont pas besoin de maîtriser Gradle DSL.
- OWASP Dependency Check peut être configuré de façon standard.
- Les projets dérivés démarrent d'un socle Maven cohérent.
- Les agents IA ont un contexte déterministe pour générer ou relire la configuration de build.

## 11. Conséquences négatives

- La fondation accepte Maven comme standard unique pour V1.
- Les builds incrémentaux seront moins performants que Gradle sur de gros projets.
- Les projets ayant une expertise Gradle devront justifier une exception.
- Certaines tâches de build avancées nécessiteront plus de configuration XML.

## 12. Risques

- La verbosité de `pom.xml` peut décourager certains contributeurs Kotlin-first.
- Maven Enforcer Plugin doit être configuré si un lockfile strict est requis.
- Les dépendances Gradle Kotlin DSL sont plus naturelles pour certains stacks JVM modernes.
- Une migration future vers Gradle resterait possible mais coûteuse.
- Les projets dérivés avec Gradle non documentés peuvent créer des incohérences.

## 13. Alternatives rejetées

### Option B rejetée comme standard principal V1

Gradle est plus flexible et performant, mais sa courbe d'apprentissage, son DSL (Groovy/Kotlin)
et la moindre couverture des exemples Spring Boot officiels le rendent moins adapté au standard V1
de la fondation. Gradle reste autorisé par exception documentée dans un projet dérivé.

### Option C rejetée

Supporter Maven et Gradle en parallèle est contraire à la stratégie de dépendances Enistere
(`06_DEPENDENCY_STRATEGY.md §5.4` — pas de doublon fonctionnel) et doublerait la complexité de
maintenance dès V1.

## 14. Impact sur Spring Boot 2 — Starter minimal

La mission Spring Boot 2 devra prévoir :

- `pom.xml` avec `spring-boot-starter-parent` comme parent BOM ;
- plugin Spring Boot Maven (`spring-boot-maven-plugin`) pour le build et le packaging ;
- Maven Wrapper (`mvnw`, `.mvn/wrapper/`) inclus pour la reproductibilité ;
- commandes standard : `mvn spring-boot:run`, `mvn test`, `mvn verify`, `mvn package` ;
- séparation `src/main/java`, `src/main/resources`, `src/test/java` ;
- conventions de nommage Maven (`groupId: com.enistere`, `artifactId: api-spring-core`).

## 15. Impact sur CI Java

La mission Spring Boot 5 (Tests + CI) devra prévoir :

- GitHub Actions avec `mvn verify` comme commande principale ;
- OWASP Dependency Check via plugin Maven (`mvn verify -Powasp`) si scope security ;
- cache Maven (`.m2/repository`) dans GitHub Actions pour la performance ;
- commande `mvn dependency:tree` pour l'audit de dépendances.

## 16. Impact sur la stratégie de dépendances

- `pom.xml` gère les versions via Spring Boot Parent POM BOM ;
- les dépendances gérées par le BOM n'ont pas besoin de version explicite ;
- les dépendances hors BOM doivent avoir une version explicite et documentée ;
- `strategy/06_DEPENDENCY_STRATEGY.md §12.2` : `pom.xml` est le lockfile Maven V1 ;
- les mises à jour de version passent par `mvn versions:display-dependency-updates`.

## 17. Impact sur les projets dérivés

Les projets dérivés utilisant le API Core Spring Boot devront considérer Maven comme standard.

Ils pourront demander une exception Gradle uniquement si :

- le besoin est documenté (expertise équipe, intégration Android, build avancé) ;
- les impacts sur CI, documentation et maintenance sont assumés ;
- l'écart est indiqué dans leur documentation projet ;
- la fondation n'est pas obligée de maintenir les deux outils.

## 18. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de la génération ou revue de l'API Core Spring Boot.

Ils doivent :

- utiliser Maven comme outil de build V1 ;
- générer `pom.xml` avec Spring Boot Parent POM comme parent ;
- ne pas générer `build.gradle` sans exception documentée ;
- ne pas créer de `pom.xml` ou `build.gradle` hors mission explicite Spring Boot 2 ;
- signaler toute dépendance hors BOM sans version explicite ;
- utiliser `mvn verify` dans les commandes CI.

## 19. Règles d'application

- Maven devient le standard V1 du API Core Spring Boot.
- Le fichier de build est `pom.xml` avec Spring Boot Parent POM.
- Maven Wrapper (`mvnw`) doit être inclus pour la reproductibilité.
- `mvn verify` est la commande CI principale.
- Les versions gérées par le BOM Parent POM n'ont pas besoin de version explicite.
- Les dépendances hors BOM ont une version explicite et documentée.
- Gradle n'est utilisé que par exception documentée dans un projet dérivé.
- La fondation ne maintient pas Maven et Gradle en parallèle dans V1.
- Toute dépendance Java ajoutée respecte `strategy/06_DEPENDENCY_STRATEGY.md`.

## 20. Conditions de révision future

Cette décision pourra être revue si :

- la fondation adopte une architecture multi-modules nécessitant Gradle composite builds ;
- Maven ne répond plus aux besoins de build d'un projet dérivé majoritaire ;
- une migration vers Kotlin natif rend Gradle Kotlin DSL plus naturel ;
- la communauté Spring Boot oriente ses exemples et outils principalement vers Gradle.

Toute révision devra être documentée par une nouvelle ADR ou par une mise à jour formelle
de celle-ci.

## 21. Conclusion

Enistere OS Foundation adopte Maven comme build system principal du API Core Spring Boot V1.

Gradle reste une alternative mature autorisée uniquement par exception documentée dans un projet
dérivé. La fondation ne supportera pas les deux outils en parallèle dans V1 afin de préserver la
simplicité, la cohérence, la maintenabilité et l'alignement avec la documentation Spring Boot
officielle.
