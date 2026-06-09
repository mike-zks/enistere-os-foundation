# ADR-009 — Stack UI Web

## 1. Titre

Stack UI Web officielle pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit fournir une base web réutilisable pour le Web Core Next.js, le UI Kit, les futurs dashboards, backoffices, portails clients, applications SaaS et projets dérivés web.

L'ADR-008 a déjà validé une stratégie de design tokens agnostiques, centralisés, versionnés et exportables. Ces tokens restent la source de vérité UI/UX.

Le Web Core Next.js et le UI Kit doivent maintenant disposer d'une stack UI web officielle, cohérente avec :

- les design tokens Enistere ;
- l'accessibilité ;
- les états UI standards ;
- Next.js et l'App Router ;
- la documentation du UI Kit ;
- la capacité d'adaptation aux projets dérivés.

Cette ADR choisit la stack UI web de référence, sans créer de code, de composant, de package ou de dépendance.

## 5. Problème

Sans décision sur la stack UI web, les futurs starters risquent de diverger rapidement :

- composants créés avec des conventions différentes ;
- styles Tailwind non standardisés ;
- variantes incohérentes ;
- accessibilité traitée de manière variable ;
- dépendance excessive à une librairie UI complète ;
- duplication entre Web Core Next.js et UI Kit ;
- difficulté pour Codex ou Claude Code à générer des composants cohérents.

Il faut retenir une stack qui accélère l'exécution sans remplacer la gouvernance des design tokens.

## 6. Options étudiées

### Option A — CSS/Tailwind maison uniquement

Utiliser Tailwind CSS et créer tous les composants à la main.

Avantages :

- contrôle complet du rendu ;
- bonne compatibilité avec les design tokens ;
- dépendances limitées ;
- faible risque d'identité visuelle imposée par une librairie.

Inconvénients :

- coût de création élevé pour les composants complexes ;
- accessibilité à gérer manuellement ;
- risque de variantes incohérentes ;
- productivité plus faible au démarrage ;
- documentation et tests plus lourds dès V1.

### Option B — Librairie UI complète

Utiliser une librairie complète comme Material UI, Ant Design, Chakra UI ou équivalent.

Avantages :

- grand nombre de composants disponibles ;
- documentation souvent complète ;
- accélération forte pour certains backoffices ;
- comportements complexes déjà implémentés.

Inconvénients :

- identité visuelle souvent très marquée ;
- personnalisation parfois coûteuse ;
- dépendance forte à l'API de la librairie ;
- risque de contournement des design tokens Enistere ;
- bundle et performance à surveiller ;
- adaptation multi-projets moins maîtrisée.

### Option C — Tailwind CSS + Radix UI + shadcn/ui

Utiliser Tailwind CSS pour le style, Radix UI pour les primitives accessibles et shadcn/ui comme base de composants copiables, adaptables et contrôlables.

Avantages :

- rapidité de développement ;
- bonne compatibilité avec Next.js ;
- composants modernes et personnalisables ;
- primitives accessibles via Radix UI ;
- contrôle du code des composants via shadcn/ui ;
- alignement possible avec les design tokens Enistere ;
- dépendance moins rigide qu'une grosse librairie UI complète ;
- adaptation plus simple aux projets dérivés ;
- meilleure compatibilité avec les agents IA pour générer des composants cohérents.

Inconvénients :

- nécessité d'une gouvernance stricte sur les composants copiés ;
- risque de dépendre implicitement du style par défaut shadcn/ui ;
- risque de multiplication de variantes non documentées ;
- accessibilité à vérifier malgré l'usage de primitives accessibles ;
- cohérence Tailwind/tokens à maintenir.

### Option D — Composants maison sans base externe

Créer un design system web entièrement maison sans s'appuyer sur shadcn/ui ou Radix UI.

Avantages :

- contrôle maximal ;
- absence d'identité visuelle externe ;
- architecture totalement adaptée à Enistere.

Inconvénients :

- coût initial important ;
- plus grand risque d'erreurs d'accessibilité ;
- composants complexes longs à stabiliser ;
- faible vélocité V1 ;
- documentation, tests et maintenance plus exigeants.

## 7. Décision

Enistere OS Foundation retient **l'Option C — Tailwind CSS + Radix UI + shadcn/ui**.

