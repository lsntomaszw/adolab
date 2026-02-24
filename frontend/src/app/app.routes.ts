import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'workitems', pathMatch: 'full' },
  {
    path: 'workitems',
    loadComponent: () => import('./components/work-item-list/work-item-list.component').then(m => m.WorkItemListComponent),
  },
  {
    path: 'workitems/:itemId',
    loadComponent: () => import('./components/work-item-detail/work-item-detail.component').then(m => m.WorkItemDetailComponent),
  },
];
