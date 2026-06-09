# ADR-015 — Stockage mobile sécurisé

## 1. Titre

Stratégie de stockage mobile sécurisé pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit définir une stratégie commune de stockage mobile pour les futures applications Expo / React Native et les projets dérivés mobiles.

Cette ADR impacte :

- Mobile Core React Native ;
- API Core NestJS ;
- ADR-004 Auth/session multi-client ;
- ADR-011 Client HTTP ;
- ADR-012 Server state web/mobile ;
- refresh token ;
- logout ;
- cache local ;
- données sensibles ;
- offline éventuel ;
- sécurité mobile.

Cette ADR ne crée aucun code React Native, hook, service storage, projet Expo, package, dépendance ou fichier technique.

## 5. Problème

Le stockage mobile est une zone sensible car l'application s'exécute sur des appareils qui peuvent être perdus, compromis, sauvegardés ou partagés.

Sans stratégie commune, les projets risquent de :

- stocker un refresh token dans `AsyncStorage` ;
- persister inutilement un access token ;
- mélanger secrets, cache et préférences ;
- conserver des données sensibles après logout ;
- afficher les données d'un ancien utilisateur après reconnexion ;
- persister des caches TanStack Query trop longtemps ;
- activer l'offline sans cadrage sécurité ;
- logger des tokens ou données privées ;
- croire que la biométrie remplace l'authentification serveur.

Il faut donc classifier les données mobiles et définir quel stockage est autorisé selon leur sensibilité.

## 6. Options étudiées

### Option A — AsyncStorage pour tous les états

Utiliser `AsyncStorage` pour tokens, préférences, cache et données locales.

Avantages :

- simple à utiliser ;
- compatible avec beaucoup de projets ;
- adapté aux préférences non sensibles.

Inconvénients :

- non adapté aux tokens sensibles ;
- risque élevé de fuite en cas d'appareil compromis ;
- mélange secrets / cache / préférences ;
- non conforme à ADR-004 ;
- mauvaise base de sécurité pour une fondation.

### Option B — Expo SecureStore comme standard V1

Utiliser Expo SecureStore pour les secrets mobiles dans les applications Expo.

Avantages :

- bonne compatibilité Expo ;
- simple pour V1 ;
- adapté aux secrets de taille limitée ;
- cohérent avec les applications Expo ;
- réduit le risque par rapport à AsyncStorage.

Inconvénients :

- limites propres à Expo SecureStore ;
- moins de contrôle natif que certaines alternatives ;
- pas forcément adapté à tous les besoins avancés ;
- nécessite une documentation claire sur backups, biométrie et plateformes.

### Option C — React Native Keychain comme standard principal

Utiliser React Native Keychain comme solution principale pour les secrets mobiles.

Avantages :

- contrôle natif plus avancé ;
- adapté aux projets sortant du cadre Expo standard ;
- options de sécurité plus fines selon plateformes ;
- utile pour contraintes fortes.

Inconvénients :

- peut complexifier le starter Expo V1 ;
- dépendance native plus structurante ;
- intégration build plus exigeante ;
- moins simple pour une fondation mobile initiale Expo.

### Option D — Approche hybride contrôlée

Utiliser SecureStore en standard Expo V1, Keychain selon contraintes natives avancées, et MMKV / AsyncStorage uniquement pour données non sensibles.

Avantages :

- meilleure sécurité des refresh tokens ;
- compatibilité avec Expo ;
- séparation claire secrets / cache / préférences ;
- extensibilité vers Keychain si nécessaire ;
- simplicité V1 ;
- cohérence avec ADR-004, ADR-011 et ADR-012 ;
- maintenabilité des projets dérivés.

Inconvénients :

- nécessite une classification des données ;
- exceptions à documenter ;
- logout et nettoyage cache à tester ;
- risque de mauvais usage si les règles ne sont pas respectées.

## 7. Décision

