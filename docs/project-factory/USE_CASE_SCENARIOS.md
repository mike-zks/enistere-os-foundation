# Derived Project Use Case Scenarios

> Scenarios de reference pour prouver la finalite et l'utilisabilite de la Foundation.
> Statut : `SPECIFICATION_DOCUMENTAIRE`.
> Date : 2026-07-18.

## 1. Objectif

Ces scenarios ne sont pas des produits metier imposes. Ils definissent les parcours minimaux qui doivent
prouver qu'une composition de cores fonctionne hors du monorepo Foundation.

## 2. Scenarios prioritaires

| ID | Scenario | Profil | Statut matrice | Finalite |
|---|---|---|---|---|
| S1 | Portail SaaS TypeScript | `nestjs-next` | `DIRECT` | prouver packages, BFF, UI Kit et Cloud V1 |
| S2 | Back-office entreprise | `spring-angular` | `DIRECT` | prouver la chaine Java/Angular et Material Enistere |
| S3 | Application mobile TypeScript | `nestjs-react-native` | `DIRECT` | prouver auth mobile, upload et smoke Android |
| S4 | Application mobile Java/Flutter | `spring-flutter` | `DIRECT` | prouver Dio, SecureStorage, refresh et upload |
| S5 | Produit omnicanal | `nestjs-next-react-native` | `DIRECT` | prouver un contrat partage entre API, web et mobile |

Les profils `ADAPT` ne deviennent prioritaires qu'apres validation d'au moins un scenario direct dans la
meme famille.

## 3. S1 — Portail SaaS TypeScript

### Composition

- API Core NestJS ;
- Web Core Next.js ;
- UI Kit React ;
- `@enistere/api-contracts` + `@enistere/api-client-fetch` ;
- Cloud Core V1 ;
- Quality et Docs selon le profil `nestjs-next`.

### Parcours de preuve

1. lancer l'API et le Web depuis un repository derive ;
2. se connecter via le BFF sans exposer de token au navigateur ;
3. consulter les permissions ;
4. envoyer, lister, telecharger et supprimer un fichier ;
5. verifier CSRF/Origin sur les mutations ;
6. executer les gates, construire les images et deployer en staging.

### Valeur prouvee

Ce scenario valide la distribution des packages, l'utilite du UI Kit, les gates transverses et la chaine
Cloud sans ajouter de logique metier complexe.

## 4. S2 — Back-office entreprise

### Composition

- API Core Spring Boot ;
- Web Core Angular ;
- Angular Material controle par les tokens Enistere ;
- HttpClient Angular ;
- Cloud Core V1 adapte Java ;
- Quality et Docs selon le profil `spring-angular`.

### Parcours de preuve

1. login et refresh reel entre Angular et Spring ;
2. guard de route et affichage conditionnel par permission ;
3. formulaire Reactive Forms avec erreurs backend normalisees ;
4. upload et URL de telechargement signee ;
5. audit d'une action sensible ;
6. verify Maven, tests Angular, build et staging.

### Gap revele

Le login Angular et la compatibilite exacte des DTO/erreurs Spring doivent etre prouves en integration
reelle, meme si chaque core est `VALIDE_V1` separement.

## 5. S3 — Application mobile TypeScript

### Composition

- API Core NestJS ;
- Mobile Core React Native ;
- tokens Enistere ;
- packages API TypeScript ;
- Cloud Core V1 ;
- Quality et Docs selon le profil `nestjs-react-native`.

### Parcours de preuve

1. login reel et restauration de session ;
2. 401, refresh coalescent et retry unique ;
3. upload depuis un fichier device ;
4. logout avec purge session/cache ;
5. etats offline explicites sans faux succes ;
6. smoke Android et reserve iOS documentee selon l'environnement.

### Gap revele

Le projet derive doit choisir les adaptateurs natifs utiles, notamment le stockage de preferences. Les
primitives Foundation sans adaptateur ne doivent pas etre presentees comme une fonctionnalite produit.

## 6. S4 — Application mobile Java/Flutter

### Composition

- API Core Spring Boot ;
- Mobile Core Flutter ;
- Material 3 controle par les tokens Enistere ;
- Dio et SecureStorage Flutter ;
- Cloud Core V1 ;
- Quality et Docs selon le profil `spring-flutter`.

### Parcours de preuve

1. login reel via l'API Spring ;
2. stockage securise et restauration ;
3. refresh 401 coalescent et purge en echec ;
4. upload multipart et erreurs 413/415 ;
5. smoke Android sur device/emulateur ;
6. verify Maven + tests Flutter + staging.

### Gap revele

Il n'existe pas encore de client Dart officiel genere. Le premier pilote doit mesurer si le client Dio
manuel suffit ou si la generation OpenAPI devient une priorite Foundation.

## 7. S5 — Produit omnicanal

### Composition

- API Core NestJS comme autorite unique ;
- Web Core Next.js pour portail et administration ;
- Mobile Core React Native ;
- UI Kit React + tokens mobiles ;
- packages API communs ;
- Cloud, Quality et Docs.

### Parcours de preuve

1. meme compte et memes permissions sur Web et Mobile ;
2. fichier envoye sur Mobile et visible sur Web ;
3. action admin Web refusee par l'API pour un role insuffisant ;
4. contrat OpenAPI unique sans DTO duplique ;
5. correlation d'une requete entre client, API et logs ;
6. release coordonnee avec rollback documente.

Ce scenario est le meilleur candidat pour un projet pilote complet, mais seulement apres S1 ou S3 afin
de limiter le nombre de variables simultanees.

## 8. Preuves minimales communes

Chaque scenario derive doit produire :

- un repository independant ou un squelette exportable clairement isole ;
- les cinq documents Project Factory instancies ;
- une reference immuable a la Foundation ;
- un parcours auth reel si le profil contient une API et un client ;
- un parcours fichier si le besoin est inclus ;
- les gates du profil ;
- un smoke local ou staging ;
- un rapport des ecarts et du temps de bootstrap ;
- aucun secret versionne.

## 9. Mesures d'adoption

| Indicateur | Mesure attendue |
|---|---|
| Temps idee -> blueprint valide | heures/jours |
| Temps blueprint -> premier demarrage | minutes/heures |
| Temps premier demarrage -> smoke auth | heures/jours |
| Capacites Foundation reutilisees | nombre et pourcentage |
| Adaptations locales | nombre, motif, cout |
| Defauts Foundation decouverts | nombre et severite |
| Gates executes sans adaptation | ratio |
| Temps onboarding d'un contributeur | heures/jours |

Ces mesures decident des futures missions. Elles evitent de completer des cores sur la base de besoins
hypothetiques.

