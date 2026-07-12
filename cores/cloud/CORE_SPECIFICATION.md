# Cloud Core — Spécification du Core

## 1. Résumé exécutif

Le **Cloud Core** définit le socle d'infrastructure standardisé d'Enistere OS Foundation.

Il doit fournir une base claire, sécurisée, documentée et réutilisable pour déployer et exploiter les futurs projets Enistere : APIs, plateformes web, applications mobiles, SaaS, marketplaces, plateformes immobilières, services IA et applications métier.

Cette spécification est documentaire. Elle ne crée pas de Docker Compose, script shell, fichier Traefik, configuration Prometheus/Grafana, code applicatif, dépendance ou fichier d'infrastructure réel.

## 2. Rôle du core

Le rôle du Cloud Core est de cadrer l'infrastructure commune utilisée par les projets dérivés.

Il doit :

- standardiser les services cloud de base ;
- réduire la duplication des configurations serveur ;
- fournir un modèle de déploiement local et serveur simple ;
- sécuriser les services persistants ;
- préparer l'intégration API, web, mobile, IA et qualité ;
- cadrer les backups, restores, logs, monitoring et health checks ;
- permettre une montée progressive vers une infrastructure production-ready.

## 3. Objectifs du Cloud Core

- Fournir une base infrastructure cohérente pour tous les projets Enistere.
- Définir une stratégie Docker et Docker Compose standardisée.
- Encadrer Traefik, DNS, SSL/TLS et exposition publique.
- Standardiser PostgreSQL, Redis et MinIO.
- Prévoir PostGIS et OSRM pour les besoins cartographiques.
- Prévoir monitoring, logs, backups et restores.
- Définir les exigences minimales de sécurité serveur.
- Préparer CI/CD et registry sans imposer prématurément une implémentation.
- Maîtriser les coûts en privilégiant des services self-hosted lorsque c'est pertinent.
- Rester générique, sans logique métier spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

## 4. Problèmes à résoudre

Le Cloud Core doit éviter :

- des configurations Docker divergentes entre projets ;
- des services exposés publiquement sans contrôle ;
- PostgreSQL, Redis, MinIO ou OSRM accessibles depuis Internet ;
- des secrets présents dans Git ;
- des backups absents ou non testés ;
- des restores impossibles à vérifier ;
- des ports ouverts inutilement ;
- une dépendance excessive aux services payants externes ;
- des logs contenant des secrets ;
- des dashboards non protégés ;
- des environnements local, staging et production incohérents.

## 5. Périmètre fonctionnel

Le Cloud Core couvre :

- Docker ;
- Docker Compose ;
- Traefik ;
- DNS et domaines ;
- SSL/TLS ;
- PostgreSQL ;
- PostGIS ;
- Redis ;
- MinIO/S3 compatible ;
- OSRM ;
- réseaux Docker ;
- volumes persistants ;
- variables d'environnement documentées ;
- health checks ;
- backups et restores ;
- logs ;
- monitoring ;
- secrets ;
- firewall et accès serveur ;
- CI/CD ;
- registry ;
- environnements ;
- déploiement ;
- maintenance ;
- maîtrise des coûts ;
- intégrations avec les autres cores.

## 6. Hors périmètre

Le Cloud Core ne doit pas contenir :

- logique métier projet ;
- code applicatif ;
- Docker Compose réel dans cette mission ;
- script shell réel dans cette mission ;
- fichier Traefik réel dans cette mission ;
- fichier Prometheus, Grafana ou Loki réel dans cette mission ;
- secrets ou credentials réels ;
- configuration production propre à un client ;
- choix définitif de services avancés sans validation ou ADR si nécessaire ;
- stratégie cloud propriétaire imposée à tous les projets.

## 7. Architecture cible

L'architecture cible repose sur une approche progressive :

- local contrôlé pour développement ;
- serveur simple sécurisé pour premières mises en production ;
- CI/CD et backups stabilisés ;
- monitoring avancé et services cartographiques ;
- production-ready avec observabilité, restore testé et gouvernance.

