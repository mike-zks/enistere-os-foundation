# ADR-081 — Le cœur ne dépend pas de la zone métier

- Statut : Validé et implémenté
- Date : 2026-08-01
- Décideur : Owner Foundation
- Complète : ADR-079 (l'invariant qu'elle avait explicitement laissé de côté)

## Contexte

ADR-079 a rangé les sept runtimes en trois zones et a posé FF5d, qui refuse
qu'une capability écrive dans le cœur. Elle a aussi énoncé ce qu'elle ne faisait
pas :

> **La règle mesure les destinations d'overlay, pas les imports.** Interdire à
> `core/**` d'importer `features/**` est l'invariant complémentaire, et il n'est
> pas encore posé.

C'est la moitié manquante de la garantie. Une régénération peut remplacer le
cœur parce qu'aucune capability n'y écrit ; elle ne le peut vraiment que si aucun
fichier du cœur ne dépend de ce que la zone métier contient.

**Ce que protège l'invariant, précisément.** La zone métier est celle que la
régénération ne touche jamais : ce qui s'y trouve appartient à qui a reçu le
projet. Un fichier du cœur qui l'importe dépend donc de code que la Factory ne
livre pas et ne maintient pas. Renommer un écran suffirait à casser le socle.

## Décision

**FF5e — `core-business-independence`** lit les imports de chaque fichier de la
zone cœur des sept runtimes et refuse toute dépendance vers la zone métier.

### La couture est la seule exception, et elle n'est pas écrite ici

Les fichiers de composition existent précisément pour importer du code métier.
Ils sont exemptés — mais la liste des exemptions est **lue dans le registre
d'adaptateurs**, pas recopiée dans la règle : la couture est exactement ce que la
Factory génère, donc l'exemption ne peut pas diverger de son objet.

### Une seule carte des zones

FF5d et FF5e lisent désormais la même constante, `RUNTIME_ZONES`. La frontière ne
peut plus être tenue dans un sens et oubliée dans l'autre.

L'écrire une seule fois a montré qu'elle était **incomplète** : `lib/src/theme/`
et `lib/main.dart` sur Flutter, `src/shared/` et `src/types/` sur Next.js,
`src/app/pages/` et `src/app/shared/` sur Angular, les modules racines
(`main.ts`, `app.module.ts`, `config.py`, `main.py`, `platform.py`,
`EnistereCoreApplication.java`) n'étaient mesurés par personne. Ils le sont.
Vérification faite, aucun overlay n'y écrit : FF5d ne gagne aucune violation, elle
gagne de la portée.

### Ce qui reste hors de la carte, volontairement

Les racines de routage — `src/app/` sur Next.js, `app/` sur Expo — **ne sont pas
du cœur** : les capabilities y écrivent des pages, c'est une surface partagée.
Elles ne sont donc pas mesurées par FF5e. Leur propre frontière est une question
distincte, et elle reste ouverte (voir « Non revendiqué »).

## La violation trouvée, et ce qu'elle était vraiment

**Une seule sur 313 fichiers de cœur et 877 imports** : le routeur Flutter,
`lib/src/core/navigation/router.dart`, importait
`lib/src/features/home/home_screen.dart`.

La parité de famille a tranché, une fois de plus. Le pair mobile de Flutter,
React Native, place son écran d'accueil dans `app/index.tsx` : une surface
neutre du socle, sans contenu métier, sans session, sans réseau — et son starter
ne livre **rien** dans `src/features/`.

L'écran Flutter était le même objet : un écran d'accueil placeholder qui ne nomme
aucun domaine, ne tient aucun état et n'appelle rien. Il était **mal rangé**, pas
mal conçu. Il passe donc dans `lib/src/core/navigation/`, ce qui applique le
critère d'ADR-079 — *la zone suit la nature du code* — et aligne Flutter sur son
pair de famille : `lib/src/features/` du starter est désormais vide, comme
`src/features/` de React Native et `src/app/features/` d'Angular.

