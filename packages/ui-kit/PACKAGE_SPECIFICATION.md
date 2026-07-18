# UI Kit — Spécification du Core

## 1. Résumé exécutif

Le **UI Kit Enistere** définit le socle d'expérience utilisateur, de design system et de composants réutilisables pour les futurs produits Enistere.

Il doit fournir une base cohérente pour applications mobiles, applications web, dashboards, backoffices, portails clients, marketplaces, plateformes immobilières, outils métier, applications SaaS et interfaces IA.

Cette spécification est documentaire. Elle ne crée aucun composant réel, package UI, projet Storybook, `package.json`, dossier `src/`, dépendance ou code applicatif.

## 2. Rôle du core

Le rôle du UI Kit est de garantir une expérience utilisateur cohérente, accessible, réutilisable et maintenable sur les produits Enistere.

Il doit :

- centraliser les design tokens ;
- définir les composants communs ;
- standardiser les états UI ;
- guider les usages web et mobile ;
- réduire la duplication visuelle ;
- soutenir les cores React Native, Next.js, Flutter et Angular ;
- préparer la documentation visuelle et les tests UI.

## 3. Objectifs du UI Kit

- Fournir une base UI cohérente pour tous les projets Enistere.
- Définir les tokens : couleurs, typographies, espacements, radius, ombres et motion.
- Standardiser les composants obligatoires.
- Prévoir des composants optionnels activables selon projet.
- Garantir l'accessibilité dès le départ.
- Supporter mobile-first et responsive web.
- Préparer dark mode et light mode.
- Assurer compatibilité avec Mobile Core React Native et Web Core Next.js.
- Préparer compatibilité Flutter et Angular.
- Rester générique, sans identité visuelle spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

## 4. Problèmes à résoudre

Le UI Kit doit éviter :

- composants réinventés dans chaque projet ;
- styles isolés hors système ;
- incohérences entre mobile et web ;
- accessibilité traitée trop tard ;
- états loading, empty, error ou success absents ;
- dark mode improvisé ;
- dépendance excessive à une librairie UI ;
- duplication entre Next.js et React Native ;
- design non documenté ;
- expérience utilisateur incohérente entre produits.

## 5. Périmètre fonctionnel

Le UI Kit couvre :

- principes UX/UI ;
- design tokens ;
- couleurs ;
- typographie ;
- espacements ;
- radius, shadows et élévation ;
- icônes ;
- motion ;
- thèmes ;
- dark/light mode ;
- accessibilité ;
- responsive design ;
- mobile-first ;
- composants obligatoires ;
- composants optionnels ;
- patterns UX ;
- états UI standards ;
- documentation composants ;
- guidelines UX/UI ;
- tests UI ;
- versioning ;
- intégrations multi-core.

## 6. Hors périmètre

Le UI Kit ne doit pas contenir :

- composant réel dans cette mission ;
- package UI réel ;
- Storybook réel ;
- dépendance installée ;
- identité de marque spécifique projet ;
- logique métier projet ;
- écrans complets propres à un produit ;
- choix définitif shadcn/ui, Radix UI, NativeWind, Storybook, Angular Material, PrimeNG ou Material 3 sans ADR si structurant ;
- code applicatif.

## 7. Architecture cible

L'architecture cible doit séparer :

- tokens agnostiques ;
- guidelines ;
- composants web ;
- composants mobile ;
- variantes ;
- états ;
- documentation ;
- tests ;
- exemples ;
- adaptations framework.

Principes :

- tokens d'abord ;
- composants ensuite ;
- états toujours définis ;
- accessibilité intégrée ;
- cohérence web/mobile ;
- adaptation framework sans divergence visuelle majeure ;
- principes communs sans imposer une implémentation identique sur toutes les plateformes ;
- documentation obligatoire.

## 8. Structure cible du futur UI Kit

Structure indicative du futur core :

```txt
packages/ui-kit/
├── README.md
├── PACKAGE_SPECIFICATION.md
├── ARCHITECTURE.md
├── INSTALLATION.md
├── USAGE.md
├── TESTING.md
├── SECURITY.md
├── DEPENDENCIES.md
├── ROADMAP.md
├── CHANGELOG.md
├── docs/
├── examples/
├── templates/
├── tokens/
├── guidelines/
├── web/
├── mobile-react-native/
├── mobile-flutter/
├── web-angular/
└── visual-docs/
```

