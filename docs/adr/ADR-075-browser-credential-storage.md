# ADR-075 — Où vit la créance d'un client navigateur, et Authentication sur Angular

- Statut : Validé et implémenté
- Date : 2026-07-28
- Décideur : Owner Foundation
- Complète : ADR-068 et ADR-074

## Contexte

Angular était `planned` sur les trois capabilities. La mission de portage a
rencontré deux obstacles, tous deux traités par [ADR-074] et la PR qui l'a suivie :
l'adapter Angular n'avait aucune couture de composition, et `AUTH-WEB-001`
exigeait un BFF — le mécanisme de Next.js écrit dans un contrat censé être neutre.

Reste la question de fond : **Angular est un SPA statique**. Il n'a ni serveur,
ni cookie HttpOnly qu'il puisse poser lui-même. Or `AUTH-CLIENT-002` demande que
le refresh vive « dans un stockage protégé ». Le navigateur n'en offre aucun à un
SPA statique : tout ce qu'un script écrit, un script peut le lire.

Le cadrage initial — « mémoire ou `sessionStorage` » — était faux. Les deux sont
des variantes d'une même prémisse : *le SPA détient la créance*. Tant qu'il la
détient, une injection de script la lit ; `sessionStorage` ne protège de rien, il
raccourcit la fenêtre.

## Décision

### 1. Le stockage est une couture, jamais un mécanisme codé en dur

`CredentialStore` a la même forme que `SecureStorage` de React Native. Les deux
clients diffèrent par l'implémentation, jamais par l'architecture — c'est ce qui
rend la parité Web/Mobile vérifiable au lieu d'être déclarative.

### 2. Le défaut est la mémoire du processus

`InMemoryCredentialStore` est le défaut parce que c'est la seule option
navigateur qui **ne promet rien qu'elle ne tienne**. Un script injecté à un
chargement ultérieur ne trouve rien à exfiltrer, et la créance disparaît avec
l'onglet.

Le coût est explicite et assumé : **un rechargement complet déconnecte**. Le
masquer derrière `sessionStorage` aurait acheté du confort avec une créance de
trente jours lisible par n'importe quel script injecté.

### 3. `localStorage` est proscrit, et le test le prouve

Persister une créance de trente jours dans un magasin lisible par script est le
pire des choix. L'interdiction n'est pas un commentaire : un test vérifie que
l'implémentation par défaut n'écrit ni dans `localStorage`, ni dans
`sessionStorage`, ni dans un cookie.

### 4. Le jeton d'accès n'est jamais observable

`AuthService` garde le jeton d'accès dans un champ privé, **pas dans un signal**.
Un signal est observable par n'importe quel composant : « l'interface peut
afficher la session » deviendrait « l'interface peut lire la créance ». Ce que
les templates observent est un instantané sans jeton.

### 5. Le rafraîchissement coalescé est une exigence de correction

Deux requêtes échouant en 401 au même instant dépenseraient chacune le refresh.
L'autorité fait tourner le jeton à chaque usage et traite un rejeu comme une
réutilisation : le second appel révoquerait **toute la famille** et déconnecterait
l'utilisateur. Coalescer n'est donc pas une optimisation, c'est ce qui empêche le
client de se déconnecter lui-même.

### 6. La garantie de déconnexion appartient au service, pas au transport

`signOut` purge dans un `finally`. La première écriture s'appuyait sur le fait
qu'`AuthApi` avale les erreurs — le test l'a mise en défaut : si la couche de
transport change ou lève, la purge n'avait jamais lieu et l'utilisateur restait
connecté localement. La garantie vit là où l'invariant la place.

## La posture recommandée en production, et pourquoi elle n'est pas le défaut

Quand l'API et l'application sont **same-site** — la topologie que la Factory
génère, derrière un reverse proxy unique — la meilleure réponse n'est aucune des
deux : que **l'autorité pose elle-même un cookie de refresh**
`HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh`. Le SPA ne détient
alors plus rien du tout.

Confronté aux axes qui comptent :

* **Sécurité** — une injection de script n'obtient au pire qu'un jeton d'accès
  court et **ne peut pas persister**. Combinée à la rotation déjà en place, un
  vol reste à usage unique **et détectable**.