La décision officielle est :

```txt
Enistere OS Foundation adopte Tailwind CSS + Radix UI + shadcn/ui comme base UI web principale pour le Web Core Next.js, tout en gardant les design tokens Enistere comme source de vérité.
```

Cette stack est une base contrôlée d'implémentation web. Elle ne devient pas l'identité visuelle imposée d'Enistere.

## 8. Raisons de la décision

Cette stratégie est retenue car elle permet :

- rapidité de développement ;
- composants modernes et personnalisables ;
- bonne compatibilité avec Next.js ;
- cohérence avec les design tokens Enistere ;
- accessibilité améliorée grâce aux primitives Radix UI ;
- contrôle du code des composants via shadcn/ui ;
- évitement d'une dépendance trop rigide à une grosse librairie UI ;
- adaptation facile aux projets dérivés ;
- meilleure compatibilité avec l'IA et Codex pour générer des composants cohérents.

Elle équilibre productivité, contrôle, accessibilité et alignement avec le UI Kit.

## 9. Conséquences positives

- Le Web Core Next.js dispose d'une base UI claire avant l'implémentation.
- Les composants web peuvent être construits rapidement sans abandonner le contrôle du code.
- Les primitives complexes peuvent s'appuyer sur Radix UI pour améliorer l'accessibilité.
- Tailwind CSS peut être configuré pour consommer les tokens Enistere.
- shadcn/ui fournit une base adaptable plutôt qu'une librairie opaque.
- Les projets dérivés peuvent ajuster les composants sans casser le socle.
- Les revues IA peuvent appliquer des règles concrètes sur tokens, variantes et états UI.

## 10. Conséquences négatives

- Les composants copiés depuis shadcn/ui devront être maintenus dans le projet qui les adopte.
- La qualité dépendra de la discipline appliquée aux variantes et aux tokens.
- Tailwind peut devenir difficile à relire si les classes ne sont pas standardisées.
- Certains composants Radix UI peuvent nécessiter une compréhension fine de l'accessibilité.
- Les mises à jour de shadcn/ui ne seront pas automatiques si les composants sont adaptés localement.

## 11. Risques

- Copier trop de composants sans gouvernance.
- Modifier shadcn/ui sans respecter les tokens Enistere.
- Créer des variantes incohérentes.
- Surcharger Tailwind avec des classes non standardisées.
- Dépendre implicitement du style par défaut shadcn/ui.
- Supposer l'accessibilité sans la vérifier.
- Créer une divergence entre UI Kit et Web Core Next.js.
- Documenter insuffisamment les composants, variantes et états.
- Introduire des dépendances UI additionnelles sans justification.

## 12. Alternatives rejetées

### Option A rejetée

Tailwind maison uniquement est rejeté comme stratégie principale car il ralentirait la création des composants complexes et ferait porter trop tôt toute la charge d'accessibilité et de comportement au UI Kit.

### Option B rejetée

Les librairies UI complètes sont rejetées car elles imposent souvent une identité visuelle, une API et des contraintes de personnalisation trop fortes pour une fondation multi-projets.

### Option D rejetée

Les composants entièrement maison sans base externe sont rejetés pour V1 car le coût de conception, d'accessibilité, de tests et de documentation serait trop élevé avant d'avoir stabilisé les autres cores prioritaires.

## 13. Impact sur UI Kit

Le UI Kit devra utiliser cette stack comme cible web principale.

Il devra documenter :

- composants web retenus ;
- variantes autorisées ;
- états UI standards ;
- mapping entre design tokens et Tailwind ;
- primitives Radix UI utilisées ;
- adaptations shadcn/ui acceptées ;
- règles d'accessibilité ;
- exemples d'usage et contre-exemples.

Le UI Kit reste responsable de la cohérence, pas shadcn/ui.

## 14. Impact sur Web Core Next.js

Le Web Core Next.js devra prévoir une architecture compatible avec Tailwind CSS, Radix UI et shadcn/ui lors de la future génération du starter.

La stack devra soutenir :

- layouts standards ;
- routing protégé ;
- dashboards et backoffices ;
- formulaires ;
- tableaux ;
- modals, drawers, confirmations et toasts ;
- états loading, empty, error, success et disabled ;
- accessibilité baseline ;
- responsive design ;
- intégration avec les design tokens Enistere.