Cette structure est cible. Elle ne doit pas être créée pendant cette mission.

## 9. Principes UX/UI

Le UI Kit doit appliquer :

- cohérence avant décoration ;
- simplicité avant complexité ;
- accessibilité dès le départ ;
- mobile-first ;
- responsive web ;
- feedback utilisateur immédiat ;
- états UI toujours prévus ;
- composants réutilisables ;
- design tokens centralisés ;
- pas de style isolé hors système ;
- documentation obligatoire ;
- adaptation aux contextes africains et ivoiriens si pertinent sans enfermer le design.

## 10. Design tokens

Les design tokens doivent être la source de vérité.

Ils doivent couvrir :

- couleurs ;
- typographies ;
- tailles ;
- espacements ;
- radius ;
- ombres ;
- élévation ;
- breakpoints ;
- z-index ;
- durées d'animation ;
- courbes de motion ;
- états interactifs.

Les tokens doivent être exportables en JSON à terme.

## 11. Système de couleurs

Le système de couleurs doit prévoir :

- palette primaire ;
- palette secondaire ;
- neutres ;
- couleurs sémantiques ;
- success ;
- warning ;
- error ;
- info ;
- disabled ;
- background ;
- surface ;
- border ;
- text ;
- overlay.

Les contrastes doivent respecter les bonnes pratiques WCAG autant que possible.

## 12. Typographie

La typographie doit définir :

- familles typographiques ;
- tailles ;
- poids ;
- line-height ;
- hiérarchie titres ;
- corps de texte ;
- labels ;
- captions ;
- erreurs ;
- textes de boutons.

Elle doit rester lisible sur mobile et web.

## 13. Espacements

Les espacements doivent être tokenisés.

Ils doivent couvrir :

- spacing vertical ;
- spacing horizontal ;
- padding composants ;
- gap layouts ;
- marges sections ;
- densité dashboard ;
- densité mobile.

## 14. Radius, shadows et élévation

Le UI Kit doit définir :

- radius par défaut ;
- radius composants ;
- shadows web ;
- élévation mobile ;
- niveaux de surface ;
- usage limité des ombres décoratives ;
- cohérence entre card, modal, drawer et toast.

## 15. Icônes

La stratégie icônes doit prévoir :

- librairie ou set cohérent ;
- tailles ;
- stroke/fill ;
- icônes sémantiques ;
- accessibilité ;
- fallback texte si nécessaire ;
- usage dans IconButton ;
- cohérence web/mobile.

Le choix exact de librairie doit être validé si structurant.

## 16. Motion et animations

La motion doit rester utile.

Elle doit prévoir :

- transitions courtes ;
- feedback d'interaction ;
- animations de loading ;
- transitions modals/drawers/bottom sheets ;
- réduction motion si nécessaire ;
- performance mobile ;
- absence d'animations décoratives excessives.

## 17. Thèmes

Le système de thèmes doit permettre :

- thème par défaut ;
- extensions projet contrôlées ;
- overrides limités ;
- tokens partagés ;
- cohérence composants ;
- documentation des variantes.

Les projets dérivés ne doivent pas créer de thème contradictoire sans justification.

## 18. Dark mode / light mode

Le UI Kit doit prévoir :

- light mode ;
- dark mode si validé ;
- tokens par thème ;
- contrastes vérifiés ;
- surfaces ;
- borders ;
- états ;
- icônes ;
- graphiques si activés.

## 19. Accessibilité

Le UI Kit doit prévoir :

- contrastes ;
- tailles tactiles ;
- labels ;
- lecteurs d'écran ;
- focus visible web ;
- navigation clavier web ;
- erreurs accessibles ;
- textes compréhensibles ;
- composants interactifs accessibles ;
- respect des bonnes pratiques WCAG autant que possible.

## 20. Responsive design

Le responsive web doit cadrer :

- breakpoints ;
- layouts fluides ;
- navigation desktop/mobile ;
- tables responsives ;
- modals/drawers ;
- typographie ;
- spacing ;
- images.

## 21. Mobile-first

Le mobile-first doit guider :

- tailles tactiles ;
- densité ;
- performance ;
- navigation simple ;
- bottom sheets ;
- feedback immédiat ;
- contenu priorisé ;
- usage offline éventuel côté core mobile.

## 22. Composants obligatoires

