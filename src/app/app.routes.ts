import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'market',
    loadComponent: () => import('./pages/market/market.page').then( m => m.MarketPage)
  },
  {
    path: 'trending',
    loadComponent: () => import('./pages/trending/trending.page').then( m => m.TrendingPage)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then( m => m.SearchPage)
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./pages/portfolio/portfolio.page').then( m => m.PortfolioPage)
  },
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats.page').then( m => m.StatsPage)
  },
  {
    path: 'coin-detail/:id', // Añadimos /:id para recibir el parámetro
    loadComponent: () => import('./pages/coin-detail/coin-detail.page').then( m => m.CoinDetailPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage)
  },
];