Enistere OS Foundation retient **l'Option D — Approche hybride contrôlée**.

La décision officielle est :

```txt
Enistere OS Foundation adopte une stratégie de stockage mobile sécurisé basée sur :

- access token conservé en mémoire autant que possible ;
- refresh token stocké dans un stockage sécurisé ;
- données sensibles jamais stockées dans AsyncStorage simple ;
- cache applicatif séparé des secrets ;
- suppression des données sensibles au logout ;
- gestion prudente des données hors ligne.
```

Précision React Native / Expo :

```txt
SecureStore est le standard V1 pour les secrets dans le Mobile Core React Native Expo.
Keychain est autorisé pour les projets nécessitant un contrôle natif plus avancé.
MMKV ou AsyncStorage sont réservés aux données non sensibles.
```

## 8. Raisons de la décision

Cette stratégie permet :

- meilleure sécurité des refresh tokens ;
- compatibilité avec Expo ;
- séparation claire entre secrets, cache et préférences ;
- cohérence avec ADR-004 auth/session ;
- nettoyage fiable au logout ;
- réduction du risque de fuite ;
- évolution possible vers Keychain ;
- simplicité V1 ;
- meilleure compatibilité avec Codex / Claude Code ;
- meilleure maintenabilité des projets dérivés mobiles.

Elle évite de surcomplexifier le starter V1 tout en interdisant les stockages risqués pour les secrets.

## 9. Comparaison des options

| Critère | Option A AsyncStorage partout | Option B SecureStore | Option C Keychain | Option D hybride contrôlée |
|---|---|---|---|---|
| Sécurité tokens | Faible | Bonne | Très bonne | Bonne à très bonne |
| Compatibilité Expo V1 | Forte | Forte | Variable | Forte |
| Simplicité V1 | Forte mais risquée | Bonne | Moyenne | Bonne |
| Contrôle natif avancé | Faible | Moyen | Fort | Possible selon projet |
| Séparation secrets/cache | Faible | Bonne | Bonne | Forte |
| Maintenabilité | Faible | Bonne | Moyenne | Forte |
| Risque de mauvais usage | Élevé | Moyen | Moyen | Faible si règles suivies |
| Adaptation projets dérivés | Faible | Moyenne | Moyenne | Forte |

## 10. Classification des données mobiles

### Secrets

Exemples :

- refresh token ;
- session token sensible ;
- clé temporaire sensible éventuelle.

Stockage attendu :

- Expo SecureStore ;
- React Native Keychain si le projet le justifie.

### Données sensibles utilisateur

Exemples :

- informations personnelles ;
- profil utilisateur ;
- permissions ;
- identifiants internes ;
- documents sensibles ;
- données de localisation sensibles.

Stockage attendu :

- éviter le stockage persistant si possible ;
- cache court et contrôlé si nécessaire ;
- nettoyage au logout ;
- pas de persistance offline sans justification.

### Données non sensibles

Exemples :

- thème ;
- langue ;
- préférences UI ;
- onboarding vu ;
- filtres non sensibles ;
- cache non critique.

Stockage attendu :

- MMKV possible ;
- AsyncStorage possible ;
- choix à documenter par projet.

### Cache serveur

Exemples :

- listes ;
- détails ;
- données paginées ;
- données TanStack Query.

Stockage attendu :

- cache TanStack Query ;
- aucun token ;
- nettoyage ou invalidation au logout ;
- persistance offline uniquement si stratégie validée.

## 11. Stratégie access token

L'access token doit rester en mémoire autant que possible.

Règles :

- ne pas persister l'access token si ce n'est pas nécessaire ;
- ne pas stocker l'access token dans AsyncStorage ;
- ne pas stocker l'access token dans MMKV sans stratégie validée ;
- ne pas logger l'access token ;
- le renouveler via la stratégie refresh contrôlée par ADR-004 ;
- gérer proprement expiration et session expirée.

