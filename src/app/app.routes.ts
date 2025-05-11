import { Routes } from '@angular/router';
import { KeywordListComponent } from './pages/keyword-list/keyword-list.component';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'tags',
        component: KeywordListComponent
    },
];
