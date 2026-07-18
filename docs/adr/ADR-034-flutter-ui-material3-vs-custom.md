# ADR-034 — Flutter UI : Material 3 vs composants maison

## 1. Titre

Stack UI Flutter officielle pour le futur Mobile Core Flutter.

## 2. Statut

Validé.

## 3. Date

2026-07-14.

## 4. Contexte

La V3 de la roadmap ajoute les cores secondaires multi-framework, dont **Mobile Core Flutter**.
Ce core doit rester cohérent avec le socle V1 déjà validé : UI Kit, Web Core Next.js,
Mobile Core React Native, API Core et Deployment.

ADR-008 définit les design tokens Enistere comme source de vérité UI/UX, agnostique et
adaptable par plateforme. ADR-010 retient, côté React Native, une approche contrôlée :
tokens Enistere, ThemeProvider et composants maison ciblés, sans imposer une librairie UI
complète.

Le futur Mobile Core Flutter doit donc décider s'il s'appuie sur Material 3, sur des
composants entièrement maison, ou sur une approche hybride, avant toute spécification ou
starter.

Cette ADR choisit la stack UI Flutter de référence. Elle ne crée aucun projet Flutter,
aucune dépendance, aucun package, aucun composant et aucun runtime.

## 5. Problème

Sans décision formelle, le futur Mobile Core Flutter risque de créer :

- une identité visuelle Material par défaut qui contourne les tokens Enistere ;
- des composants maison coûteux à maintenir sans bénéfice clair ;
- une divergence avec le UI Kit et le Mobile Core React Native ;
- une accessibilité variable ;
- une gestion dark/light incohérente ;
- des dépendances UI additionnelles non justifiées ;
- un starter Flutter difficile à adapter aux projets dérivés.

Il faut donc choisir une base qui respecte les tokens Enistere, accélère le starter Flutter
et reste compatible avec les conventions natives Flutter.

## 6. Options étudiées

### Option A — Material 3 libre

Utiliser Material 3 comme design system principal, avec les composants Flutter Material par
défaut et une personnalisation légère.

Avantages :

- productivité élevée ;
- intégration Flutter native et stable ;
- composants nombreux et documentés ;
- accessibilité de base généralement meilleure qu'un système maison improvisé ;
- compatibilité dark/light intégrée.

Inconvénients :

- identité Material trop visible ;
- risque de contourner les tokens Enistere ;
- divergence possible avec UI Kit Web et Mobile React Native ;
- personnalisation avancée parfois coûteuse ;
- peut encourager des écrans trop génériques.

### Option B — Composants Flutter entièrement maison

Créer tous les composants UI Flutter sans s'appuyer sur Material 3 comme base.

Avantages :

- contrôle visuel maximal ;
- aucune identité Material imposée ;
- mapping direct avec les tokens Enistere ;
- API de composants conçue pour la Foundation.

Inconvénients :

- coût initial important ;
- accessibilité, focus, feedback, gestures et états à maintenir manuellement ;
- vélocité faible pour le starter V3 ;
- risque de recréer une librairie UI complète ;
- dette de maintenance élevée.

### Option C — Librairie UI Flutter tierce complète

Utiliser une librairie comme Flutter UI Kit externe, Fluent UI, Syncfusion, etc.

Avantages :

- nombreux composants ;
- accélération possible pour certains écrans ;
- comportements avancés parfois inclus.

Inconvénients :

- dépendance forte à une API externe ;
- identité visuelle imposée ou difficile à neutraliser ;
- risque de licence/coût selon librairie ;
- alignement tokens incertain ;
- surcharge pour un core Foundation générique.

### Option D — Material 3 contrôlé par tokens Enistere + composants maison ciblés

Utiliser Flutter Material 3 comme **moteur de composants et d'accessibilité**, mais
construire le thème, les variantes et les composants Foundation autour des tokens Enistere.
Les composants maison sont limités aux primitives nécessaires ou aux écarts réels entre
Material 3 et le design system Enistere.