Principes :

- exposition publique uniquement via Traefik ;
- services persistants non publics ;
- réseaux Docker séparés ;
- volumes persistants documentés ;
- secrets hors Git ;
- health checks systématiques ;
- backup obligatoire pour les données persistantes ;
- restore testable ;
- logs sans secrets ;
- services avancés activables selon projet.

## 8. Structure cible du futur Cloud Core

Structure indicative du futur core :

```txt
cores/cloud/
├── README.md
├── CORE_SPECIFICATION.md
├── ARCHITECTURE.md
├── INSTALLATION.md
├── USAGE.md
├── TESTING.md
├── SECURITY.md
├── DEPENDENCIES.md
├── ROADMAP.md
├── CHANGELOG.md
├── docs/
├── examples/
├── templates/
├── compose/
├── traefik/
├── monitoring/
├── backups/
├── scripts/
└── runbooks/
```

Cette structure est cible. Elle ne doit pas être créée pendant cette mission.

## 9. Services obligatoires

Le Cloud Core doit prévoir au minimum :

- Docker ;
- Docker Compose ;
- Traefik ;
- PostgreSQL ;
- Redis ;
- MinIO ;
- réseaux Docker ;
- volumes persistants ;
- variables d'environnement documentées ;
- scripts setup futurs ;
- health checks ;
- stratégie backup minimale ;
- sécurité serveur minimale.

## 10. Services optionnels

Ces services doivent être activables selon les besoins projet :

- PostGIS ;
- OSRM ;
- Prometheus ;
- Grafana ;
- Loki ;
- Alertmanager ;
- registry privé ;
- CI/CD avancé ;
- sauvegardes externalisées ;
- restore automatisé ;
- monitoring avancé ;
- firewall hardening ;
- Fail2Ban ;
- staging environment ;
- blue/green deployment plus tard.
- canary deployment plus tard ;
- orchestration future.

Les services optionnels ne doivent pas être activés par défaut sans justification.

## 11. Services futurs

Les services futurs peuvent inclure :

- secrets manager dédié ;
- gestion multi-serveur ;
- orchestration avancée ;
- service mesh si besoin réel ;
- autoscaling ;
- tracing distribué ;
- sauvegardes chiffrées externalisées multi-région ;
- déploiements canary ;
- infrastructure as code complète.

Ces choix nécessiteront une validation de roadmap et, selon l'impact, un ADR.

## 12. Standards infrastructure

Le Cloud Core doit standardiser :

- nommage des services ;
- nommage des réseaux ;
- nommage des volumes ;
- conventions de variables d'environnement ;
- exposition des ports ;
- séparation local, staging, production ;
- health checks ;
- logs ;
- backups ;
- documentation ;
- runbooks ;
- revues sécurité.

Les configurations doivent rester lisibles, reproductibles et auditables.

## 13. Standards sécurité serveur

Le Cloud Core doit appliquer :

- SSH par clé ;
- désactivation du root login si possible ;
- firewall actif ;
- ports publics limités à 80, 443 et SSH contrôlé ;
- PostgreSQL non public ;
- Redis non public ;
- OSRM non public direct ;
- Traefik dashboard protégé ;
- Grafana protégé ;
- MinIO sécurisé ;
- secrets hors Git ;
- volumes persistants documentés ;
- backups obligatoires pour données persistantes ;
- logs sans secrets.

## 14. Stratégie Docker

Docker doit être utilisé comme base d'exécution standardisée.

Règles :

- éviter les images `latest` en production ;
- privilégier des tags explicites ;
- documenter les images utilisées ;
- limiter les privilèges des conteneurs ;
- éviter les ports publics inutiles ;
- séparer configuration, données et logs ;
- documenter les volumes persistants ;
- prévoir une stratégie de mise à jour.

## 15. Stratégie Docker Compose

Docker Compose doit servir à :

- lancer un environnement local contrôlé ;
- fournir une base serveur simple ;
- documenter les services nécessaires ;
- faciliter les tests d'intégration ;
- préparer la future CI/CD.

