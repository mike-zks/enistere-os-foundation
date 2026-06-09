# ADR-008 — Design tokens UI Kit

## 1. Titre

Stratégie des design tokens Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit fournir une base UI/UX commune pour plusieurs types de produits : applications web, applications mobiles, dashboards, backoffices, portails, SaaS, marketplaces, plateformes métier et interfaces IA.

Le UI Kit, le Web Core Next.js, le Mobile Core React Native et les futurs cores Flutter et Angular doivent partager des règles visuelles cohérentes sans imposer une implémentation identique sur chaque plateforme.

Les spécifications existantes demandent déjà :

- des design tokens centralisés ;
- une cohérence web/mobile ;
- une compatibilité light mode et dark mode ;
- une accessibilité prise en compte dès le départ ;
- un versioning du design system ;
- une capacité future d'export JSON et d'intégration avec Figma ou des outils équivalents.

Cette ADR formalise la stratégie des tokens avant la création de composants UI réels.

## 5. Problème

Sans décision formelle sur les design tokens, chaque core ou projet dérivé pourrait définir ses propres couleurs, espacements, typographies, radius, ombres et états UI.

Cela créerait :

- une incohérence visuelle entre les produits ;
- une duplication des décisions UI ;
- une dette de maintenance importante ;
- des migrations coûteuses lors de l'ajout du dark mode ;
- une accessibilité difficile à contrôler ;
- des prompts IA moins fiables pour générer ou relire des interfaces ;
- une dépendance excessive aux conventions propres d'une librairie UI.

Il faut donc définir un socle de tokens commun, agnostique et adaptable par plateforme avant de construire les composants du UI Kit.

## 6. Options étudiées

### Option A — Styles libres par projet

Chaque projet définit librement ses couleurs, typographies, espacements, composants et patterns.

Avantages :

- grande liberté locale ;
- démarrage rapide pour un projet isolé ;
- peu de gouvernance initiale.

Inconvénients :

- incohérence forte entre projets ;
- duplication des composants et styles ;
- accessibilité variable ;
- dark mode difficile à généraliser ;
- dette UI élevée ;
- réutilisation limitée entre web, mobile et futurs cores.

### Option B — Tokens propres à chaque plateforme

Chaque plateforme possède son propre système de tokens : Web, React Native, Flutter et Angular.

Avantages :

- adaptation directe aux contraintes techniques de chaque plateforme ;
- intégration plus simple avec les librairies UI locales ;
- autonomie plus forte des équipes plateforme.

Inconvénients :

- risque de divergence visuelle ;
- gouvernance plus lourde ;
- duplication des décisions de design ;
- migrations complexes entre plateformes ;
- plus faible compatibilité avec une source design commune ;
- plus difficile à exploiter par les agents IA de manière cohérente.

### Option C — Tokens communs agnostiques avec adaptation par plateforme

Un socle commun de design tokens Enistere est défini dans la fondation. Il reste agnostique, versionné, documenté et exportable. Chaque plateforme adapte ensuite ces tokens selon ses contraintes techniques.

Les tokens couvrent au minimum :

- couleurs ;
- typographie ;
- espacements ;
- radius ;
- shadows ;
- élévation ;
- z-index ;
- breakpoints ;
- motion ;
- opacités ;
- états UI ;
- thèmes light/dark.

## 7. Décision

Enistere OS Foundation retient **l'Option C — tokens communs agnostiques avec adaptation par plateforme**.

La décision officielle est :

```txt
Enistere OS Foundation adopte une stratégie de design tokens agnostiques,
centralisés, versionnés et exportables, servant de base commune aux interfaces web,
mobile et aux futurs projets dérivés.
```

Les tokens constituent la source de vérité UI avant la création de composants réels.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- cohérence UX/UI entre les projets ;
- adaptation web/mobile sans uniformité forcée ;
- centralisation des décisions visuelles ;
- meilleure maintenabilité ;
- dark/light mode plus propre ;
- accessibilité plus contrôlable ;
- versioning du design system ;
- compatibilité future avec Figma ou un outil équivalent ;
- export possible en JSON ;
- génération future vers Tailwind, React Native, Flutter ou Angular ;
- réduction de la dette UI.

Elle respecte aussi la stratégie de dépendances : les librairies UI externes peuvent aider l'implémentation, mais elles ne doivent pas devenir la source de vérité du système visuel Enistere.

## 9. Conséquences positives

- Les décisions visuelles structurantes sont centralisées.
- Les composants web et mobile peuvent partager les mêmes intentions de design.
- Les projets dérivés peuvent personnaliser leur identité sans casser le socle commun.
- Les états UI standards deviennent plus faciles à documenter et tester.
- Le dark mode peut être conçu à partir d'un modèle de tokens plutôt qu'ajouté tardivement.
- Les revues UI, accessibilité et qualité deviennent plus objectives.
- Les agents IA peuvent s'appuyer sur des règles stables pour générer ou auditer des interfaces.

## 10. Conséquences négatives

- Une gouvernance minimale des tokens devient nécessaire.
- Les premières implémentations UI doivent attendre un socle de tokens suffisant.
- Les changements de tokens peuvent provoquer des migrations dans plusieurs cores.
- Les équipes doivent éviter d'ajouter des styles locaux sans justification.
- Les adaptations par plateforme doivent être documentées pour éviter les divergences implicites.

## 11. Risques

- Tokens trop nombreux dès le départ.
- Tokens instables provoquant des migrations coûteuses.
- Uniformité forcée entre plateformes.
- Confusion entre tokens globaux et styles spécifiques projet.
- Mauvaise gestion du dark mode.
- Accessibilité oubliée ou traitée trop tard.
- Dépendance excessive à une librairie UI externe.
- Absence de gouvernance sur les changements de tokens.
- Extensions projet incompatibles avec le socle de fondation.

