import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Enistere Angular',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
