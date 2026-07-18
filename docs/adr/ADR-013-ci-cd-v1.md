# ADR-013 — CI/CD V1

## 1. Titre

Stratégie CI/CD V1 pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit disposer d'une stratégie CI/CD progressive pour sécuriser la fondation, les futurs starters techniques et les projets dérivés.

Cette ADR concerne :

- GitHub Actions ;
- pull requests ;
- branches protégées ;
- lint ;
- tests ;
- build ;
- sécurité ;
- release ;
- changelog ;
- versioning ;
- futurs starters API, Web, Mobile, Cloud et UI Kit ;
- gouvernance Git définie par ADR-001.

Cette ADR ne crée aucun workflow GitHub Actions réel, fichier YAML, script, package, Dockerfile, Docker Compose, dépendance ou code applicatif.

## 5. Problème

Sans stratégie CI/CD V1, la fondation risque de produire des starters incohérents ou difficiles à valider.

Les risques principaux sont :

- validation manuelle fragile ;
- pull requests non contrôlées ;
- absence de checks qualité ;
- workflows trop complexes avant existence du code réel ;
- secrets exposés dans logs ou artefacts ;
- déploiements automatiques prématurés ;
- divergence entre fondation et projets dérivés ;
- releases sans changelog ou versioning clair.

Il faut donc définir une cible V1 progressive, sans générer de workflows avant que les starters ne soient prêts.

## 6. Options étudiées

### Option A — GitHub Actions comme standard V1

Utiliser GitHub Actions pour CI, validation PR, tests, build, release et automatisations futures.

Avantages :

- cohérent avec GitHub et ADR-001 ;
- intégré aux pull requests ;
- adapté à un monorepo de fondation ;
- compatible avec GitHub Releases et GitHub Container Registry ;
- permissions et environnements protégés disponibles ;
- bonne compatibilité avec Codex / Claude Code ;
- extensible vers les projets dérivés.

Inconvénients :

- dépendance à GitHub Actions ;
- workflows à maintenir ;
- coûts potentiels si pipelines lourds ;
- risque de complexité si créé trop tôt.

### Option B — CI/CD externe dès V1

Utiliser GitLab CI, Jenkins, CircleCI, Buildkite ou autre outil externe dès le départ.

Avantages :

- outils spécialisés possibles ;
- contrôle avancé selon plateforme ;
- portabilité partielle selon fournisseur.

Inconvénients :

- complexité initiale plus élevée ;
- intégration moins directe avec GitHub ;
- onboarding plus lourd ;
- moins cohérent avec la fondation actuelle ;
- risque d'outillage prématuré.

### Option C — Aucun CI/CD en V1

Faire uniquement des validations manuelles.

Avantages :

- aucune complexité technique initiale ;
- aucun coût CI ;
- adapté aux toutes premières notes documentaires.

Inconvénients :

- non scalable ;
- erreurs humaines fréquentes ;
- qualité non reproductible ;
- pull requests moins fiables ;
- mauvais signal avant génération des starters.

### Option D — CI/CD libre par projet

Chaque core ou projet dérivé choisit librement sa stratégie CI/CD.

Avantages :

- flexibilité maximale ;
- adaptation locale rapide ;
- autonomie des projets dérivés.

Inconvénients :

- divergence forte entre projets ;
- standards qualité difficiles à vérifier ;
- prompts IA moins fiables ;
- gouvernance release incohérente ;
- duplication des pipelines.

## 7. Décision

Enistere OS Foundation retient **l'Option A — GitHub Actions comme standard V1**.

La décision officielle est :

```txt
Enistere OS Foundation adopte GitHub Actions comme solution CI/CD V1.

La CI/CD V1 doit rester progressive, modulaire et adaptée au monorepo de fondation.
Elle doit d'abord valider la qualité documentaire et les futurs starters, avant de gérer les déploiements avancés.
```

Précision V1 :

```txt
GitHub Actions est le standard CI/CD V1 de la fondation.
Les projets dérivés peuvent l'adapter, mais doivent conserver les standards qualité.
Les déploiements avancés restent hors V1 tant que les starters et ADR Cloud/Registry ne sont pas finalisés.
```

## 8. Raisons de la décision

GitHub Actions est retenu car il permet :

