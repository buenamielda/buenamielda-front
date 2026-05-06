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
    path: 'productos/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
    title: 'Detalle de producto | Buena mielda',
  },
  {
     path: 'admin/productos',
    loadComponent: () =>
      import('./pages/admin-products/admin-products.component').then(
        (m) => m.AdminProductsComponent
      ),
    title: 'Administrar productos | Buena mielda',
  },
  {
    path: '**',
    redirectTo: '',
  },
];