Un access token court limite l'impact d'une fuite, mais ne dispense pas d'un stockage prudent.

## 12. Stratégie refresh token

Le refresh token est un secret mobile critique.

Règles :

- stockage sécurisé obligatoire ;
- SecureStore standard V1 pour Expo ;
- Keychain autorisé pour contraintes natives avancées ;
- jamais dans AsyncStorage ;
- jamais dans MMKV non chiffré ou non validé ;
- suppression au logout ;
- rotation et révocation selon ADR-004 ;
- jamais dans les logs ou crash reports.

## 13. Stratégie SecureStore

Expo SecureStore est le standard V1 pour les secrets dans le Mobile Core React Native Expo lorsque ses limites sont acceptables.

Points à documenter :

- plateformes supportées ;
- limites de taille ;
- comportement au backup système ;
- comportement après réinstallation ;
- usage éventuel de biométrie ;
- fallback si SecureStore n'est pas disponible ;
- nettoyage au logout.

SecureStore ne doit pas être utilisé comme cache général.

## 14. Stratégie Keychain

React Native Keychain est autorisé lorsque le projet nécessite :

- contrôle natif plus avancé ;
- contraintes de sécurité plus fortes ;
- stratégie biométrique spécifique ;
- sortie du cadre Expo standard ;
- exigences plateforme particulières.

Keychain ne devient pas le standard obligatoire V1 afin de préserver la simplicité du starter Expo.

Toute adoption Keychain doit être documentée dans le projet dérivé.

## 15. Stratégie AsyncStorage

AsyncStorage est interdit pour :

- refresh token ;
- access token ;
- secrets ;
- clés sensibles ;
- données personnelles sensibles non justifiées.

AsyncStorage peut être utilisé pour :

- préférences non sensibles ;
- états UI simples ;
- onboarding vu ;
- langue ;
- filtres non sensibles.

Son usage doit rester clair et séparé des secrets.

## 16. Stratégie MMKV

MMKV peut être utilisé pour des données rapides non sensibles.

Usages possibles :

- préférences UI ;
- flags locaux non sensibles ;
- cache non critique ;
- données de performance non sensibles.

MMKV ne doit pas stocker de refresh token ou secret sans stratégie de chiffrement explicitement validée.

## 17. Stratégie cache TanStack Query

TanStack Query gère les données serveur conformément à ADR-012.

Règles :

- aucun token dans le cache TanStack Query ;
- cache nettoyé ou invalidé au logout ;
- données sensibles avec durée de cache prudente ;
- pas de persistance offline par défaut pour données sensibles ;
- erreurs 401 / 403 traitées sans fuite d'information ;
- séparation claire avec SecureStore / Keychain.

La persistance du cache doit être explicitement justifiée.

## 18. Stratégie logout

Le logout doit nettoyer les données locales sensibles.

Actions attendues :

- supprimer refresh token ;
- supprimer access token en mémoire ;
- vider ou invalider TanStack Query ;
- nettoyer état local sensible ;
- supprimer données offline sensibles si activées ;
- invalider la session côté serveur si possible selon ADR-004 ;
- éviter l'affichage de données de l'ancien utilisateur après reconnexion.

Un logout uniquement visuel ou uniquement local est insuffisant si une révocation serveur est disponible.

## 19. Stratégie offline

L'offline avancé n'est pas obligatoire en V1.

Règles :

- aucune donnée sensible ne doit être persistée offline sans justification ;
- la persistance du cache doit être limitée et documentée ;
- les données offline doivent être nettoyées au logout ;
- les conflits de synchronisation relèvent d'un ADR futur si nécessaire ;
- l'offline ne doit pas contourner les permissions backend.

ADR-029 traitera la synchronisation offline avancée si elle devient prioritaire.

## 20. Stratégie biométrie

La biométrie est optionnelle.

Elle peut :

