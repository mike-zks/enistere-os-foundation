import { Routes } from '@angular/router';

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
  {
    path: '**',
    redirectTo: APP_ROUTES.HOME,
  },
];
