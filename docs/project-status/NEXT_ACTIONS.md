# Prochaine action

## Mission achevée

Les profils système simples sont exécutables et les profils distribués
traversent désormais honnêtement le pipeline canonique
([ADR-065](../adr/ADR-065-executable-system-architecture-profiles.md)).

| Profil | Représentation | Génération | Statut global |
|---|---|---|---|
| `backend-service` | `IMPLEMENTED` | `GENERATABLE` sur compositions prouvées | exécutable |
| `product-platform` | `IMPLEMENTED` | `GENERATABLE` sur compositions prouvées | exécutable |
| `distributed-platform` | `IMPLEMENTED` | `PLANNED` | planifiable, bloqué |
| `service-ecosystem` | `IMPLEMENTED` | `PLANNED` | `TARGET` |

Preuves :

- `init` exige le profil système avant les runtimes ;
- `architecture list/describe/recommend` émet seulement les quatre profils
  canoniques et leurs six dimensions ;
- `validate` sépare la représentation du support de génération ;
- `plan --explain` expose `architectureProfile`, `compositionPreset`, support et
  diagnostics ;
- les alias historiques sont normalisés à la frontière d’entrée ;
- les incohérences entre profil et dimensions sont refusées par diagnostics CSM ;
- une topologie à plusieurs backends atteint le resolver et ressort `PLANNED` ;
- aucun preset mono-backend n’est attribué à un système multi-client ou
  multi-backend ;
- `service-ecosystem` n’est jamais annoncé générable ;
- les sept starters restent à leur racine, sans dossier `base/` ni
  `composition.baseSource`.

## Prochaine mission unique

> **Définir le contrat minimal de graphe, communications et ownership de
> `distributed-platform`, puis rendre générable et prouver un golden Spring +
> NestJS, sans promouvoir `service-ecosystem`.**

### Justification de l’ordre

La phase Architecture Profiles n’est pas terminée tant que le troisième profil
reste uniquement représentable. Ajouter des capabilities maintenant
stabiliserait leurs manifests contre un modèle mono-backend incomplet.

Le premier slice distribué doit rester borné : deux autorités backend, ownership
explicite, communications versionnées, déploiements séparables sous gouvernance
commune et Platform Baseline inchangé.

### Critères de sortie

- le CSM porte owners et communications sans relire le Blueprint en aval ;
- chaque edge référence deux applications existantes, un contrat, un mode,
  l’identité, le timeout et la politique de panne ;
- aucun backend n’accède directement au datastore de l’autre ;
- le resolver refuse les graphes incomplets ou cycliques non justifiés ;
- le plan ordonne matérialisation, déploiement et rollback ;
- un golden Spring + NestJS prouve génération, installation, boot de chaque
  backend, contrat inter-applications, corrélation/tracing et lock reproductible ;
- `distributed-platform` ne devient `GENERATABLE` que pour ce scope prouvé ;
- `service-ecosystem` reste `TARGET` ;
- aucun nouveau runtime, aucune capability et aucun pipeline parallèle ;
- aucun dossier `base/` n’est réintroduit.