- protéger l'accès local à certaines actions ;
- améliorer l'expérience de déverrouillage local ;
- renforcer certains scénarios sensibles si le projet le justifie.

Elle ne doit pas :

- remplacer l'authentification serveur ;
- masquer une stratégie de token faible ;
- être activée sans fallback ;
- exclure les utilisateurs qui ne peuvent ou ne veulent pas l'utiliser.

Chaque activation biométrique doit être documentée par projet.

## 21. Sécurité et audit

Exigences de sécurité :

- access token en mémoire si possible ;
- refresh token en stockage sécurisé ;
- pas de token sensible dans AsyncStorage ;
- pas de token sensible dans MMKV sans stratégie validée ;
- pas de token dans les logs ;
- suppression locale au logout ;
- invalidation serveur selon ADR-004 ;
- nettoyage cache TanStack Query selon ADR-012 ;
- gestion des appareils compromis ;
- prudence avec biométrie ;
- prudence avec backup système ;
- prudence avec screenshots si écran sensible ;
- expiration et rotation des tokens ;
- gestion session expirée ;
- séparation dev/staging/prod.

Les crash reports et logs mobiles ne doivent pas contenir de token, document sensible, donnée privée inutile ou contenu utilisateur sensible.

## 22. Conséquences positives

- Refresh token mieux protégé.
- Stockage mobile aligné avec ADR-004.
- Starter Expo V1 simple et exploitable.
- Séparation claire secrets / cache / préférences.
- Nettoyage logout plus fiable.
- Extension possible vers Keychain.
- Moins de risque de fuite via AsyncStorage.
- Prompts IA plus cadrés.

## 23. Conséquences négatives

- Classification des données obligatoire.
- Nettoyage logout à tester soigneusement.
- Documentation nécessaire pour chaque stockage persistant.
- SecureStore peut être insuffisant pour certains besoins avancés.
- Keychain peut nécessiter une intégration native plus lourde.
- Offline sensible repoussé à une stratégie dédiée.

## 24. Risques

- Refresh token stocké dans AsyncStorage.
- Access token persisté inutilement.
- Cache contenant des données sensibles.
- Logout qui ne nettoie pas les données locales.
- Données d'un ancien utilisateur visibles après reconnexion.
- Confusion entre stockage sécurisé et cache.
- Dépendance excessive à une solution Expo si besoin natif avancé.
- Biométrie mal comprise comme sécurité serveur.
- Backup système contenant des données sensibles.
- Logs ou crash reports contenant des données privées.

## 25. Alternatives rejetées

AsyncStorage pour tous les états est rejeté car il expose trop fortement les secrets mobiles.

SecureStore seul comme décision universelle est rejeté car certains projets peuvent nécessiter un contrôle natif plus avancé.

Keychain comme standard principal obligatoire est rejeté pour V1 car il peut complexifier le starter Expo sans besoin démontré.

Le mix libre par projet est rejeté car il provoquerait des divergences de sécurité difficiles à auditer.

## 26. Impact sur Mobile Core React Native

Le Mobile Core React Native doit prévoir :

- access token en mémoire autant que possible ;
- refresh token dans SecureStore en V1 Expo ;
- possibilité Keychain documentée ;
- interdiction AsyncStorage pour tokens ;
- MMKV / AsyncStorage réservés aux données non sensibles ;
- nettoyage complet au logout ;
- tests de token storage ;
- documentation des données persistées.

## 27. Impact sur API Core NestJS

L'API Core NestJS reste l'autorité d'authentification et de session.

Elle doit fournir :

- access token court ;
- refresh token révocable ;
- rotation si retenue ;
- invalidation logout ;
- gestion session expirée ;
- erreurs 401 / 403 cohérentes ;
- audit logs sur login, refresh, logout et révocation.

Le stockage mobile ne remplace pas la sécurité côté API.

## 28. Impact sur ADR-004 Auth/session

ADR-004 définit la stratégie access token court + refresh token révocable.