- cohérence avec GitHub et le monorepo hybride ;
- validation automatique des pull requests ;
- qualité progressive ;
- compatibilité avec Codex / Claude Code ;
- intégration future avec GitHub Container Registry ;
- intégration future avec GitHub Releases ;
- environnements protégés ;
- réduction des erreurs manuelles ;
- traçabilité des changements ;
- évolution vers CI/CD projet par projet.

La fondation doit privilégier des pipelines lisibles, modulaires et activés au bon moment.

## 9. Comparaison des options

| Critère | Option A GitHub Actions | Option B CI externe | Option C manuel | Option D libre par projet |
|---|---|---|---|---|
| Cohérence avec GitHub | Forte | Moyenne | Faible | Variable |
| Simplicité V1 | Bonne | Moyenne | Forte mais limitée | Variable |
| Validation PR | Forte | Moyenne | Faible | Variable |
| Sécurité secrets | Bonne si configurée | Variable | Manuelle | Variable |
| Release GitHub | Native | Indirecte | Manuelle | Variable |
| Évolutivité | Forte | Forte | Faible | Moyenne |
| Risque de divergence | Faible | Moyen | Moyen | Élevé |
| Compatibilité IA | Forte | Moyenne | Faible | Faible |

## 10. Stratégie CI V1

La CI V1 doit évoluer par étapes.

Phase actuelle documentaire :

- vérifier Markdown si outillage ajouté plus tard ;
- vérifier cohérence des ADR, changelog et structure ;
- éviter les secrets ;
- ne pas déployer.

Phase starters techniques :

- install ;
- lint ;
- typecheck ;
- tests unitaires ;
- tests d'intégration si disponibles ;
- build ;
- audit dépendances ;
- validation Docker si applicable ;
- génération d'artefacts si nécessaire.

La CI doit rester proportionnée au contenu réel du repository.

## 11. Stratégie CD V1

La CD V1 est volontairement limitée.

Principes :

- aucun déploiement automatique pendant la phase documentaire ;
- déploiement uniquement quand Deployment et projets dérivés seront prêts ;
- environnements protégés ;
- secrets CI/CD hors Git ;
- approbation humaine pour production ;
- logs de déploiement conservés ;
- rollback documenté avant production.

Les déploiements avancés, blue/green, canary et orchestration future relèvent d'ADR ultérieurs.

## 12. Niveaux de pipeline

### Niveau 0 — Documentation

- lint Markdown éventuel ;
- contrôle liens internes éventuel ;
- validation présence changelog ;
- validation ADR ;
- contrôle absence de secrets.

### Niveau 1 — Starter technique

- install ;
- lint ;
- typecheck ;
- tests unitaires ;
- tests intégration si disponibles ;
- build.

### Niveau 2 — Sécurité

- audit dépendances ;
- secret scanning ;
- dépendances vulnérables ;
- contrôle variables publiques ;
- scan Docker si applicable plus tard.

### Niveau 3 — Docker / artefacts

- build image ;
- tag image ;
- push registry selon ADR-014 ;
- validation Dockerfile ;
- validation Docker Compose si applicable.

### Niveau 4 — Release

- SemVer ;
- changelog ;
- GitHub release ;
- tag Git ;
- notes de release.

### Niveau 5 — Déploiement

- staging ;
- production ;
- environnements protégés ;
- approvals ;
- rollback ;
- logs de déploiement.

## 13. Stratégie pull requests

Les pull requests doivent devenir le point de contrôle principal.

Règles attendues :

- description claire du changement ;
- périmètre respecté ;
- changelog mis à jour si nécessaire ;
- ADR ajoutée ou mise à jour si décision structurante ;
- absence de secrets ;
- checks CI requis quand les workflows existent ;
- revue humaine pour changements sensibles ;
- résumé des tests ou vérifications.

Les PR générées avec assistance IA doivent rester relues par un humain.

## 14. Stratégie branches protégées

La branche principale doit être protégée.

Règles attendues :

- pull request obligatoire avant merge ;
- status checks requis si CI disponible ;
- protection contre push direct si possible ;
- historique lisible ;
- tags de release depuis branche stable ;
- hotfix documentés.

Les projets dérivés peuvent adapter les règles, mais doivent conserver une protection équivalente.

## 15. Stratégie tests

La stratégie tests doit être progressive.

Phase documentaire :

- vérifications de structure ;
- cohérence ADR / changelog ;
- absence de secrets ;
- liens internes si outillage disponible.