En chemin, `lib/src/app/router.dart` s'est révélé être un fichier mort ne
contenant qu'un commentaire de déménagement. Supprimé.

## Conséquences

### Acquis

* Les deux moitiés de la frontière sont tenues : **où les fichiers atterrissent**
  (FF5d) et **ce qu'ils importent** (FF5e).
* La carte des zones est unique, et sa complétion a élargi la portée de FF5d.
* Flutter respecte la parité mobile : aucun contenu de starter dans la zone
  métier.

### Assumé

* La règle lit les imports **par expression régulière**, pas par analyse
  syntaxique, dans cinq langages. Un parseur par langage serait cinq dépendances
  pour énoncer un fait. La contrepartie est mesurée : 877 imports reconnus sur
  313 fichiers, et un test qui échoue si ce volume s'effondre.
* Aucun mécanisme de dérogation datée n'accompagne FF5e, contrairement à FF5d.
  L'unique violation a été corrigée ; une machinerie de dérogation que rien
  n'utilise est du code mort, et un fichier de dérogations vide est une invitation.

### Non revendiqué

* **Les racines de routage ne sont pas mesurées.** Sur Next.js,
  `src/app/(public)/status/page.tsx` importe `src/features/foundation-status` et
  `src/features/health` — des features de démonstration que le starter livre.
  Le danger est de même nature, la zone est partagée, et la question est ouverte.
* **La parité web est inégale sur ce point** : Next.js livre des features de
  démonstration, Angular n'en livre aucune. Non tranché ici.
* FF5e lit le cœur **des starters**. Que le cœur composé soit identique découle
  de FF5d et de l'exemption de couture ; ce raisonnement a été **vérifié plutôt
  qu'affirmé**, sur des applications réellement générées (voir Tests).
* **La régénération n'existe toujours pas.** Cette ADR referme le dernier
  invariant qui lui manquait, elle ne la livre pas.

## Alternatives écartées

* **Exempter le routeur Flutter.** Il aurait fallu déclarer qu'un fichier du cœur
  peut importer la zone métier « parce que c'est un routeur » — l'angle mort
  qu'ADR-080 venait de refermer ailleurs.
* **Déplacer l'écran d'accueil vers la racine de routage.** Flutter n'en a pas :
  son routage est du code, pas un répertoire. L'inventer aurait été un idiome
  importé.
* **Interdire aussi aux racines de routage d'importer la zone métier.** C'est
  probablement juste, et cela toucherait Next.js, Expo et les pages de
  démonstration des starters. Trop large pour être décidé en passant.

## Tests

```bash
npm run factory:test                      # 502
node factory/quality/scripts/fitness-functions.mjs
node factory/quality/scripts/golden-runtime.mjs nestjs-flutter-base
node factory/quality/scripts/golden-runtime.mjs nestjs-flutter-auth
```

* **La règle mord dans les deux sens**, et par langage : une violation forgée en
  TypeScript, Dart, Python, Java et via alias `@/` est détectée ; l'import
  inverse — le métier qui s'appuie sur le cœur — reste muet ; la couture reste
  exemptée.
* **Non-vacuité vérifiée** : un test échoue si la règle lit moins de six fichiers
  de cœur par runtime ou moins de 500 imports au total. C'est le mode de panne
  qui avait déjà laissé passer un golden fantôme.
* **Épreuve sur le dépôt réel** : réintroduire l'import du routeur Flutter fait
  échouer la fitness function ; le correctif la fait passer.
* **Sur applications composées, pas seulement sur les starters** : le cœur
  matérialisé de `nestjs-flutter-auth`, `triple-files`, `spring-files`,
  `fastapi-rbac` et `nestjs-angular-auth` a été généré puis relu — **427 fichiers
  de cœur composés, zéro violation**, les sept runtimes couverts.
* Goldens Flutter verts, `flutter analyze`, `flutter test` et `flutter build apk`
  compris.

## Rollback

Révoquer le commit rend l'écran d'accueil à `lib/src/features/home/`, retire
FF5e et ramène la carte des zones à sa portée précédente.