La stratégie Compose doit prévoir :

- fichiers ou profils par environnement à terme ;
- réseaux internes ;
- volumes nommés ;
- health checks ;
- variables d'environnement ;
- absence de secrets réels ;
- validation par `docker compose config`.

Aucun fichier Compose n'est créé dans cette mission.

## 16. Stratégie reverse proxy Traefik

Traefik doit être le reverse proxy standard.

Il doit gérer :

- routage HTTP/HTTPS ;
- certificats TLS ;
- redirection HTTP vers HTTPS ;
- middlewares et headers de sécurité si applicable ;
- séparation services publics et internes ;
- séparation local, staging et production ;
- dashboard protégé ;
- intégration future avec CI/CD.

Tout service public doit passer par Traefik, sauf exception documentée et validée.

## 17. Stratégie DNS et domaines

La stratégie DNS doit prévoir :

- domaines par projet ;
- sous-domaines par service public ;
- séparation local, staging et production ;
- provider DNS documenté, par exemple Cloudflare ou alternative validée ;
- documentation des enregistrements DNS ;
- validation avant exposition publique ;
- TTL adaptés aux changements de déploiement.

Les services internes ne doivent pas dépendre d'une exposition DNS publique.

## 18. Stratégie SSL/TLS

SSL/TLS doit être activé pour tout service public en production.

La stratégie doit prévoir :

- certificats gérés par Traefik lorsque possible ;
- renouvellement automatique ;
- redirection HTTP vers HTTPS ;
- vérification des certificats ;
- protection des dashboards ;
- documentation des limites en local.

## 19. Stratégie PostgreSQL

PostgreSQL est le service de base de données relationnelle principal.

Règles :

- non exposé publiquement ;
- accès via réseau Docker interne ;
- credentials hors Git ;
- volumes persistants ;
- backups obligatoires ;
- restore testable ;
- monitoring de disponibilité ;
- séparation databases/users selon projet si nécessaire ;
- utilisateur applicatif dédié ;
- interdiction d'utiliser un superuser pour l'application ;
- migrations pilotées par les cores applicatifs.

## 20. Stratégie PostGIS

PostGIS doit être prévu pour les projets nécessitant des données géographiques.

Règles :

- activable selon projet ;
- non imposé par défaut ;
- lié à PostgreSQL ;
- utilisé pour requêtes géospatiales ;
- documenté avec impacts performance et stockage ;
- soumis à ADR si son adoption devient structurante pour un projet ou un core.

## 21. Stratégie Redis

Redis est une capacité **post-V1 / V2** pour le socle Cloud standard.

Decision CC12 (2026-07-12) : Redis n'est pas requis pour declarer Cloud Core V1 valide. API Core V1 est
`VALIDE_V1` sans Redis et classe Redis distribue en P2 post-V1. Redis sera livre quand un besoin concret de
cache distribue, throttling multi-instance, session partagee ou queue le justifiera.

Redis doit alors être prévu pour :

- cache ;
- rate limiting ;
- sessions ou tokens si stratégie validée ;
- queues ;
- verrous courts ;
- coordination applicative.

Règles :

- non exposé publiquement ;
- réseau Docker interne ;
- mot de passe si pertinent ;
- persistance selon usage ;
- séparation des usages cache, queue ou sessions si le besoin devient avancé ;
- monitoring disponibilité ;
- documentation des risques de perte de données selon configuration.

## 22. Stratégie MinIO/S3 compatible

MinIO doit fournir un stockage objet compatible S3.

Règles :

- console protégée ;
- buckets privés par défaut ;
- accès via credentials hors Git ;
- policies documentées ;
- volumes persistants ;
- backups selon criticité ;
- URLs signées si nécessaire ;
- migration possible vers provider S3 compatible.

## 23. Stratégie OSRM

OSRM doit être un service interne par défaut.

Règles :