Phase starters :

- tests unitaires ;
- tests d'intégration ;
- tests auth et permissions ;
- tests upload ;
- tests UI critiques ;
- tests accessibilité si applicable ;
- tests build.

Les tests insuffisants ne doivent pas être masqués par un pipeline vert trop permissif.

## 16. Stratégie sécurité CI/CD

Exigences :

- permissions minimales des workflows ;
- secrets dans GitHub Secrets ou solution équivalente ;
- secrets masqués ;
- pas de secrets dans logs ;
- pas de secrets dans artefacts ;
- séparation dev/staging/prod ;
- environnements protégés ;
- validation humaine pour production ;
- dépendances auditées ;
- images Docker scannées si applicable ;
- tokens GitHub à portée minimale ;
- rotation des secrets si fuite suspectée.

Les workflows ne doivent pas afficher les variables sensibles ni manipuler de secrets sans nécessité.

## 17. Stratégie release

Les releases doivent être traçables.

Règles :

- SemVer comme base de versioning ;
- changelog maintenu ;
- tag Git ;
- notes de release ;
- lien vers ADR structurantes si nécessaire ;
- artefacts versionnés si générés ;
- pas de release importante sans vérifications qualité.

Pendant la phase documentaire, le changelog global reste la référence.

## 18. Stratégie environnements

Les environnements doivent être séparés.

Niveaux possibles :

- local ;
- dev ;
- staging ;
- production.

Règles :

- secrets séparés par environnement ;
- variables publiques identifiées ;
- approbation pour production ;
- environnements protégés dans GitHub si utilisés ;
- aucune confusion entre staging et production.

## 19. Stratégie rollback future

Le rollback n'est pas implémenté par cette ADR, mais doit être prévu avant production.

À cadrer plus tard :

- rollback applicatif ;
- rollback image Docker ;
- rollback migration ;
- rollback configuration ;
- health checks post-déploiement ;
- procédure runbook ;
- responsabilité humaine.

Un déploiement production sans stratégie de rollback documentée est interdit.

## 20. Conséquences positives

- Standard CI/CD clair pour V1.
- Validation PR plus fiable.
- Meilleure traçabilité des changements.
- Sécurité des secrets mieux cadrée.
- Base compatible avec GitHub Releases et GHCR futur.
- Progression adaptée à la phase documentaire puis aux starters.
- Réduction des divergences entre projets dérivés.

## 21. Conséquences négatives

- Dépendance initiale à GitHub Actions.
- Workflows à maintenir quand ils seront créés.
- Coûts CI possibles si pipelines lourds.
- Discipline nécessaire sur secrets, permissions et environnements.
- Déploiements avancés repoussés hors V1.

## 22. Risques

- CI/CD trop complexe avant code réel.
- Workflows créés trop tôt.
- Secrets exposés dans logs.
- Variables publiques mal comprises.
- Déploiement automatique sans validation humaine.
- Absence de rollback.
- Tests insuffisants mais pipeline vert.
- Divergence entre fondation et projets dérivés.
- Coût CI/CD si pipelines lourds.
- Dépendance excessive à GitHub Actions sans plan de sortie.

## 23. Alternatives rejetées

La CI/CD externe dès V1 est rejetée car elle ajoute une complexité prématurée pour la fondation actuelle.

L'absence de CI/CD en V1 est rejetée car elle rendrait les futurs starters moins fiables et moins reproductibles.

La CI/CD libre par projet est rejetée comme standard car elle créerait des divergences de qualité, de sécurité et de release.

## 24. Impact sur Git / ADR-001

ADR-001 définit un monorepo de fondation et des repositories séparés pour les projets dérivés.

ADR-013 applique cette organisation :

- CI/CD centrale pour la fondation ;
- adaptation par projet dérivé ;
- standards qualité communs ;
- releases et changelogs maintenus séparément ;
- secrets isolés par repository et environnement.

## 25. Impact sur API Core NestJS

Le futur starter API devra prévoir :

- install ;
- lint ;
- typecheck ;
- tests unitaires ;
- tests d'intégration ;
- tests auth / permissions ;
- build ;
- audit dépendances ;
- validation Docker si Docker est activé plus tard.

Aucun workflow API réel n'est créé par cette ADR.

## 26. Impact sur Web Core Next.js