Le UI Kit doit prévoir au minimum :

- Button ;
- IconButton ;
- Input ;
- Textarea ;
- Select ;
- Checkbox ;
- Radio ;
- Switch ;
- FormField ;
- Label ;
- HelperText ;
- ErrorText ;
- Card ;
- Badge ;
- Avatar ;
- Divider ;
- Spinner ;
- Skeleton ;
- EmptyState ;
- ErrorState ;
- SuccessState ;
- Alert ;
- Toast ;
- Modal/Dialog ;
- ConfirmationDialog ;
- BottomSheet pour mobile ;
- Header ;
- AppBar ;
- Sidebar pour web ;
- Tabs ;
- Breadcrumbs ;
- ListItem ;
- SectionHeader ;
- ScreenContainer ;
- PageContainer.

## 23. Composants optionnels

Ces composants doivent être activables selon projet :

- DataTable ;
- Pagination ;
- FilterBar ;
- SearchInput ;
- CommandPalette ;
- DatePicker ;
- TimePicker ;
- FileUploader ;
- ImagePicker UI ;
- Carousel ;
- Slider ;
- Stepper ;
- Timeline ;
- Charts wrappers ;
- MapCard ;
- LocationPicker ;
- QRCodeDisplay ;
- QRCodeScanner UI ;
- ChatBubble ;
- NotificationItem ;
- Rating ;
- ReviewCard ;
- OnboardingScreen ;
- EmptyDashboard ;
- StatCard ;
- MetricCard ;
- PricingCard.

## 24. Composants futurs

Les composants futurs peuvent inclure :

- AI Assistant Panel ;
- Workflow Builder UI ;
- Rich Text Editor ;
- Kanban Board ;
- Calendar/Scheduler ;
- Advanced Map Explorer ;
- Data Explorer ;
- Audit Timeline ;
- Permission Matrix ;
- Theme Builder.

Ces composants nécessitent validation de roadmap et ADR si dépendances lourdes.

## 25. Composants formulaires

Les formulaires doivent prévoir :

- labels ;
- helper text ;
- erreurs ;
- required state ;
- état invalid ;
- état disabled ;
- état focused ;
- validation visuelle ;
- accessibilité ;
- compatibilité React Hook Form/Zod côté web et mobile.

## 26. Composants navigation

La navigation doit couvrir :

- Header ;
- AppBar ;
- Sidebar ;
- Tabs ;
- Breadcrumbs ;
- Bottom navigation si nécessaire ;
- drawer mobile si nécessaire ;
- menu utilisateur ;
- navigation responsive ;
- états actifs ;
- accessibilité clavier et lecteur d'écran selon plateforme.

## 27. Composants feedback

Le feedback doit couvrir :

- Alert ;
- Toast ;
- Spinner ;
- Skeleton ;
- EmptyState ;
- ErrorState ;
- SuccessState ;
- Progress ;
- status badges.

## 28. Composants overlay

Les overlays doivent couvrir :

- Modal/Dialog ;
- ConfirmationDialog ;
- Drawer ;
- BottomSheet ;
- Popover ;
- Tooltip ;
- Menu ;
- gestion focus ;
- fermeture accessible.

## 29. Composants data display

Le data display doit couvrir :

- Card ;
- ListItem ;
- Table ;
- DataTable optionnelle ;
- Badge ;
- Avatar ;
- StatCard ;
- MetricCard ;
- Timeline ;
- Pagination ;
- FilterBar ;
- tri ;
- responsive data display.

## 30. Composants media

Les médias doivent couvrir :

- Avatar ;
- Image ;
- ImagePicker UI ;
- FileUploader ;
- Carousel optionnel ;
- QRCodeDisplay ;
- états de chargement ;
- alt text ou labels selon plateforme.

## 31. Composants maps éventuels

Les composants maps sont optionnels.

Ils peuvent couvrir :

- MapCard ;
- LocationPicker ;
- MarkerCard ;
- RouteSummary ;
- MapLegend ;
- zone/polygon display ;
- intégration avec Mobile/Web cores ;
- absence de choix provider sans ADR.

## 32. Patterns UX

Le UI Kit doit documenter :

- création ;
- édition ;
- suppression ;
- confirmation ;
- recherche ;
- filtrage ;
- pagination ;
- upload ;
- onboarding ;
- empty dashboard ;
- erreur réseau ;
- accès refusé ;
- mode offline ;
- action destructive.

