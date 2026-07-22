# Primitive Specification

## Définition

Une primitive est une brique d’infrastructure utilisée par les runtimes et capabilities.

## Types

- database ;
- cache ;
- object-storage ;
- queue ;
- broker ;
- mail ;
- push ;
- scheduler ;
- search ;
- secrets ;
- telemetry.

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
