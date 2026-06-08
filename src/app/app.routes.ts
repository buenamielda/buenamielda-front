import { Routes } from '@angular/router';
import { ProductGridComponent } from './shared/product/product.component';
import { adminGuard } from './services/admin.guard';
import { authGuard } from './services/auth.guard';
import { blogEditorGuard } from './services/blog-editor.guard';

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
    path: 'productos/filtros',
    loadComponent: () =>
      import('./pages/product-filters/product-filters.component').then(
        (m) => m.ProductFiltersComponent,
      ),
    title: 'Filtrar productos | Buena mielda',
  },
  {
    path: 'productos/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
    title: 'Detalle de producto | Buena mielda',
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./pages/blog/blog.component').then((m) => m.BlogComponent),
    title: 'Blog educativo | Buena mielda',
  },
  {
    path: 'blog/crear',
    canActivate: [blogEditorGuard],
    loadComponent: () =>
      import('./pages/blog-create/blog-create.component').then(
        (m) => m.BlogCreateComponent,
      ),
    title: 'Crear entrada | Buena mielda',
  },
  {
    path: 'blog/:id/editar',
    canActivate: [blogEditorGuard],
    loadComponent: () =>
      import('./pages/blog-edit/blog-edit.component').then(
        (m) => m.BlogEditComponent,
      ),
    title: 'Modificar entrada | Buena mielda',
  },
  {
    path: 'blog/:id',
    loadComponent: () =>
      import('./pages/blog-detail/blog-detail.component').then(
        (m) => m.BlogDetailComponent,
      ),
    title: 'Detalle del blog | Buena mielda',
  },
  {
    path: 'admin/productos',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin-products/admin-products.component').then(
        (m) => m.AdminProductsComponent,
      ),
    title: 'Administrar productos | Buena mielda',
  },
  {
    path: 'admin/blog',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin-blog/admin-blog.component').then(
        (m) => m.AdminBlogComponent,
      ),
    title: 'Administrar blog | Buena mielda',
  },
  {
    path: 'admin/usuarios',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin-users/admin-users.component').then(
        (m) => m.AdminUsersComponent,
      ),
    title: 'Administrar usuarios | Buena mielda',
  },
  {
    path: 'admin/categorias',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin-categories/admin-categories.component').then(
        (m) => m.AdminCategoriesComponent,
      ),
    title: 'Administrar categorías | Buena mielda',
  },
  {
    path: 'carrito',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.CartComponent),
    title: 'Carrito | Buena mielda',
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
    title: 'Crear cuenta | Buena mielda',
  },
  {
    path: 'crear-cuenta',
    redirectTo: 'registro',
  },
  {
    path: 'cuenta',
    redirectTo: 'registro',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión | Buena mielda',
  },
  {
    path: 'pedido-confirmado',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/order-confirmation/order-confirmation.component').then(
        (m) => m.OrderConfirmationComponent,
      ),
    title: 'Pedido confirmado | Buena mielda',
  },
  {
    path: 'pago',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/payment/payment.component').then(
        (m) => m.PaymentComponent,
      ),
    title: 'Pago | Buena mielda',
  },
  {
    path: 'checkout/datos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout-data/checkout-data.component').then(
        (m) => m.CheckoutDataComponent,
      ),
    title: 'Datos de envío | Buena mielda',
  },
  {
    path: 'checkout/envio',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout-shipping/checkout-shipping.component').then(
        (m) => m.CheckoutShippingComponent,
      ),
    title: 'Método de envío | Buena mielda',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