## 33. États UI standards

Le UI Kit doit standardiser :

- loading ;
- empty ;
- error ;
- success ;
- disabled ;
- focused ;
- pressed ;
- selected ;
- invalid ;
- offline ;
- unauthorized ;
- forbidden.

## 34. Gestion loading / empty / error / success

Chaque composant ou pattern doit prévoir :

- état initial ;
- loading ;
- empty ;
- error ;
- success ;
- retry ;
- message utilisateur clair ;
- action suivante possible.

## 35. Design system web

Le design system web doit prévoir :

- Tailwind CSS comme cible possible ;
- shadcn/ui comme base web possible ;
- Radix UI comme primitive web possible ;
- composants dashboard ;
- navigation responsive ;
- tables ;
- formulaires ;
- modals/drawers ;
- SEO pour pages publiques.

Ces choix doivent être confirmés par ADR si structurants.

## 36. Design system mobile

Le design system mobile doit prévoir :

- tokens partagés ;
- composants React Native ;
- tailles tactiles ;
- AppBar ;
- BottomSheet ;
- ScreenContainer ;
- formulaires mobiles ;
- feedback tactile ;
- performance.

## 37. Compatibilité React Native

Le UI Kit doit être compatible avec Mobile Core React Native.

Options techniques possibles :

- StyleSheet/ThemeProvider ;
- NativeWind si validé ;
- composants maison ;
- tokens exportés ;
- Storybook React Native ou alternative future.

NativeWind ou toute librairie structurante nécessite validation si retenue.

## 38. Compatibilité Next.js

Le UI Kit doit être compatible avec Web Core Next.js.

Options techniques possibles :

- Tailwind CSS ;
- shadcn/ui ;
- Radix UI ;
- tokens CSS variables ;
- documentation visuelle ;
- composants accessibles.

shadcn/ui et Radix UI doivent être validés si leur adoption devient structurante.

## 39. Compatibilité Flutter

Le UI Kit doit préparer une compatibilité Flutter.

Options possibles :

- Material 3 ;
- composants maison ;
- tokens exportés ;
- thème Flutter ;
- documentation d'adaptation.

Material 3 ou une approche maison devra être validé si structurant.

## 40. Compatibilité Angular

Le UI Kit doit préparer une compatibilité Angular.

Options possibles :

- Angular Material ;
- PrimeNG ;
- composants maison ;
- tokens CSS ;
- documentation d'adaptation.

Angular Material ou PrimeNG devra être tranché par ADR si structurant.

## 41. Documentation des composants

Chaque composant doit documenter :

- rôle ;
- usage ;
- variantes ;
- props ou paramètres ;
- états ;
- accessibilité ;
- exemples ;
- do / don't ;
- erreurs fréquentes ;
- guidelines de contenu ;
- différences web/mobile si applicables.

## 42. Guidelines UX/UI

Les guidelines doivent couvrir :

- hiérarchie visuelle ;
- densité ;
- formulaires ;
- navigation ;
- feedback ;
- contenus ;
- confirmations ;
- erreurs ;
- accessibilité ;
- responsive ;
- mobile-first ;
- adaptation contexte local si pertinent.

## 43. Storybook ou documentation visuelle future

Une documentation visuelle pourra être ajoutée plus tard.

Options possibles :

- Storybook ;
- Ladle ;
- React Native Storybook ;
- documentation statique ;
- Figma comme source design possible.

Le choix Storybook/Ladle/alternative doit être validé par ADR si structurant.

## 44. Tests attendus

Le UI Kit doit prévoir :

- tests composants critiques ;
- tests états UI ;
- tests accessibilité ;
- tests responsive ;
- tests formulaires ;
- tests navigation UI ;
- tests visuels éventuels ;
- tests dark/light mode ;
- tests intégration mobile/web si applicable.
- tests de non-régression visuelle si une solution est validée.

## 45. Qualité et lint

Le futur UI Kit doit prévoir :

- lint ;
- format ;
- typecheck si TypeScript ;
- tests ;
- conventions de nommage ;
- conventions de variants ;
- contrôle accessibilité ;
- contrôle design tokens ;
- documentation des commandes qualité.

## 46. Versioning du UI Kit

Le UI Kit doit être versionné avec prudence.

Règles :