ADR-015 précise le stockage mobile :

- access token en mémoire autant que possible ;
- refresh token dans SecureStore ou Keychain ;
- logout supprimant les données locales ;
- pas de stockage non sécurisé ;
- gestion prudente des sessions restaurées.

## 29. Impact sur ADR-011 Client HTTP

ADR-011 définit les wrappers `fetch`.

ADR-015 précise que :

- le client HTTP ne stocke pas lui-même les tokens ;
- les tokens sont fournis par la couche auth/session ;
- les erreurs 401 / 403 peuvent déclencher une logique session contrôlée ;
- aucun token ne doit être loggé ;
- le refresh ne doit pas créer de boucle infinie.

## 30. Impact sur ADR-012 Server State

ADR-012 définit TanStack Query pour le server state.

ADR-015 précise que :

- TanStack Query ne stocke jamais les tokens ;
- le cache est vidé ou invalidé au logout ;
- les données sensibles ne restent pas en cache indéfiniment ;
- la persistance offline du cache reste optionnelle et documentée ;
- les données serveur ne sont pas dupliquées dans un store local sensible.

## 31. Impact sur projets dérivés mobiles

Chaque projet dérivé mobile doit documenter :

- les secrets persistés ;
- les données sensibles persistées ;
- les préférences non sensibles ;
- la stratégie de cache ;
- la stratégie offline si activée ;
- le choix SecureStore ou Keychain ;
- le comportement logout ;
- les exceptions éventuelles.

Les projets dérivés peuvent renforcer les règles, mais ne doivent pas affaiblir le socle.

## 32. Impact sur IA / Codex / Claude Code

Les agents IA doivent :

- ne pas créer de service storage réel sans mission explicite ;
- ne pas introduire AsyncStorage pour tokens ;
- ne pas stocker de tokens dans TanStack Query, Zustand, MMKV ou logs ;
- proposer SecureStore pour Expo V1 ;
- proposer Keychain seulement si le besoin le justifie ;
- demander nettoyage logout et tests token storage ;
- signaler les risques de données sensibles persistées.

L'IA assiste l'exécution et la revue, mais ne décide pas seule d'affaiblir la stratégie de stockage sécurisé.

## 33. Règles d'application

- Les secrets mobiles doivent utiliser SecureStore ou Keychain.
- AsyncStorage est interdit pour refresh token, access token et secrets.
- Access token en mémoire autant que possible.
- MMKV est réservé aux données non sensibles sauf stratégie validée.
- Logout doit nettoyer secrets, cache et état local sensible.
- TanStack Query doit être vidé ou invalidé au logout.
- Les erreurs et logs ne doivent pas contenir de tokens.
- La persistance offline doit être explicitement justifiée.
- Les données sensibles doivent avoir une durée de vie minimale.
- Chaque projet dérivé doit documenter ses données mobiles persistées.
- Toute exception doit être documentée.

## 34. Conditions de révision future

Cette ADR devra être révisée si :

- Expo SecureStore ne suffit plus pour les besoins V1 ;
- Keychain devient nécessaire comme standard principal ;
- l'offline mobile devient structurant ;
- une réglementation impose une politique de stockage plus stricte ;
- une stratégie de chiffrement locale est généralisée ;
- les besoins biométriques deviennent centraux ;
- une contrainte de plateforme modifie les garanties de stockage.

## 35. Conclusion

Enistere OS Foundation adopte une approche hybride contrôlée pour le stockage mobile sécurisé.

SecureStore est le standard V1 pour les secrets dans le Mobile Core React Native Expo. Keychain reste autorisé pour les projets nécessitant plus de contrôle natif. AsyncStorage et MMKV sont réservés aux données non sensibles, sauf stratégie validée.

Cette décision protège les refresh tokens, clarifie la séparation secrets / cache / préférences et aligne le Mobile Core avec ADR-004, ADR-011 et ADR-012.