Le futur starter Web devra prévoir :

- install ;
- lint ;
- typecheck ;
- tests composants ou hooks si disponibles ;
- tests routes protégées si applicables ;
- build production ;
- contrôle absence de secrets dans le bundle client ;
- validations accessibilité si outillage disponible.

Les variables `NEXT_PUBLIC_*` doivent rester publiques uniquement.

## 27. Impact sur Mobile Core React Native

Le futur starter mobile devra prévoir :

- install ;
- lint ;
- typecheck ;
- tests services, hooks et auth flow ;
- tests token storage ;
- build ou validation Expo selon stratégie ;
- contrôle absence de secrets dans `EXPO_PUBLIC_*` ;
- artefacts mobiles seulement quand la stratégie build/distribution sera cadrée.

Les builds mobiles sensibles devront protéger secrets, signing credentials et environnements.

## 28. Impact sur Deployment

Le Deployment doit rester aligné avec une CI/CD progressive.

À prévoir plus tard :

- validation Docker ;
- validation Docker Compose si applicable ;
- scan image ;
- push registry selon ADR-014 ;
- déploiement staging ;
- déploiement production protégé ;
- rollback ;
- logs de déploiement ;
- health checks.

Aucun déploiement cloud réel n'est décidé par cette ADR.

## 29. Impact sur UI Kit

Le UI Kit devra prévoir :

- lint ;
- typecheck ;
- tests composants critiques ;
- tests accessibilité si disponibles ;
- tests visuels si ADR dédiée validée ;
- build package ou documentation visuelle si applicable ;
- release SemVer ;
- changelog et notes de migration.

Les tests visuels et la documentation visuelle restent à cadrer par ADR dédiées si nécessaire.

## 30. Impact sur ADR-014 Registry images

ADR-014 reste à créer.

ADR-013 ne choisit pas encore la registry, mais impose que tout push registry futur respecte ADR-014.

Les workflows Docker devront attendre la décision sur :

- GHCR ;
- registry privé ;
- tags d'images ;
- permissions de push ;
- rétention ;
- sécurité des images.

## 31. Impact sur projets dérivés

Les projets dérivés peuvent adapter la CI/CD selon leur stack, mais doivent conserver :

- pull requests contrôlées ;
- checks qualité ;
- tests adaptés ;
- secrets hors Git ;
- changelog ;
- versioning clair ;
- déploiement production protégé ;
- documentation de leur stratégie CI/CD.

La fondation sert de référence, pas de workflow rigide universel.

## 32. Impact sur IA / Codex / Claude Code

Les agents IA doivent :

- ne pas créer de workflow réel sans mission explicite ;
- respecter le périmètre strict ;
- ne jamais manipuler de secrets réels ;
- proposer des checks proportionnés ;
- mettre à jour changelog et ADR si nécessaire ;
- signaler les risques CI/CD ;
- ne pas décider seuls une release ou un déploiement production.

L'IA assiste l'exécution, mais les décisions de release et de production restent gouvernées humainement.

## 33. Règles d'application

- Aucun secret dans Git.
- Secrets CI/CD uniquement dans GitHub Secrets ou solution équivalente.
- Pull requests protégées pour branches principales.
- CI obligatoire avant merge quand du code existera.
- Les workflows doivent rester modulaires.
- Les déploiements production doivent être protégés.
- Les releases doivent suivre SemVer.
- Le changelog doit être maintenu.
- Les erreurs CI ne doivent pas être ignorées.
- Les projets dérivés doivent documenter leur stratégie CI/CD.
- Tout push registry doit respecter ADR-014.

## 34. Conditions de révision future

Cette ADR devra être révisée si :

- GitHub Actions ne répond plus aux besoins ;
- les coûts CI deviennent trop élevés ;
- une contrainte client impose un outil CI/CD externe ;
- la registry impose une autre stratégie ;
- les déploiements avancés deviennent prioritaires ;
- l'orchestration future modifie les pipelines ;
- les exigences sécurité imposent des contrôles supplémentaires.

## 35. Conclusion

Enistere OS Foundation adopte GitHub Actions comme standard CI/CD V1.

La stratégie reste progressive : documentation d'abord, starters ensuite, sécurité et release à mesure que les cores deviennent exécutables, puis déploiement uniquement lorsque Deployment, registry et environnements protégés seront cadrés.
