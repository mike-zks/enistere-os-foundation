import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const APP_ROUTES = {
  HOME: '',
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
} as const;

export const routes: Routes = [
  {
    path: APP_ROUTES.HOME,
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Enistere Angular',
  },
  {
    path: APP_ROUTES.LOGIN,
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Connexion — Enistere',
  },
  {
    path: APP_ROUTES.DASHBOARD,
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Dashboard — Enistere',
  },
  {
    path: '**',
    redirectTo: APP_ROUTES.HOME,
  },
];
