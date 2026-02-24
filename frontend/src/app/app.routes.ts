import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'sync', pathMatch: 'full' },
  {
    path: 'sync',
    loadComponent: () => import('./components/sync-panel/sync-panel.component').then(m => m.SyncPanelComponent),
  },
  {
    path: 'sync/:syncId/workitems',
    loadComponent: () => import('./components/work-item-list/work-item-list.component').then(m => m.WorkItemListComponent),
  },
  {
    path: 'sync/:syncId/workitems/:itemId',
    loadComponent: () => import('./components/work-item-detail/work-item-detail.component').then(m => m.WorkItemDetailComponent),
  },
];