Avantages :

- productivité et stabilité Flutter ;
- alignement avec les conventions natives ;
- accessibilité et états interactifs moins risqués ;
- mapping clair vers les tokens Enistere ;
- cohérence avec ADR-008 et ADR-010 ;
- moins de dette qu'un système 100% maison ;
- liberté de créer des primitives maison quand Material 3 ne suffit pas ;
- adaptation plus simple pour projets dérivés.

Inconvénients :

- gouvernance nécessaire pour éviter le style Material par défaut ;
- mapping tokens vers `ThemeData` à documenter précisément ;
- certains composants devront être encapsulés pour préserver la cohérence ;
- Material 3 peut évoluer et nécessiter des ajustements.

## 7. Décision

Enistere OS Foundation retient **l'Option D — Material 3 contrôlé par tokens Enistere +
composants maison ciblés**.

La décision officielle est :

```txt
Le futur Mobile Core Flutter utilisera Material 3 comme base technique Flutter,
mais les design tokens Enistere resteront la source de vérité.

Les composants Flutter du core devront passer par un thème Enistere contrôlé et
des wrappers/primitives Foundation lorsque nécessaire. Material 3 ne doit pas
devenir l'identité visuelle autonome du projet.
```

Le principe d'application est :

```txt
Tokens Enistere d'abord.
Material 3 comme moteur Flutter, pas comme identité.
Composants maison seulement quand ils réduisent une divergence réelle.
```

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- compatibilité naturelle avec Flutter ;
- cohérence avec ADR-008 (tokens agnostiques) ;
- continuité avec ADR-010 (approche mobile contrôlée, pas librairie UI complète imposée) ;
- coût raisonnable pour un core V3 ;
- accessibilité plus sûre qu'un système entièrement maison ;
- dark/light mode porté par un modèle Flutter standard ;
- maintenance plus réaliste ;
- adaptation aux projets dérivés sans imposer une identité Material brute.

Elle évite deux extrêmes : adopter Material 3 sans gouvernance, ou recréer un design
system Flutter complet avant d'avoir prouvé le besoin.

## 9. Conséquences positives

- Le futur Mobile Core Flutter aura une base UI claire avant sa spécification.
- Les tokens Enistere resteront la source de vérité multi-framework.
- Le thème Flutter pourra mapper couleurs, typographie, radius, spacing et états.
- Les composants standards Flutter pourront être utilisés sans perdre la gouvernance UI.
- Les projets dérivés pourront personnaliser le thème sans casser le socle.
- La maintenance initiale sera plus faible qu'un système 100% maison.
- Les revues IA/qualité pourront vérifier le respect des tokens plutôt que l'apparence brute.

## 10. Conséquences négatives

- Une discipline stricte est nécessaire pour éviter les styles Material par défaut non alignés.
- Certains composants devront être encapsulés dans des primitives Foundation.
- Le mapping de tokens vers `ThemeData` devra être testé et documenté.
- Le futur core devra expliciter les différences entre Web, React Native et Flutter.
- Des composants avancés Material peuvent nécessiter des adaptations projet.

## 11. Risques

- Confondre Material 3 avec la source de vérité visuelle.
- Ajouter des styles locaux non gouvernés.
- Diverger du UI Kit Web et du Mobile React Native.
- Sur-encapsuler Material 3 et perdre la productivité Flutter.
- Sous-encapsuler Material 3 et obtenir une identité trop générique.
- Oublier les tailles tactiles, focus, contrastes et états disabled/error/loading.
- Introduire des packages UI tiers sans ADR ou preuve.

## 12. Alternatives rejetées

### Option A rejetée comme standard libre

Material 3 est accepté comme base technique, mais rejeté comme design system autonome.
Les tokens Enistere doivent rester prioritaires.

### Option B rejetée comme base V3

