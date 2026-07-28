import { Routes } from '@angular/router';
import { CAPABILITY_ROUTES } from './core/composition/capability-routes';

export const APP_ROUTES = {
  HOME: '',
} as const;

export const routes: Routes = [
  {
    path: APP_ROUTES.HOME,
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Enistere Angular',
  },
  // Les routes des capabilities composées s'insèrent AVANT le joker : sinon
  // toute route apportée serait redirigée vers l'accueil sans jamais s'ouvrir.
  ...CAPABILITY_ROUTES,
  {
    path: '**',
    redirectTo: APP_ROUTES.HOME,
  },
];
