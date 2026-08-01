# Autorisation des opérations de sécurité réalisées par les agents IA

Politique opérationnelle subordonnée à [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md). Elle borne le
périmètre des travaux de sécurité réalisés par Codex, Claude Code ou tout autre agent IA. Elle ne définit
pas l'architecture ni les contrôles du système, qui restent décrits par
[`SECURITY_ARCHITECTURE.md`](../architecture/SECURITY_ARCHITECTURE.md).

Cette politique fournit un contexte d'autorisation au sein du projet. Elle ne remplace ni une approbation
requise par mission, ni les politiques et protections d'un fournisseur d'IA, ni l'autorisation explicite
du propriétaire d'un système tiers.

## Ownership and authorization

Le mainteneur déclare contrôler Enistere OS Foundation et autorise, à des fins défensives, les analyses
portant sur :

- le dépôt Enistere OS Foundation et son historique Git ;
- ses dépendances et sa chaîne d'approvisionnement logicielle ;
- les applications générées à partir du projet ;
- les conteneurs créés localement pour les tests ;
- les services locaux ;
- les environnements de développement et de test explicitement déclarés comme contrôlés par le
  mainteneur ;
- les infrastructures explicitement identifiées comme appartenant au périmètre du projet et autorisées
  pour la mission concernée.

Une cible externe n'entre jamais dans ce périmètre par simple déduction. Lorsqu'un doute existe sur le
contrôle d'une cible ou sur l'étendue de l'autorisation, l'agent s'arrête et demande une confirmation.

## Defensive purposes

Les activités autorisées dans ce périmètre comprennent notamment :

- secure code review ;
- SAST et analyse de dépendances ;
- détection de secrets et sécurité de la chaîne d'approvisionnement ;
- threat modeling ;
- revue de l'authentification et de l'autorisation ;
- tests de sécurité des API ;
- revue de configuration et identification de vulnérabilités ;
- validation contrôlée d'une vulnérabilité ;
- création de tests de régression sécurité ;
- remédiation et vérification après remédiation.

Ces activités restent soumises au moindre privilège, aux limites d'outils, aux approbations et à la
traçabilité définis par le mandat et la gouvernance IA.

## Safe validation

Lorsqu'une vulnérabilité doit être confirmée, l'agent :

1. privilégie l'analyse statique ;
2. utilise ensuite les tests existants ou des tests automatisés ;
3. ne crée une reproduction minimale que si les preuves précédentes sont insuffisantes ;
4. limite cette reproduction aux environnements contrôlés et utilise des données synthétiques ;
5. évite les opérations destructives, borne les ressources et préserve les preuves nécessaires ;
6. s'arrête dès que les éléments disponibles suffisent à caractériser le défaut.

Toute action irréversible, destructive, de production ou élargissant le périmètre exige l'approbation
explicite prévue par le mandat ; cette politique ne la fournit pas par avance.

## Explicit exclusions

Cette autorisation ne couvre jamais implicitement :

- la reconnaissance de systèmes tiers ou le scanning Internet non sollicité ;
- les comptes, dépôts, services ou infrastructures de tiers ;
- la collecte de credentials ;
- le phishing ;
- l'établissement de persistence ;
- l'exfiltration ;
- les attaques destructives ;
- toute cible pour laquelle aucune autorisation explicite et vérifiable n'est disponible.

Le simple fait qu'une URL, une adresse IP, un domaine, un dépôt ou un service soit public, accessible ou
mentionné dans le projet ne constitue pas une autorisation de test. Les interactions réseau ordinaires
nécessaires à l'installation de dépendances ou à la consultation de documentation ne valent pas
autorisation d'effectuer des tests de sécurité sur les services contactés.

## Séparation des responsabilités documentaires

- [`SECURITY_ARCHITECTURE.md`](../architecture/SECURITY_ARCHITECTURE.md) définit l'architecture et les
  contrôles de sécurité du système ;
- le présent document définit le périmètre et les règles d'autorisation des opérations de sécurité des
  agents ;
- [`AGENTS.md`](../../AGENTS.md) est seulement l'instruction d'entrée qui renvoie vers ces sources.

## Non revendiqué

- Cette politique n'affirme pas qu'une instruction versionnée peut contourner les règles d'un fournisseur
  d'IA ou d'une plateforme d'exécution.
- Elle ne constitue pas une autorisation générale de pentest, de bug bounty ou de test d'Internet.
- Elle ne prouve pas à elle seule la propriété juridique d'une infrastructure externe : le périmètre doit
  être déclaré explicitement pour la mission concernée.
