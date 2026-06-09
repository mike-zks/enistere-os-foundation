# ADR-010 — Stack UI React Native

## 1. Titre

Stack UI React Native officielle pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit fournir une base mobile réutilisable pour le Mobile Core React Native, le UI Kit mobile, les futures applications Expo / React Native et les projets dérivés mobiles.

L'ADR-008 a validé les design tokens Enistere comme source de vérité UI/UX. L'ADR-009 a retenu une stack web fondée sur Tailwind CSS, Radix UI et shadcn/ui, sans remettre en cause la primauté des tokens.

Le mobile doit suivre la même logique : cohérence des intentions de design, adaptation aux contraintes natives et absence de dépendance structurante inutile.

Cette ADR choisit la stack UI React Native de référence, sans créer de code, de composant, de projet Expo, de package ou de dépendance.

## 5. Problème

React Native offre plusieurs approches de styling : StyleSheet, ThemeProvider, bibliothèques utilitaires comme NativeWind ou librairies UI complètes.

Sans décision formelle, les futurs starters mobiles risquent de créer :

- des composants divergents du UI Kit ;
- des styles dupliqués ;
- des tokens non respectés ;
- une dépendance prématurée à NativeWind ou à une librairie UI complète ;
- une accessibilité mobile incohérente ;
- des comportements dark/light mode non maîtrisés ;
- des variantes difficiles à maintenir entre projets dérivés.

Il faut donc définir une base mobile stable, compatible Expo et cohérente avec les design tokens Enistere.

## 6. Options étudiées

### Option A — StyleSheet + ThemeProvider + tokens Enistere

Utiliser une approche React Native classique basée sur StyleSheet, ThemeProvider, hooks de thème et tokens Enistere.

Avantages :

- contrôle fort des composants ;
- compatibilité native et Expo solide ;
- dépendances limitées ;
- performance plus prévisible ;
- alignement direct avec les design tokens ;
- lisibilité claire pour les composants de base.

Inconvénients :

- plus de code de style à maintenir ;
- moins de vitesse pour les équipes habituées aux classes utilitaires ;
- nécessite une bonne discipline de factorisation ;
- risque de duplication si les variantes ne sont pas cadrées.

### Option B — NativeWind comme standard obligatoire

Utiliser NativeWind comme base officielle de styling React Native, avec classes utilitaires proches de Tailwind.

Avantages :

- productivité pour les équipes familières de Tailwind ;
- proximité conceptuelle avec le Web Core Next.js ;
- possibilité de réutiliser certaines conventions de tokens ;
- style rapide à écrire dans des composants simples.

Inconvénients :

- dépendance structurante supplémentaire ;
- risque d'usage excessif de classes utilitaires ;
- lisibilité parfois plus faible sur des composants complexes ;
- adaptation aux contraintes natives à surveiller ;
- peut créer une fausse symétrie avec le web ;
- ne doit pas remplacer la gouvernance des tokens.

### Option C — Librairie UI complète mobile

Utiliser une librairie complète comme React Native Paper, UI Kitten ou équivalent comme base principale.

Avantages :

- nombreux composants disponibles ;
- documentation existante ;
- accélération possible pour certains écrans standards ;
- comportements déjà intégrés.

Inconvénients :

- identité visuelle souvent imposée ;
- personnalisation coûteuse ;
- dépendance forte à une librairie externe ;
- risque de conflit avec les tokens Enistere ;
- cohérence web/mobile moins maîtrisée ;
- évolution dépendante de la roadmap de la librairie.

### Option D — Approche hybride contrôlée

Utiliser les tokens Enistere, un ThemeProvider et des composants maison contrôlés comme base officielle. NativeWind ou une librairie spécifique peuvent être utilisés seulement si un projet le justifie.

Avantages :

- cohérence forte avec les design tokens Enistere ;
- compatibilité Expo et React Native stable ;
- composants mobiles mieux maîtrisés ;
- réduction de la dépendance à une librairie UI externe ;
- adaptation facile aux projets dérivés ;
- accessibilité mieux contrôlée ;
- performance mobile plus prévisible ;
- liberté d'utiliser NativeWind si un besoin projet est démontré ;
- meilleure continuité avec le futur Mobile Core Flutter.

Inconvénients :

- gouvernance nécessaire pour éviter les styles dupliqués ;
- effort initial de conception des composants de base ;
- NativeWind devra être évalué projet par projet ;
- les différences avec le Web UI Kit devront être documentées.

