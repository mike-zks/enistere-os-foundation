# Primitive Specification

## Définition

Une primitive est une brique d’infrastructure utilisée par les runtimes et capabilities.

## Types

- relational-database ;
- document-database ;
- cache ;
- object-storage ;
- content-repository ;
- queue ;
- broker ;
- mail ;
- push ;
- search ;
- telemetry-backend ;
- secrets.

## Contrat

Chaque primitive définit :

- interface fonctionnelle ;
- providers ;
- configuration ;
- sécurité ;
- health ;
- sauvegarde/restauration ;
- migrations ;
- observabilité ;
- modes local, staging et production.

## Abstraction contrôlée

Enistere standardise les capacités nécessaires sans masquer artificiellement les différences des providers.

## Ownership

Toute donnée persistante possède un owner explicite. Un service ne lit pas directement la base d’un autre owner.

## Distinction de contenu

MinIO est un provider `object-storage`. Alfresco est un provider `content-repository`. Ils ne sont pas
interchangeables : le second porte versionnement, métadonnées et gouvernance documentaires.

La spécification détaillée est
[INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md](INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md).