- ne pas exposer OSRM publiquement sans justification ;
- consommer OSRM via une API Routing Service ;
- utiliser des données OpenStreetMap ;
- documenter la préparation, l'import et le stockage des données OSM ;
- prévoir une stratégie de mise à jour des données ;
- prévoir les volumes nécessaires aux données préparées ;
- surveiller OSRM via health checks ou monitoring ;
- documenter les ressources CPU, RAM et stockage ;
- prévoir un fallback potentiel vers Mapbox ou Google Directions selon projet ;
- valider par ADR si OSRM devient critique pour un produit.

OSRM doit contribuer à réduire la dépendance aux APIs cartographiques payantes, sans supprimer la possibilité d'un fallback externe.

## 24. Stratégie monitoring

Le monitoring doit évoluer progressivement.

V1 :

- health checks basiques ;
- vérification services essentiels ;
- logs accessibles.

V3/VF :

- Prometheus ;
- Grafana ;
- Loki ;
- Alertmanager ;
- dashboards protégés ;
- alertes sur disponibilité, disque, CPU, mémoire, backups et certificats ;
- rétention des métriques et logs ;
- estimation du volume de stockage et du coût.

Le monitoring avancé nécessite une validation d'architecture et peut nécessiter un ADR.

## 25. Stratégie logs

Les logs doivent être :

- centralisables ;
- lisibles ;
- horodatés ;
- sans secrets ;
- sans tokens ;
- avec rétention documentée ;
- exploitables pour diagnostic ;
- séparés des données applicatives persistantes.

Loki peut être utilisé plus tard pour centraliser les logs si le besoin est confirmé.

## 26. Stratégie backups

Tout service persistant doit avoir une stratégie backup.

Services concernés :

- PostgreSQL ;
- MinIO ;
- volumes applicatifs critiques ;
- configurations nécessaires au restore ;
- données OSRM uniquement si le coût de régénération le justifie.

La stratégie doit préciser :

- fréquence ;
- rétention ;
- stockage local ou externalisé ;
- chiffrement si nécessaire ;
- vérification ;
- responsabilité ;
- coût.

## 27. Stratégie restore

Un backup non restaurable est considéré comme incomplet.

La stratégie restore doit prévoir :

- procédure documentée ;
- tests réguliers ;
- environnement de test restore ;
- temps de restauration cible ;
- ordre de restauration ;
- validation post-restore ;
- traçabilité des incidents.

## 28. Stratégie secrets

Les secrets doivent rester hors Git.

Sont concernés :

- mots de passe PostgreSQL ;
- credentials Redis si utilisés ;
- access keys MinIO ;
- tokens CI/CD ;
- secrets Traefik ;
- tokens registry ;
- credentials SMTP ou providers externes.

La stratégie doit prévoir :

- variables sécurisées ;
- fichiers locaux ignorés ;
- secrets CI/CD ;
- rotation possible ;
- accès limité ;
- absence de secrets dans logs.

## 29. Stratégie firewall et accès serveur

La sécurité serveur minimale doit prévoir :

- SSH par clé ;
- root login désactivé si possible ;
- port SSH contrôlé ;
- firewall actif ;
- ports publics limités à 80, 443 et SSH ;
- accès admin restreint ;
- Fail2Ban optionnel ou activable ;
- mises à jour sécurité documentées ;
- inventaire des ports exposés.

## 30. Stratégie CI/CD

La CI/CD doit être progressive.

V1 peut rester manuel documenté.

V2 doit prévoir :

- build contrôlé ;
- tests ;
- validation de configuration ;
- publication d'image ;
- déploiement serveur ;
- rollback documenté ;
- environnements protégés ;
- tags d'images explicites ;
- secrets CI/CD sécurisés.

GitHub Actions est la cible possible, sans création de workflow dans cette mission.

## 31. Stratégie registry

La registry doit permettre de stocker les images applicatives.

Options possibles :

- GitHub Container Registry ;
- registry privé ;
- registry cloud compatible.

Le choix doit tenir compte :

- sécurité ;
- coûts ;
- droits d'accès ;
- rétention ;
- intégration CI/CD ;
- traçabilité.

Un ADR pourra être nécessaire si la registry devient structurante.

## 32. Stratégie environnements