## 7. Décision

Enistere OS Foundation retient **l'Option D — approche hybride contrôlée**.

La décision officielle est :

```txt
Enistere OS Foundation adopte une approche React Native basée sur les design tokens Enistere, un ThemeProvider, StyleSheet ou une couche de styles contrôlée comme base officielle du Mobile Core React Native.

NativeWind peut être utilisé comme option projet ou option avancée, mais ne doit pas devenir une obligation structurante de la fondation tant qu'un besoin fort n'est pas démontré.
```

Le principe d'application est :

```txt
Tokens Enistere d'abord.
Composants accessibles et maintenables ensuite.
Librairie de style seulement si elle sert la cohérence, pas l'inverse.
```

La base officielle V1 est donc : tokens Enistere + ThemeProvider + composants maison contrôlés.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- cohérence avec les design tokens Enistere ;
- compatibilité forte avec Expo ;
- stabilité long terme ;
- composants mobiles mieux maîtrisés ;
- réduction de la dépendance à une librairie UI externe ;
- adaptation facile aux projets dérivés ;
- accessibilité mieux contrôlée ;
- performance mobile plus prévisible ;
- liberté d'utiliser NativeWind si un projet le justifie ;
- meilleure continuité avec le futur Mobile Core Flutter.

Elle évite de transformer NativeWind ou une librairie UI complète en contrainte structurante avant d'avoir démontré un besoin réel.

## 9. Conséquences positives

- Le Mobile Core React Native dispose d'une base stable avant implémentation.
- Les composants mobiles restent alignés avec les tokens Enistere.
- Les projets dérivés peuvent rester simples sans dépendance UI imposée.
- Le dark/light mode peut être exposé via un thème contrôlé.
- Les différences entre web et mobile peuvent être assumées et documentées.
- La performance mobile reste plus prévisible.
- Le futur Mobile Core Flutter pourra reprendre les mêmes intentions de design sans dépendre de NativeWind.

## 10. Conséquences négatives

- Les premiers composants mobiles devront être conçus et documentés avec discipline.
- Certaines équipes peuvent trouver l'approche moins rapide que NativeWind.
- Les conventions de variantes devront être cadrées pour éviter les duplications.
- NativeWind devra être évalué si un projet souhaite l'utiliser.
- Les composants maison demandent des tests, revues et maintenance.

## 11. Risques

- Divergence entre composants React Native et UI Kit.
- Styles dupliqués.
- Tokens non respectés.
- Usage excessif de classes utilitaires si NativeWind est utilisé.
- Dépendance trop forte à une librairie externe.
- Incohérence dark/light mode.
- Accessibilité mobile oubliée.
- Performance dégradée par composants trop lourds.
- Difficulté à maintenir plusieurs variantes de composants.
- Confusion entre adaptation plateforme et rupture du socle Enistere.

## 12. Alternatives rejetées

### Option A non retenue seule

StyleSheet + ThemeProvider + tokens est accepté comme base, mais l'option est trop restrictive si elle interdit toute couche de styles contrôlée ou tout usage projet de NativeWind.

### Option B rejetée comme standard obligatoire

NativeWind n'est pas retenu comme obligation structurante car il introduit une dépendance forte, peut encourager l'usage excessif de classes utilitaires et risque de créer une symétrie artificielle avec le web.

### Option C rejetée

Les librairies UI complètes sont rejetées comme base principale car elles imposent souvent une identité visuelle, une API et une trajectoire de maintenance qui peuvent entrer en conflit avec les design tokens Enistere.

## 13. Impact sur UI Kit

Le UI Kit mobile devra s'appuyer sur les design tokens Enistere et exposer des composants React Native contrôlés.

Il devra documenter :

- mapping des tokens vers le thème mobile ;
- variantes autorisées ;
- états UI standards ;
- tailles tactiles minimales ;
- règles d'accessibilité mobile ;
- compatibilité light/dark ;
- différences assumées avec le Web UI Kit ;
- conditions éventuelles d'usage de NativeWind.

Le UI Kit reste responsable de la cohérence mobile, pas une librairie de styling.

## 14. Impact sur Mobile Core React Native

Le Mobile Core React Native devra prévoir une architecture compatible avec :