- SemVer recommandé ;
- changements visuels majeurs documentés ;
- breaking changes explicités ;
- changelog maintenu ;
- release notes maintenues ;
- migration guides si nécessaire ;
- compatibilité avec mobile et web ;
- stabilité des tokens ;
- version des tokens ;
- version des composants.

## 47. Sécurité UI

Le UI Kit doit couvrir :

- ne pas afficher d'informations sensibles par erreur ;
- masquer les données sensibles si nécessaire ;
- confirmations pour actions destructives ;
- prévention des erreurs utilisateur ;
- gestion propre des messages d'erreur ;
- éviter l'injection HTML non maîtrisée ;
- ne pas afficher de secrets ou tokens ;
- éviter les logs UI sensibles.

## 48. Performance UI

La performance UI doit prévoir :

- composants légers ;
- éviter re-renders inutiles ;
- listes performantes ;
- virtualisation pour listes longues si applicable ;
- images optimisées ;
- animations maîtrisées ;
- temps de rendu surveillé ;
- lazy loading si pertinent ;
- bundle web surveillé ;
- performance mobile.

## 49. Internationalisation et contenus

Le UI Kit doit préparer :

- textes courts ;
- messages compréhensibles ;
- labels localisables ;
- formats date/nombre ;
- contenus RTL si besoin futur ;
- guidelines de ton ;
- éviter textes codés en dur dans composants bas niveau.

## 50. Intégration avec Mobile Core React Native

Le UI Kit doit fournir au Mobile Core React Native :

- tokens ;
- composants mobiles ;
- ScreenContainer ;
- BottomSheet ;
- formulaires ;
- états UI ;
- accessibilité ;
- dark/light mode si validé.

## 51. Intégration avec Mobile Core Flutter

Le UI Kit doit préparer pour Flutter :

- tokens exportables ;
- mapping Material 3 ou composants maison ;
- guidelines mobile ;
- composants équivalents ;
- documentation d'adaptation.

## 52. Intégration avec Web Core Next.js

Le UI Kit doit fournir au Web Core Next.js :

- tokens ;
- composants web ;
- layout dashboard ;
- navigation ;
- formulaires ;
- tables ;
- modals/drawers ;
- SEO-friendly public UI si nécessaire ;
- accessibilité.

## 53. Intégration avec Web Core Angular

Le UI Kit doit préparer pour Angular :

- tokens ;
- mapping Angular Material ou PrimeNG ;
- composants équivalents ;
- guidelines dashboard ;
- documentation d'adaptation.

## 54. Intégration avec IA Core

L'IA Core peut aider à :

- générer documentation composants ;
- relire accessibilité ;
- vérifier cohérence tokens ;
- proposer variantes ;
- produire tests ;
- détecter incohérences web/mobile.

L'IA ne doit pas :

- créer une identité visuelle hors système ;
- ajouter dépendance UI sans justification ;
- modifier tokens structurants sans validation ;
- générer un UI Kit complet non relu.

## 55. Intégration avec Factory Quality

Factory Quality doit relayer :

- tests composants ;
- tests accessibilité ;
- tests visuels si validés ;
- lint ;
- typecheck ;
- contrôle tokens ;
- critères de release UI Kit.

## 56. Intégration avec Documentation

Documentation doit soutenir :

- documentation composants ;
- guidelines UX/UI ;
- ADR design tokens ;
- changelogs ;
- guides migration ;
- checklists accessibilité ;
- runbooks release UI Kit.

## 57. Documentation obligatoire du core

À terme, le core devra contenir :

- `README.md` ;
- `PACKAGE_SPECIFICATION.md` ;
- `ARCHITECTURE.md` ;
- `USAGE.md` ;
- `TESTING.md` ;
- `SECURITY.md` ;
- `DEPENDENCIES.md` ;
- `ROADMAP.md` ;
- `CHANGELOG.md` ;
- documentation tokens ;
- documentation composants ;
- guidelines UX/UI ;
- guides accessibilité ;
- guides migration.

## 58. Roadmap du core

### V0 : spécification et cadrage

- Créer `PACKAGE_SPECIFICATION.md`.
- Identifier les ADR nécessaires.
- Valider le périmètre V1.

### V1 : tokens + composants de base + états UI

- Définir tokens initiaux.
- Définir composants obligatoires prioritaires.
- Définir états UI standards.
- Définir accessibilité minimale.
- Documenter usage initial.