Les composants entièrement maison sont rejetés comme base initiale car leur coût et leur
risque d'accessibilité sont trop élevés pour un core secondaire V3.

### Option C rejetée

Les librairies UI Flutter tierces complètes sont rejetées comme base principale : elles
ajoutent dépendance, identité externe et risque de licence/coût sans nécessité immédiate.

## 13. Impact sur UI Kit

Le UI Kit devra préparer un export ou une documentation de tokens compatible Flutter :

- couleurs primitives et sémantiques ;
- typographie ;
- radius ;
- spacing ;
- états UI ;
- light/dark ;
- règles d'accessibilité ;
- mapping vers `ThemeData` / `ColorScheme` / `TextTheme`.

Le UI Kit reste la source des intentions de design. Material 3 est un adaptateur Flutter.

## 14. Impact sur Mobile Core Flutter

Le futur Mobile Core Flutter devra :

- créer un `ThemeData` Enistere basé sur les tokens ;
- utiliser Material 3 (`useMaterial3: true`) comme base technique ;
- exposer des primitives Foundation seulement si elles apportent cohérence ou sécurité ;
- documenter les composants Material utilisés directement et ceux encapsulés ;
- garder les dépendances UI additionnelles hors du socle sans justification ;
- rester sans logique métier projet.

Le starter Flutter ne peut commencer qu'après cette ADR et une spécification du core.

## 15. Impact sur Mobile Core React Native

Le Mobile Core React Native reste gouverné par ADR-010. Flutter ne doit pas forcer une
refonte du ThemeProvider RN.

Les deux cores mobiles doivent partager les mêmes intentions :

- tokens ;
- dark/light ;
- états UI ;
- accessibilité ;
- tailles tactiles ;
- primitives d'état.

Ils n'ont pas besoin d'avoir une implémentation identique.

## 16. Impact sur Web Core Angular

ADR-034 ne décide pas Angular. Le Web Core Angular reste bloqué par ADR-035 (Angular
Material vs PrimeNG).

La seule contrainte transversale est que le futur choix Angular devra respecter les tokens
Enistere comme source de vérité, comme Flutter.

## 17. Sécurité et accessibilité

Cette ADR ne traite pas de données sensibles. Elle impose néanmoins :

- pas de dépendance UI tierce sans revue ;
- pas de thème embarquant secrets ou configuration runtime ;
- respect des contrastes ;
- tailles tactiles minimales ;
- états focus/disabled/error/loading visibles ;
- labels et semantics Flutter pour composants interactifs ;
- aucune logique métier dans les composants UI Foundation.

## 18. Non-objectifs

Cette ADR ne livre pas :

- projet Flutter ;
- package Dart ;
- composant Flutter ;
- export automatique des tokens ;
- décision de state management Flutter ;
- décision client HTTP Flutter ;
- décision stockage Flutter ;
- tests Flutter ;
- workflow CI Flutter.

Ces éléments appartiennent aux missions suivantes : spécification Mobile Core Flutter, puis
starter minimal.

## 19. Critères de conformité futurs

Un futur Mobile Core Flutter sera conforme à ADR-034 si :

- `ThemeData` est construit depuis les tokens Enistere ;
- Material 3 est activé mais gouverné ;
- les composants Foundation ne contournent pas les tokens ;
- les dépendances UI tierces sont absentes ou justifiées par ADR/preuve ;
- les états UI et l'accessibilité sont documentés ;
- les divergences Flutter vs React Native/Web sont explicites ;
- aucun composant ne contient de logique métier.

## 20. Statut d'implémentation

À la date de cette ADR :

- `starters/flutter/` reste un dossier vide ;
- aucune spécification Mobile Core Flutter n'existe encore ;
- aucun starter Flutter n'est généré ;
- aucune dépendance Flutter n'est ajoutée.

La prochaine mission recommandée est **Mobile Core Flutter 1 — Core specification**.