Aucun composant réel n'est créé par cette ADR.

## 15. Impact sur projets dérivés

Les projets dérivés web pourront utiliser cette stack comme base recommandée.

Ils pourront adapter les composants à leur identité produit, à condition de :

- respecter les design tokens Enistere ou leurs extensions documentées ;
- ne pas casser les composants communs ;
- documenter les variantes spécifiques projet ;
- remonter vers la fondation les améliorations génériques ;
- éviter l'ajout de librairies UI concurrentes sans justification.

## 16. Impact sur accessibilité

Radix UI doit être privilégié pour les primitives complexes nécessitant une accessibilité solide : dialog, popover, dropdown, tabs, select, tooltip, accordion ou équivalent.

L'utilisation de Radix UI ne dispense pas de vérifier :

- navigation clavier ;
- focus visible ;
- labels et descriptions ;
- contraste ;
- rôles ARIA si nécessaires ;
- messages d'erreur accessibles ;
- états disabled, invalid et loading ;
- comportement responsive et mobile web.

L'accessibilité doit être vérifiée dans la documentation, les revues et les tests futurs.

## 17. Impact sur performance

La stack retenue doit rester compatible avec une performance web correcte.

Points à surveiller :

- classes Tailwind inutiles ou dupliquées ;
- composants client inutiles dans Next.js ;
- surutilisation d'animations ;
- bundle JavaScript ;
- primitives complexes chargées sans besoin ;
- rendu des grandes listes et tableaux ;
- Core Web Vitals ;
- images et médias.

Les composants doivent rester légers, composables et adaptés à l'App Router.

## 18. Impact sur IA / Codex / Claude Code

Les agents IA doivent utiliser cette ADR comme contrainte lors de la génération ou revue d'interfaces web.

Ils doivent :

- garder les design tokens Enistere comme source de vérité ;
- utiliser shadcn/ui comme base adaptable, pas comme identité produit ;
- privilégier Radix UI pour les primitives accessibles ;
- éviter les valeurs magiques non justifiées ;
- documenter les variantes et états ajoutés ;
- signaler les risques d'accessibilité ou de divergence avec le UI Kit ;
- ne pas ajouter de dépendance UI supplémentaire sans justification explicite.

L'IA assiste l'exécution et la revue, mais ne décide pas seule des évolutions structurantes.

## 19. Règles d'application

- Les design tokens Enistere restent la source de vérité.
- Tailwind doit consommer les tokens autant que possible.
- shadcn/ui sert de base adaptable, pas de vérité produit.
- Radix UI doit être privilégié pour les primitives complexes accessibles.
- Les composants doivent documenter leurs variantes, états et usages.
- Les composants critiques doivent gérer loading, disabled, error et success si pertinent.
- Aucune valeur magique ne doit être introduite sans justification.
- Les composants web doivent rester cohérents avec le UI Kit.
- Les changements structurants doivent être documentés.
- Les composants doivent être testables et accessibles.
- Les variantes doivent être limitées, nommées et justifiées.
- Les ajouts de librairies UI concurrentes doivent faire l'objet d'une justification ou d'une ADR si structurants.

## 20. Conditions de révision future

Cette décision pourra être revue si :

- la stack devient incompatible avec les besoins du Web Core Next.js ;
- Radix UI ou shadcn/ui ne répondent plus aux exigences d'accessibilité ;
- Tailwind CSS devient un frein de maintenabilité ;
- une librairie UI concurrente devient clairement plus adaptée ;
- les projets dérivés accumulent trop d'écarts ;
- les contraintes de performance imposent une stratégie différente ;
- le UI Kit évolue vers une architecture web incompatible avec cette stack.

Toute révision devra préserver la primauté des design tokens Enistere ou documenter explicitement son remplacement.

## 21. Conclusion

Enistere OS Foundation adopte Tailwind CSS, Radix UI et shadcn/ui comme stack UI web principale pour le Web Core Next.js et le UI Kit.

Cette stack doit accélérer la construction des interfaces web tout en conservant le contrôle des composants, l'alignement avec les design tokens Enistere, l'accessibilité et la capacité d'adaptation aux projets dérivés.
