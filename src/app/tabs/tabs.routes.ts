import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'market',
        loadComponent: () => import('../pages/market/market.page').then(m => m.MarketPage),
      },
      {
        path: 'trending',
        loadComponent: () => import('../pages/trending/trending.page').then(m => m.TrendingPage),
      },
      {
        path: 'search',
        loadComponent: () => import('../pages/search/search.page').then(m => m.SearchPage),
      },
      {
        path: 'portfolio',
        loadComponent: () => import('../pages/portfolio/portfolio.page').then(m => m.PortfolioPage),
      },
      {
        path: 'stats',
        loadComponent: () => import('../pages/stats/stats.page').then(m => m.StatsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/market',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/market',
    pathMatch: 'full',
  },
];