Le Cloud Core doit distinguer :

- local ;
- test ;
- staging ;
- production.

Chaque environnement doit documenter :

- variables ;
- domaines ;
- services activés ;
- volumes ;
- secrets ;
- niveaux de logs ;
- backups ;
- monitoring ;
- restrictions d'accès.

## 33. Stratégie déploiement

La stratégie de déploiement doit évoluer :

- manuel documenté au départ ;
- scripté plus tard ;
- CI/CD contrôlée ensuite ;
- blue/green ou canary uniquement si le besoin est confirmé.

Chaque déploiement doit prévoir :

- vérifications avant ;
- backup si données critiques ;
- health checks après ;
- rollback ;
- changelog ou release notes.

## 34. Stratégie health checks

Les health checks doivent couvrir :

- Traefik ;
- API ;
- PostgreSQL ;
- Redis ;
- MinIO ;
- OSRM si activé ;
- monitoring si activé ;
- disque ou volumes critiques si possible.

Ils doivent être utilisés pour diagnostic, CI/CD et monitoring.

## 35. Stratégie maintenance

La maintenance doit couvrir :

- mises à jour images Docker ;
- renouvellement certificats ;
- vérification backups ;
- tests restore ;
- rotation secrets ;
- vérification ports exposés ;
- nettoyage volumes inutiles ;
- revue logs ;
- revue coûts ;
- revue sécurité.

Les opérations critiques doivent être documentées dans des runbooks.

## 36. Stratégie coûts

Le Cloud Core doit aider à maîtriser les coûts :

- self-hosting lorsque raisonnable ;
- MinIO plutôt que stockage externe si pertinent ;
- OSRM/PostGIS/OpenStreetMap pour réduire la dépendance aux APIs payantes ;
- monitoring dimensionné au besoin ;
- environnements staging arrêtables si possible ;
- backups avec rétention adaptée ;
- choix cloud ou VPS justifié.

Le coût ne doit pas justifier une baisse du niveau de sécurité minimal.

## 37. Intégration avec API Core NestJS

Le Cloud Core fournit au API Core NestJS :

- PostgreSQL ;
- Redis ;
- MinIO/S3 ;
- variables d'environnement ;
- secrets ;
- reverse proxy ;
- CORS ;
- health checks ;
- logs ;
- backups ;
- monitoring ;
- CI/CD future.

Les contrats entre Cloud Core et API Core NestJS doivent être documentés avant implémentation.

## 38. Intégration avec API Core Spring Boot

Le Cloud Core doit aussi supporter API Core Spring Boot.

Il doit fournir :

- PostgreSQL ;
- Redis ;
- MinIO/S3 ;
- Traefik ;
- variables d'environnement ;
- health checks ;
- logs ;
- monitoring ;
- stratégie CI/CD compatible JVM.

Les besoins Spring Boot ne doivent pas casser les conventions communes du Cloud Core.

## 39. Intégration avec Web Core Next.js

Le Cloud Core doit supporter :

- hébergement d'application Next.js ;
- reverse proxy Traefik ;
- variables d'environnement publiques et privées ;
- SSL/TLS ;
- domaines ;
- health checks ;
- logs ;
- CI/CD future ;
- intégration avec API Core.

Les variables sensibles ne doivent jamais être exposées côté client.

## 40. Intégration avec Web Core Angular

Le Cloud Core doit supporter :

- hébergement d'application Angular ;
- service statique ou conteneur applicatif selon besoin ;
- Traefik ;
- SSL/TLS ;
- domaines ;
- intégration API ;
- cache HTTP si nécessaire ;
- CI/CD future.

## 41. Intégration avec Mobile Cores

Les cores mobiles ne sont pas déployés dans le Cloud Core, mais ils consomment ses services publics.

Le Cloud Core doit garantir :

- endpoints API stables ;
- TLS valide ;
- CORS et politiques d'accès cohérentes côté web sans bloquer mobile ;
- disponibilité API ;
- URLs d'upload adaptées ;
- OSRM ou Routing Service accessible via API contrôlée ;
- monitoring des services consommés par mobile.

