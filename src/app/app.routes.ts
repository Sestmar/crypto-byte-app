import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // Al abrir la app, vamos al Login
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'tabs', // <--- ESTO ES LO QUE FALTABA
    // Cargamos el archivo de rutas de tabs que ya tenías
    loadChildren: () => import('./tabs/tabs.routes').then( m => m.routes)
  },
  // Rutas globales (fuera de los tabs)
  {
    path: 'coin-detail/:id',
    loadComponent: () => import('./pages/coin-detail/coin-detail.page').then( m => m.CoinDetailPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage)
  },
];