* **Cohérence** — Next.js tient l'invariant par son BFF, Angular par le cookie de
  l'autorité, React Native par le Keychain. Trois moyens, une garantie : ce que
  la reformulation d'`AUTH-WEB-001` rend mesurable.
* **Performance** — un aller-retour de moins qu'un proxy BFF, aucun serveur à
  exploiter pour Angular.
* **Scalabilité** — aucun état serveur ajouté : le cookie transporte le jeton
  rotatif que l'autorité émet déjà.
* **Dérivés futurs** — la règle se généralise : *la créance vit dans le magasin
  le plus protégé qu'offre la plateforme, et le code client ne la lit jamais*.

Ce n'est pas le défaut pour deux raisons, et elles sont dirimantes :

1. **La topologie décide.** `SameSite=Strict` suppose que l'API et
   l'application soient same-site. Un déploiement sur un domaine tiers exigerait
   `SameSite=None`, ce qui ramène le CSRF et donc un jeton CSRF. L'option n'est
   pas universelle ; en faire un défaut imposerait une contrainte de déploiement
   silencieuse.
2. **Le coût touche les deux autorités.** Offrir un transport cookie modifie
   NestJS *et* Spring et leurs preuves de conformité, sans affaiblir le chemin
   mobile qui reste sur le corps de réponse. C'est une extension de contrat — un
   fork de *transport*, pas de garantie — et elle mérite sa propre décision.

La couture existe précisément pour que ce choix soit un remplacement de provider,
pas une réécriture.

## Conséquences

### Acquis

* `auth/angular` est `ready` : quatre responsabilités, six invariants, neuf
  preuves. **L'écart de parité Web est refermé** — Angular tient exactement ce
  que Next.js tient.
* 127/127 tests sur l'application Angular composée réellement générée.
* Le compromis de stockage est écrit, testé et remplaçable au lieu d'être subi.

### Assumé

* **Un rechargement complet déconnecte** avec l'implémentation par défaut. C'est
  le prix de ne pas persister une créance dans un magasin lisible par script, et
  il doit être dit aux équipes produit, pas découvert par elles.
* `spring-angular-auth` passe `planned` → **`supported`**, pas `ready` : la
  composition est générable mais aucun golden n'exerce cette sélection. La
  promotion exigera une preuve runtime.

### Non revendiqué

* **RBAC et Files restent `planned` sur Angular** ; deux écarts de parité Web
  demeurent déclarés.
* Le transport cookie n'est pas livré. Il reste une mission distincte, qui
  bénéficiera alors aux trois clients.
* Aucun test de bout en bout navigateur n'est revendiqué au-delà des suites
  unitaires et d'intégration Karma.

## Alternatives écartées

* **`sessionStorage` pour le refresh.** Achète la survie au rechargement contre
  une créance de trente jours lisible par script injecté. Le confort ne paie pas
  ce prix quand la couture permet de faire mieux plus tard.
* **`localStorage`.** Même faiblesse, sans même l'effacement à la fermeture.
* **Ajouter SSR et un BFF au starter Angular.** Parité de mécanisme réelle, mais
  change la nature du runtime, sa surface de baseline et son modèle de
  déploiement — bien au-delà d'un portage de capability.
* **Déclarer `AUTH-WEB-001` non applicable à Angular.** Laisserait un trou
  permanent dans une famille censée être interchangeable.

## Tests

```bash
npm run factory:test                      # 472 tests
npm run factory:capability-conformance    # auth/angular CONFORMANT
```

Application Angular composée : **127/127**. Verrouillé : instantané sans jeton,
jeton d'accès hors stockage, aucune écriture dans `localStorage`/`sessionStorage`/
cookie, refresh coalescé en un seul appel, purge sur échec de refresh, rejeu
unique après 401, purge malgré une révocation distante en échec, message
identique pour mot de passe faux et compte inconnu, `requestId` conservé sans
divulgation du secret soumis.

## Rollback

Révoquer le commit ramène `auth/angular` à `planned` et rouvre l'écart de parité
Web dans `parity-gaps.json`.