### V2 : formulaires, navigation, feedback, documentation

- Stabiliser composants formulaires.
- Stabiliser navigation.
- Stabiliser feedback utilisateur.
- Ajouter documentation visuelle si validée.
- Ajouter tests composants critiques.

### V3 : data display, charts, maps UI, composants avancés

- Ajouter data display avancé.
- Ajouter charts wrappers si validés.
- Ajouter maps UI si validé.
- Ajouter composants avancés.
- Ajouter tests visuels si validés.

### VF : UI Kit multi-plateforme complet, documenté et versionné

- Stabiliser web ;
- Stabiliser React Native ;
- Préparer Flutter ;
- Préparer Angular ;
- Versionner tokens et composants ;
- Documenter migrations ;
- Maintenir compatibilité multi-core.

## 59. Critères d'acceptation V1

La V1 sera acceptable si :

- les tokens initiaux sont définis ;
- les composants obligatoires prioritaires sont spécifiés ;
- les états UI standards sont définis ;
- l'accessibilité minimale est documentée ;
- les guidelines UX/UI de base existent ;
- la compatibilité Mobile Core React Native est claire ;
- la compatibilité Web Core Next.js est claire ;
- aucune identité projet spécifique n'est imposée ;
- la documentation minimale existe.

## 60. Critères d'acceptation version finale

La version finale sera acceptable si :

- le UI Kit est multi-plateforme ;
- les tokens sont versionnés ;
- les composants obligatoires sont stables ;
- les composants optionnels sont documentés si activés ;
- l'accessibilité est testée ;
- dark/light mode sont documentés si activés ;
- les guidelines sont complètes ;
- les migrations sont documentées ;
- les ADR structurants sont présents ;
- les projets dérivés peuvent l'utiliser sans logique métier imposée.

## 61. Risques

- Créer un système trop complexe trop tôt.
- Copier une librairie UI sans stratégie propre.
- Avoir des tokens incohérents entre web et mobile.
- Forcer une uniformité visuelle qui ignore les contraintes de plateforme.
- Négliger l'accessibilité.
- Créer des composants trop spécifiques projet.
- Multiplier les variantes inutiles.
- Ne pas documenter les états.
- Rendre les migrations visuelles difficiles.
- Ajouter trop de dépendances UI.
- Laisser l'IA générer des composants incohérents.

## 62. Anti-patterns interdits

- Style isolé hors tokens.
- Composant sans état loading/error/disabled si applicable.
- Composant non accessible.
- Couleurs codées en dur dans les composants.
- Identité visuelle projet imposée au core.
- Implémentation identique imposée à toutes les plateformes malgré des contraintes différentes.
- Dépendance UI ajoutée par confort.
- Composant contenant logique métier projet.
- Dark mode improvisé sans tokens.
- Documentation composant absente.
- Génération massive de composants sans revue.

## 63. Checklist de validation

- [ ] Le périmètre du UI Kit est clair.
- [ ] Le hors périmètre est explicite.
- [ ] Les principes UX/UI sont définis.
- [ ] Les design tokens sont cadrés.
- [ ] Les composants obligatoires sont listés.
- [ ] Les composants optionnels sont séparés.
- [ ] Les états UI standards sont définis.
- [ ] Accessibilité couverte.
- [ ] Web et mobile sont couverts.
- [ ] Compatibilités Flutter et Angular sont préparées.
- [ ] Tests attendus sont définis.
- [ ] Versioning UI Kit est cadré.
- [ ] SemVer, changelog, release notes et migrations sont prévus.
- [ ] Sécurité UI est couverte.
- [ ] Décisions à ADR sont identifiées.
- [ ] Aucun composant réel n'est généré.

## 64. Conclusion

Le UI Kit Enistere doit devenir le socle d'expérience utilisateur commun aux produits Enistere. Il doit garantir la cohérence visuelle, l'accessibilité, la réutilisabilité et la maintenabilité des interfaces web et mobiles.

Cette spécification définit le périmètre final attendu sans créer de composant ni package. Les choix structurants, notamment shadcn/ui, Radix UI, NativeWind, Storybook/Ladle, React Native Storybook, Material 3, Angular Material, PrimeNG, librairie d'icônes et documentation visuelle, devront être validés avant implémentation et documentés par ADR si leur impact est structurant.
