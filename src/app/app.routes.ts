import { Routes } from '@angular/router';
import { ProductGridComponent } from './shared/product/product.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Buena mielda | Miel natural y apicultura',
  },
  {
    path: 'productos',
    component: ProductGridComponent,
    title: 'Productos | Buena mielda',
  },
  {
    path: '**',
    redirectTo: '',
  },
];