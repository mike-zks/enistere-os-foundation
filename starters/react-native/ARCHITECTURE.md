# Architecture du runtime React Native

## Structure

```text
starters/react-native/
├── app/                         # navigation Expo Router neutre
├── src/
│   ├── api/                     # transport mobile typé
│   ├── platform/                # Common v2 et secure-storage port
│   ├── session/                 # hook neutre
│   ├── offline/                 # réseau et hook offline
│   ├── push/                    # hook push désactivé
│   ├── permissions/             # permissions techniques
│   ├── linking/                 # deep-link policy
│   ├── crash-reporting/         # port et assainissement
│   └── …                        # fondations UI et techniques génériques
├── test/
└── starter.manifest.json
```

Il n’existe aucun niveau `base/`. La racine du runtime est l’unique source
copiée par le pipeline canonique.

## Frontières

`src/platform/runtime-contract.ts` porte les invariants communs : versions,
configuration, erreurs, contexte W3C, audit, télémétrie, diagnostics, lifecycle
et registre d’extensions.

Les contrats Mobile sont des ports neutres :

```text
Runtime Mobile
├── secure-storage slot
├── session slot
├── offline slot
├── push slot
└── crash-reporting slot
          ↑
     overlay explicite
```

Un slot ne constitue jamais une implémentation de capability. Les valeurs par
défaut session/offline/push sont respectivement anonyme ou désactivées.

## Sécurité

- seules les variables `EXPO_PUBLIC_*` sont consommées ;
- HTTPS est obligatoire en production ;
- les secrets, tokens, cookies, URLs signées et PII sont expurgés avant tout
  sink ;
- les erreurs réseau ne réexposent pas de contenu interne ;
- les deep links utilisent des allowlists et bloquent traversée et redirection
  ouverte ;
- secure storage est un contrat versionné avec clés bornées ; son adapter natif
  est choisi explicitement par composition.

## Conformité

L’évaluateur recherche les contrats et leurs preuves comportementales. Un
placeholder, un nom de fichier isolé ou un dossier de capability ne suffit pas.
La fitness function échoue si un dossier `base/` ou une implémentation
Auth/Files/Notifications réapparaît.