- tokens Enistere ;
- ThemeProvider mobile ;
- hooks de thème ;
- StyleSheet ou couche de styles contrôlée ;
- composants maison contrôlés ;
- gestion light/dark si activée ;
- états loading, disabled, error, success, focused et pressed ;
- accessibilité mobile ;
- tests de composants critiques.

NativeWind pourra être étudié ou activé dans un projet dérivé si un besoin concret le justifie.

## 15. Impact sur projets dérivés mobiles

Les projets dérivés mobiles pourront étendre les composants et les tokens, à condition de :

- respecter le socle Enistere ;
- documenter leurs adaptations ;
- éviter les valeurs magiques ;
- ne pas introduire NativeWind sans justification projet ;
- ne pas introduire une librairie UI complète sans validation explicite ou ADR ;
- remonter les améliorations génériques vers la fondation.

Les projets peuvent adapter l'identité visuelle, mais ne doivent pas créer un système parallèle incompatible.

## 16. Impact sur accessibilité

Les composants React Native doivent intégrer l'accessibilité dès V1.

À vérifier systématiquement :

- labels accessibles ;
- rôle et état des composants interactifs quand pertinent ;
- tailles tactiles minimales ;
- contrastes ;
- états disabled, focused, pressed et invalid ;
- messages d'erreur compréhensibles ;
- compatibilité lecteur d'écran si applicable ;
- absence d'informations sensibles dans les messages UI.

L'accessibilité ne doit pas être supposée par l'usage d'une librairie externe.

## 17. Impact sur performance

La stratégie retenue doit préserver une performance mobile prévisible.

Points à surveiller :

- composants trop lourds ;
- styles recalculés inutilement ;
- variantes trop nombreuses ;
- surutilisation d'animations ;
- listes longues non optimisées ;
- images non optimisées ;
- rendu excessif lié au thème ;
- impact éventuel de NativeWind si activé.

Les composants doivent rester simples, composables et testables.

## 18. Impact sur IA / Codex / Claude Code

Les agents IA doivent appliquer cette ADR lors de la génération ou revue d'interfaces React Native.

Ils doivent :

- garder les design tokens Enistere comme source de vérité ;
- privilégier ThemeProvider, hooks de thème et composants contrôlés ;
- éviter les valeurs magiques ;
- ne pas introduire NativeWind sans justification projet ;
- ne pas ajouter de librairie UI complète sans validation explicite ;
- documenter les variantes, états et usages ;
- signaler les risques d'accessibilité, de performance ou de divergence avec le UI Kit.

L'IA assiste la génération et la revue, mais ne décide pas seule d'une dépendance structurante.

## 19. Règles d'application

- Les design tokens Enistere restent la source de vérité.
- Le ThemeProvider mobile doit exposer les tokens nécessaires.
- Les composants doivent éviter les valeurs magiques.
- Les variantes doivent être documentées.
- Les états UI doivent être prévus : loading, disabled, error, success, focused, pressed.
- Les composants doivent respecter les tailles tactiles minimales.
- Les couleurs doivent respecter les contrastes.
- NativeWind ne doit pas être introduit sans justification projet.
- Une librairie UI complète ne doit pas être introduite sans ADR ou validation explicite.
- Les composants doivent être testables.
- Les différences avec le Web UI Kit doivent être documentées.
- Les changements structurants doivent être documentés dans le changelog.
- Les composants critiques doivent être relus sous l'angle accessibilité et performance.

## 20. Conditions de révision future

Cette décision pourra être revue si :

- NativeWind devient nécessaire pour accélérer fortement les projets sans nuire à la cohérence ;
- la couche ThemeProvider/StyleSheet devient trop coûteuse à maintenir ;
- une librairie UI mobile devient clairement plus adaptée aux objectifs Enistere ;
- Expo ou React Native modifient fortement les bonnes pratiques de styling ;
- les projets dérivés accumulent trop d'écarts ;
- le futur Mobile Core Flutter impose une stratégie de tokens plus formelle ;
- les contraintes de performance ou d'accessibilité imposent une autre approche.

Toute révision devra préserver la primauté des design tokens Enistere ou documenter explicitement son remplacement.

## 21. Conclusion

Enistere OS Foundation adopte une approche hybride contrôlée pour la stack UI React Native.

La base officielle est composée des design tokens Enistere, d'un ThemeProvider mobile et de composants maison contrôlés. NativeWind reste possible comme option projet ou avancée, mais ne devient pas une obligation structurante de la fondation V1.
