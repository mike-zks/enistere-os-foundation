/**
 * Environnement DOM pour les tests de composants sous `node:test`. Enregistre jsdom comme globals
 * (window/document/…) AVANT l'import de react-dom / Testing Library, et active l'environnement `act`
 * de React. À importer EN PREMIER dans chaque test de composant.
 */
import 'global-jsdom/register';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
