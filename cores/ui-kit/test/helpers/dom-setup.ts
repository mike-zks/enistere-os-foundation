/**
 * Environnement DOM pour les tests de composants sous `node:test`. Enregistre jsdom comme globals
 * (window/document/…) AVANT l'import de react-dom / Testing Library, et active l'environnement `act`
 * de React. À importer EN PREMIER dans chaque test de composant.
 */
import 'global-jsdom/register';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom n'implémente pas HTMLDialogElement.showModal/close — polyfill minimal pour les tests.
// Le composant dialog.tsx garde quand même un guard `typeof el.showModal === 'function'`
// pour les environnements SSR qui n'ont pas ce polyfill.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dialogProto = window.HTMLDialogElement?.prototype as any;
if (dialogProto && typeof dialogProto.showModal !== 'function') {
  dialogProto.showModal = function (this: HTMLElement) { this.setAttribute('open', ''); };
  dialogProto.close = function (this: HTMLElement) { this.removeAttribute('open'); };
}