## 42. Intégration avec IA Core

L'IA Core peut assister :

- génération de configurations ;
- revue sécurité ;
- revue CI/CD ;
- analyse de logs anonymisés ;
- rédaction de runbooks ;
- vérification de cohérence.

L'IA ne doit pas :

- manipuler de secrets ;
- modifier firewall sans validation ;
- déployer en production seule ;
- exposer un service ;
- décider seule d'une architecture cloud critique.

## 43. Intégration avec Quality Core

Quality Core doit définir ou relayer :

- validations `docker compose config` ;
- tests health checks ;
- tests backup/restore ;
- revues sécurité ;
- vérification ports exposés ;
- validation CI/CD ;
- critères de release infrastructure.

## 44. Intégration avec Docs Core

Docs Core doit soutenir le Cloud Core pour :

- guides d'installation ;
- runbooks d'exploitation ;
- procédures backup/restore ;
- documentation DNS, Traefik et SSL/TLS ;
- checklists sécurité ;
- ADR des choix structurants ;
- documentation des incidents et post-mortems si nécessaire.

## 45. Documentation obligatoire du core

À terme, le core devra contenir :

- `README.md` ;
- `CORE_SPECIFICATION.md` ;
- `ARCHITECTURE.md` ;
- `INSTALLATION.md` ;
- `USAGE.md` ;
- `TESTING.md` ;
- `SECURITY.md` ;
- `DEPENDENCIES.md` ;
- `ROADMAP.md` ;
- `CHANGELOG.md` ;
- runbooks ;
- guides backup/restore ;
- guides Traefik ;
- guides monitoring ;
- guides OSRM/PostGIS si activés.

## 46. Tests et validations attendus

Le Cloud Core doit prévoir :

- `docker compose config` ;
- démarrage local contrôlé ;
- vérification des ports exposés ;
- health checks ;
- test de connexion PostgreSQL ;
- test Redis ;
- test MinIO ;
- test OSRM si activé ;
- test backup ;
- test restore ;
- validation Traefik ;
- validation SSL ;
- validation monitoring ;
- revue secrets ;
- revue firewall.

## 47. Roadmap du core

### V0 : spécification et cadrage

- Créer `CORE_SPECIFICATION.md`.
- Identifier les ADR nécessaires.
- Valider le périmètre V1.

### V1 : Cloud Core minimal local + serveur simple

- Définir Docker et Docker Compose.
- Prévoir Traefik.
- Prévoir PostgreSQL.
- Reporter Redis post-V1 / V2 sauf besoin projet explicite.
- Prévoir MinIO.
- Définir réseaux Docker et volumes.
- Définir variables d'environnement.
- Définir health checks.
- Définir sécurité serveur minimale.

### V2 : CI/CD, backups, sécurité renforcée

- Prévoir CI/CD.
- Ajouter stratégie registry.
- Stabiliser backups.
- Tester restores.
- Renforcer firewall.
- Documenter runbooks.

### V3 : monitoring avancé, OSRM, PostGIS, registry

- Prévoir Prometheus, Grafana, Loki et alerting.
- Activer PostGIS selon besoin.
- Activer OSRM selon besoin.
- Stabiliser registry.
- Ajouter sauvegardes externalisées si nécessaire.

### VF : Cloud Core complet production-ready

- Infrastructure sécurisée.
- Monitoring exploitable.
- Backups et restores testés.
- CI/CD stabilisée.
- Runbooks complets.
- Coûts suivis.
- Services avancés validés.

## 48. Critères d'acceptation V1

La V1 sera acceptable si :

- la structure cloud cible est documentée ;
- Docker et Docker Compose sont cadrés ;
- Traefik est cadré comme reverse proxy ;
- PostgreSQL et MinIO sont prévus ; Redis est explicitement reporté post-V1 / V2 ;
- les réseaux Docker et volumes persistants sont documentés ;
- les variables d'environnement sont listées et sans secrets réels ;
- les ports publics sont limités ;
- PostgreSQL est non public ; Redis devra etre non public lorsqu'il sera livré ;
- l'utilisateur applicatif PostgreSQL n'est pas superuser ;
- les dashboards prévus sont protégés ou désactivés ;
- les health checks sont définis ;
- une stratégie backup minimale existe ;
- la procédure restore est cadrée ;
- la sécurité serveur minimale est documentée ;
- les intégrations API Core NestJS sont claires.

