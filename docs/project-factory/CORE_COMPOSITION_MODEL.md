# Core Composition Model

> Modele officiel d'utilisation des cores dans un projet derive.
> Statut : `SPECIFICATION_DOCUMENTAIRE`.
> Date : 2026-07-18.

## 1. Decision

Les cores Enistere ne sont pas fusionnes physiquement dans un projet derive. Ils sont composes selon
leur nature :

```txt
idee -> profil stack -> cores applicatifs -> capacites transverses -> gates -> projet independant
```

Un statut `VALIDE_V1` signifie qu'un core fournit un starter utilisable, teste et gouverne pour son
perimetre V1. Il ne signifie pas que tous les objectifs de la vision finale sont implementes.

## 2. Categories de cores

| Categorie | Elements | Mode d'utilisation dans un projet derive |
|---|---|---|
| Cores applicatifs | API NestJS/Spring, Web Next.js/Angular, Mobile RN/Flutter | un choix par canal requis ; bootstrap ou extraction gouvernee |
| Core infrastructure | Cloud Core | profil de deploiement adapte au projet ; services inutiles exclus |
| Bibliotheque UI | UI Kit | package React quand compatible ; tokens et regles visuelles pour Angular/RN/Flutter |
| Packages de contrat | `api-contracts`, `api-client-fetch` | dependances versionnees pour les profils TypeScript compatibles |
| Core qualite | Quality Core | commandes, matrices, checklists et politiques de merge ; pas de runtime applicatif |
| Core documentaire | Docs Core | structure, templates, maintenance et preuves ; pas de runtime applicatif |
| Core IA | AI Core | assistance gouvernee a l'analyse, la generation et la revue ; optionnel au runtime produit |

## 3. Modes de consommation

| Mode | Usage | Exemple |
|---|---|---|
| `PACKAGE` | dependance versionnee | UI Kit React, contrats et client Fetch |
| `BOOTSTRAP` | fichiers initiaux adaptes dans le repository derive | API, Web ou Mobile starter |
| `REFERENCE` | standard ou processus suivi sans copie runtime | Quality Core, Docs Core, ADR |
| `ADAPTER` | integration specifique au projet derriere un seam Foundation | SecureStorage, observabilite, client OpenAPI Dart |
| `DEPLOY_PROFILE` | configuration d'infrastructure composee | PostgreSQL + MinIO + reverse proxy, Redis optionnel |

Chaque composant retenu doit avoir une version Foundation ou un commit source identifiable. Les copies
silencieuses sans provenance sont interdites.

## 4. Utilite des couches transverses

### 4.1 UI Kit

Le UI Kit est pertinent s'il reduit les divergences visuelles et d'accessibilite entre canaux. Sa
consommation varie selon la plateforme :

- Next.js/React : package de composants et tokens ;
- Angular : Angular Material controle par les tokens Enistere ;
- React Native : composants natifs du core alignes sur les tokens ;
- Flutter : Material 3 controle par les tokens Enistere.

Le package React ne doit pas etre force dans Angular ou Mobile. La valeur transverse est le langage
visuel commun, pas une implementation unique universelle.

### 4.2 Docs Core

Le Docs Core est utile lorsqu'il rend le projet transmissible : functional brief, blueprint, ADR,
runbook, release plan et documentation de maintenance. Un projet derive ne copie pas toute la
documentation Foundation ; il instancie seulement les documents necessaires et conserve les liens vers
les sources Foundation.

### 4.3 Quality Core

Le Quality Core transforme les exigences en gates reproductibles. Le projet derive selectionne les gates
de son profil, ajoute ses tests metier et documente les exclusions liees a l'environnement. Il ne doit pas
faire passer artificiellement tous les gates de tous les cores.

### 4.4 AI Core

Le AI Core aide a cadrer une idee, preparer une mission, verifier un diff et produire des rapports
assainis. Il n'est pas une dependance runtime obligatoire. Un produit qui fournit une fonctionnalite IA
reelle doit prendre une decision projet distincte sur le provider, les couts, les donnees et le RAG.

### 4.5 Packages API

Les packages rendent le contrat NestJS consommable hors du monorepo pour les clients TypeScript. Ils
sont utiles aux profils NestJS + Next.js/RN et aux integrations compatibles. Ils ne sont pas la solution
universelle pour Spring, Angular ou Flutter tant que la compatibilite OpenAPI et les clients correspondants
ne sont pas prouves.

## 5. Matrice de contribution

| Besoin projet | API | Web/Mobile | UI Kit | Packages | Cloud | Quality | Docs | AI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Auth/RBAC | requis | requis si canal | tokens UI | selon profil | support | gates securite | decision | revue |
| Upload fichiers | requis | requis si parcours | composants/etats | selon profil | MinIO | tests/e2e | runbook | revue |
| Back-office | requis | Web requis | requis | selon profil | support | a11y/e2e | parcours | assistance |
| Mobile-first | requis | Mobile requis | tokens | selon profil | support | smoke device | contraintes | assistance |
| Release | selon profil | selon profil | version | version | deploiement | gates | release plan | synthese |

`requis` signifie necessaire au scenario, pas copie integrale du core.

## 6. Definition de completude

| Niveau | Signification |
|---|---|
| `VALIDE_V1` | starter utilisable sur un perimetre explicite, avec preuves et reserves acceptees |
| `PROUVE_PROJET_DERIVE` | core consomme dans un repository derive et parcours transverse valide |
| `INDUSTRIALISE` | bootstrap/versioning/migration reproductibles sur plusieurs projets |
| `CAPACITE_VF` | objectifs finaux utiles implementes et exploites ; les capacites inutiles ne sont pas imposees |

La prochaine progression des cores doit etre declenchee par un scenario ou un projet derive. Une capacite
de vision finale sans consommateur identifie reste en backlog.

## 7. Regles de gouvernance

- un projet choisit un seul API Core et au plus un core par canal client ;
- les cores non retenus ne sont ni copies ni installes ;
- toute combinaison `ADAPT` produit une preuve d'integration avant V1 ;
- Quality et Docs sont obligatoires comme capacites, mais adaptes au profil ;
- AI est obligatoire dans la chaine de gouvernance seulement si un agent est utilise ;
- le UI Kit est obligatoire comme reference visuelle, pas comme package universel ;
- les modules metier restent dans le projet derive ;
- une amelioration generique prouvee peut etre remontee vers la Foundation par PR separee.

