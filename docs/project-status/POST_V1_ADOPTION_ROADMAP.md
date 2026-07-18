# Post-V1 Adoption Roadmap

> Decision de pilotage du 2026-07-18.
> Cette roadmap complete `strategy/04_ROADMAP_GLOBAL.md` sans reecrire l'historique V0/V1/V2/V3.

## 1. Constat

Les principaux cores applicatifs et transverses ont atteint `VALIDE_V1`. Ils sont testes separement et
plusieurs integrations existent dans le monorepo. La vision finale n'est toutefois pas atteinte :

- un core V1 est un starter, pas un produit complet ;
- aucune composition n'est encore prouvee dans un vrai repository derive ;
- Project Factory fournit un processus, une matrice et des templates, mais pas de bootstrap ;
- les metriques de productivite et d'adoption ne sont pas encore disponibles ;
- certaines compatibilites croisees et distributions restent a prouver.

## 2. Decision

La priorite passe de l'expansion horizontale des cores a la validation de leur composition. Toute nouvelle
capacite majeure d'un core doit desormais etre rattachee a un scenario, un projet derive, un risque ou une
obligation de maintenance.

## 3. Phases post-V1

| Phase | Objectif | Sortie obligatoire |
|---|---|---|
| A1 — Composition | definir comment chaque core contribue | modele + scenarios de reference |
| A2 — Exemple derive | instancier un profil direct sans metier complexe | squelette documentaire et bootstrap reproductible |
| A3 — Profil direct executable | executer auth/files/gates hors monorepo | preuve runtime et rapport d'ecarts |
| A4 — Pilote omnicanal | utiliser API + Web + Mobile + Cloud | projet pilote independant en staging |
| I1 — Industrialisation | reduire les operations manuelles prouvees | CLI/bootstrap minimal versionne |
| I2 — Distribution | stabiliser la consommation externe | registry/packages/version compatibility |
| M — Maintenance | securite, versions, migrations | revues periodiques et guides de migration |

## 4. Ordre recommande

1. Project Factory 3 — modele de composition et scenarios d'usage ;
2. Project Factory 4 — premier squelette derive `nestjs-next` ;
3. Project Factory 5 — bootstrap executable `nestjs-next` hors monorepo ;
4. Project Factory 6 — profil API + mobile `nestjs-react-native` ou `spring-flutter` ;
5. Project Pilot 1 — selection d'une idee reelle et functional brief ;
6. Project Pilot 2 — blueprint, repository independant et staging ;
7. Project Factory CLI 1 — automatiser uniquement les etapes manuelles mesurees ;
8. Distribution 2 — registry et politique de compatibilite si le pilote le justifie.

## 5. Criteres de passage

### De A1 a A2

- roles des cores explicites ;
- scenarios et preuves attendues documentes ;
- profil direct selectionne ;
- aucune ambiguite entre package, bootstrap, reference et adapter.

### De A2 a A3

- documents Project Factory instancies ;
- provenance Foundation immuable ;
- structure exportable ;
- commandes de demarrage et gates definies.

### De A3 au pilote

- installation hors monorepo ;
- auth et fichiers prouves ;
- gates du profil verts ;
- ecarts mesures ;
- staging local ou distant reproductible.

### Du pilote au generateur

- au moins deux bootstraps executes ;
- operations repetitives identifiees ;
- parametres stables ;
- strategie de mise a jour et rollback definie.

## 6. Ce qui reste futur

| Capacite | Declencheur |
|---|---|
| UI Kit multi-framework plus riche | besoin UI recurrent dans au moins deux projets |
| client Dart genere | friction Dio/OpenAPI mesuree sur le profil Flutter |
| compatibilite Spring -> client TS | profil Spring + Next/RN selectionne |
| SDK analytics/crash reel | politique privacy, couts et backend approuves |
| RAG/provider IA reel | corpus, donnees, couts et evaluation approuves |
| Cloud monitoring complet | pilote ou production ayant des SLO explicites |
| offline sync/push/maps/payment | besoin produit reel et ADR projet |

## 7. Indicateurs de controle

- un seul chantier Project Factory actif a la fois ;
- chaque mission cite un scenario ou un risque ;
- aucun statut ne progresse sans preuve ;
- temps de bootstrap et adaptations mesures ;
- documents de statut compacts, historique deplace vers les rapports ;
- branches fusionnees nettoyees apres verification dediee ;
- revue mensuelle dependances/securite et trimestrielle frameworks.

## 8. Prochaine action unique

**Project Factory 4 — premier squelette derive `nestjs-next`.**

Le squelette doit instancier les documents Project Factory et definir la structure exportable, sans encore
copier un runtime complet. Le choix `nestjs-next` minimise les adaptations et prouve en premier la chaine
packages/BFF/UI Kit deja la mieux integree.