## 12. Alternatives rejetées

### Option A rejetée

Les styles libres par projet sont rejetés car ils créent rapidement une dette UI, une incohérence visuelle et une accessibilité non maîtrisée.

### Option B rejetée

Les tokens propres à chaque plateforme sont rejetés comme stratégie principale car ils fragmentent les décisions visuelles et rendent plus difficile la cohérence entre Web, React Native, Flutter, Angular et projets dérivés.

Chaque plateforme pourra adapter les tokens communs, mais ne devra pas définir une source de vérité indépendante.

## 13. Impact sur UI Kit

Le UI Kit devient le point de référence des design tokens.

Il devra documenter :

- tokens primitifs ;
- tokens sémantiques ;
- tokens de thème ;
- états UI standards ;
- règles d'accessibilité ;
- compatibilité light/dark ;
- versioning et migration des tokens.

Aucun composant UI réel ne doit être considéré stable tant que les tokens nécessaires à son usage ne sont pas cadrés.

## 14. Impact sur Web Core Next.js

Le Web Core Next.js devra consommer les tokens Enistere comme source de vérité.

Les adaptations web pourront produire, plus tard, des formats compatibles avec :

- variables CSS ;
- Tailwind CSS ;
- shadcn/ui ou Radix UI si retenus par ADR ;
- thèmes light/dark ;
- composants accessibles et responsive.

Le choix de la stack UI web reste hors de cette ADR et devra être traité séparément.

## 15. Impact sur Mobile Core React Native

Le Mobile Core React Native devra consommer les mêmes intentions de design que le web, avec adaptation aux contraintes natives.

Les adaptations mobiles pourront produire, plus tard, des formats compatibles avec :

- un ThemeProvider ;
- StyleSheet ;
- NativeWind si retenu par ADR ;
- tailles tactiles ;
- contraintes de performance mobile ;
- thèmes light/dark si activés.

Le choix entre StyleSheet, ThemeProvider et NativeWind reste hors de cette ADR.

## 16. Impact sur futurs cores Flutter et Angular

Les futurs cores Flutter et Angular devront s'aligner sur le socle de tokens Enistere.

Ils pourront adapter les tokens vers leurs écosystèmes respectifs, sans redéfinir une identité visuelle indépendante.

Les choix Material 3, composants maison, Angular Material, PrimeNG ou alternatives devront être tranchés par ADR dédiées si ces choix deviennent structurants.

## 17. Impact sur projets dérivés

Les projets dérivés peuvent étendre les tokens pour répondre à leur identité ou à leurs besoins métier.

Ces extensions doivent :

- rester compatibles avec le socle Enistere ;
- être documentées côté projet ;
- ne pas casser les composants communs ;
- distinguer clairement tokens globaux, tokens de thème et styles spécifiques projet ;
- prévoir une stratégie de migration si elles deviennent génériques et doivent remonter dans la fondation.

## 18. Impact sur IA / Codex / Claude Code

Les agents IA doivent traiter les tokens comme une contrainte de génération et de revue.

Ils doivent :

- éviter les valeurs magiques dans les composants UI ;
- signaler les styles isolés hors système ;
- demander la mise à jour de la documentation et du changelog en cas de changement structurant ;
- ne pas choisir seuls une librairie UI comme source de vérité ;
- distinguer décision de design system et implémentation plateforme ;
- signaler les risques d'accessibilité, de dark mode ou de divergence plateforme.

L'IA assiste la rédaction, la génération et la revue, mais ne décide pas seule des évolutions de tokens.

## 19. Règles d'application

- Les tokens doivent être définis avant les composants.
- Aucun composant UI ne doit utiliser de valeur magique non justifiée.
- Les couleurs sémantiques doivent être séparées des couleurs primitives.
- Les tokens doivent être versionnés.
- Les changements de tokens doivent être documentés dans le changelog.
- Les breaking changes de tokens doivent suivre SemVer.
- Les projets dérivés peuvent étendre les tokens, mais ne doivent pas casser le socle.
- Les tokens doivent rester compatibles avec light mode et dark mode.
- L'accessibilité doit être prise en compte dès V1.
- Les tokens globaux, sémantiques, de thème et spécifiques projet doivent être distingués.
- Les librairies UI externes ne doivent pas remplacer la gouvernance des tokens.
- Tout changement structurant de tokens doit passer par revue humaine.

## 20. Conditions de révision future

Cette décision pourra être revue si :

- les contraintes d'une plateforme empêchent une adaptation saine des tokens communs ;
- un outil design comme Figma impose un format différent ;
- une solution de tokens standardisée devient nécessaire ;
- les projets dérivés nécessitent une stratégie multi-marques plus avancée ;
- les migrations liées aux tokens deviennent trop coûteuses ;
- la gouvernance actuelle ne suffit plus à contrôler les changements ;
- une librairie UI devient structurante au point d'imposer une nouvelle stratégie.

Toute révision devra être documentée dans une nouvelle ADR ou dans une mise à jour formelle de celle-ci.

## 21. Conclusion

Enistere OS Foundation adopte une stratégie de design tokens communs, agnostiques, centralisés, versionnés et exportables.

Cette décision donne au UI Kit un socle stable pour construire les futurs composants et garantit une cohérence UI/UX entre Web, mobile, futurs cores et projets dérivés, tout en laissant chaque plateforme adapter l'implémentation à ses contraintes propres.