## 49. Critères d'acceptation version finale

La version finale sera acceptable si :

- le Cloud Core est production-ready ;
- les services obligatoires sont stabilisés ;
- les services optionnels sont documentés ;
- les dashboards sont protégés ;
- les backups sont automatisés et testés ;
- le restore est documenté et vérifié ;
- OSRM et PostGIS sont exploitables si activés ;
- le monitoring avancé est exploitable ;
- CI/CD et registry sont maîtrisées ;
- les runbooks sont complets ;
- la rétention des logs et métriques est définie ;
- les coûts sont suivis ;
- les ADR structurants sont présents.

## 50. Risques

- Exposer publiquement un service interne.
- Négliger les backups.
- Ne jamais tester les restores.
- Utiliser des images `latest` en production.
- Stocker des secrets dans Git.
- Ouvrir trop de ports.
- Sous-dimensionner OSRM ou PostgreSQL.
- Installer trop de services avancés trop tôt.
- Produire des dashboards non protégés.
- Ajouter une CI/CD trop complexe avant stabilisation.
- Oublier les coûts de monitoring, stockage et backups.
- Utiliser un compte PostgreSQL trop privilégié pour une application.
- Laisser croître les logs ou métriques sans politique de rétention.

## 51. Anti-patterns interdits

- PostgreSQL public.
- Application connectée à PostgreSQL avec un superuser.
- Redis public.
- OSRM public direct sans justification.
- Traefik dashboard ouvert.
- Grafana ouvert.
- MinIO sans protection.
- Ports publics non justifiés.
- Secrets dans Git.
- Logs contenant secrets ou tokens.
- Volumes persistants non documentés.
- Backups sans restore testé.
- Images Docker non versionnées en production.
- CI/CD déployant sans environnement protégé ni rollback documenté.
- Déploiement production par IA sans validation humaine.

## 52. Checklist de validation

- [ ] Le périmètre du Cloud Core est clair.
- [ ] Le hors périmètre est explicite.
- [ ] Les services obligatoires sont listés.
- [ ] Les services optionnels sont séparés.
- [ ] Docker et Docker Compose sont cadrés.
- [ ] Traefik est cadré.
- [ ] PostgreSQL et MinIO sont non publics ou protégés par reverse proxy contrôlé.
- [ ] Redis est reporté ou livré comme service interne non public.
- [ ] L'utilisateur applicatif PostgreSQL n'est pas superuser.
- [ ] OSRM est interne par défaut.
- [ ] La préparation et la mise à jour des données OSRM sont cadrées.
- [ ] SSL/TLS est prévu.
- [ ] Firewall et SSH sont couverts.
- [ ] Secrets hors Git.
- [ ] Backups et restores sont couverts.
- [ ] La rétention logs/monitoring est définie.
- [ ] Health checks et monitoring sont définis.
- [ ] CI/CD et registry sont cadrées.
- [ ] Les intégrations avec les autres cores sont décrites.
- [ ] Les décisions avancées à ADR sont identifiées.
- [ ] Aucun fichier d'infrastructure réel n'est généré.

## 53. Conclusion

Le Cloud Core est le socle d'exploitation d'Enistere OS Foundation. Il doit fournir une infrastructure standardisée, sécurisée, documentée et progressive, capable de soutenir les APIs, applications web, services mobiles, besoins cartographiques et futurs services IA.

Cette spécification cadre le périmètre final attendu sans créer d'infrastructure réelle. Les choix avancés, notamment monitoring complet, registry, stratégie CI/CD, OSRM critique, sauvegardes externalisées et modes de déploiement avancés, devront être validés avant implémentation et documentés par ADR si leur impact est structurant.
