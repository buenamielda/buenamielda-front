import { Routes } from '@angular/router';
import { ProductGridComponent } from './shared/product/product.component';
import { adminGuard } from './services/admin.guard';

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
        (m) => m.ProductDetailComponent,
      ),
    title: 'Detalle de producto | Buena mielda',
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
    path: 'carrito',
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
    title: 'Iniciar sesion | Buena mielda',
  },
  {
    path: 'pedido-confirmado',
    loadComponent: () =>
      import('./pages/order-confirmation/order-confirmation.component').then(
        (m) => m.OrderConfirmationComponent,
      ),
    title: 'Pedido confirmado | Buena mielda',
  },
  {
    path: 'pago',
    loadComponent: () =>
      import('./pages/payment/payment.component').then(
        (m) => m.PaymentComponent,
      ),
    title: 'Pago | Buena mielda',
  },
  {
    path: 'checkout/datos',
    loadComponent: () =>
      import('./pages/checkout-data/checkout-data.component').then(
        (m) => m.CheckoutDataComponent,
      ),
    title: 'Datos de envio | Buena mielda',
  },
  {
    path: 'checkout/envio',
    loadComponent: () =>
      import('./pages/checkout-shipping/checkout-shipping.component').then(
        (m) => m.CheckoutShippingComponent,
      ),
    title: 'Metodo de envio | Buena mielda',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
