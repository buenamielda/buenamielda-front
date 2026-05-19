import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AuthRequiredError,
  EmptyCartError,
  OrderService,
} from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import {
  CartItem,
  CartService,
  PurchaseMode,
} from '../../services/cart.service';
import {
  InactiveStockProductError,
  InsufficientStockError,
} from '../../services/stock.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly itemCount = this.cartService.itemCount;

  readonly orderError = signal('');
  readonly creatingOrder = signal(false);

  increaseQuantity(item: CartItem): void {
    this.cartService.increase(item.product.id, item.purchaseMode);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.decrease(item.product.id, item.purchaseMode);
  }

  itemTotal(item: CartItem): number {
    return item.product.precio * item.quantity;
  }

  modeLabel(mode: PurchaseMode): string {
    return mode === 'subscription'
      ? 'Suscripción cada 4 semanas'
      : 'Compra única';
  }

  formatPrice(precio: number): string {
    return precio.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  removeItem(item: CartItem): void {
    this.cartService.remove(item.product.id, item.purchaseMode);
  }

  confirmCart(): void {
    if (!this.authService.hasActiveSession()) {
      this.orderError.set(
        'Inicia sesion para confirmar el carrito y generar el pedido.',
      );
      return;
    }

    const idUsuario = this.authService.getAuthenticatedUserId();

    if (!idUsuario) {
      this.orderError.set(
        'No se ha podido identificar el usuario autenticado.',
      );
      return;
    }

    this.creatingOrder.set(true);

    this.orderService
      .createFromCart({
        idUsuario,
        idCarrito: this.cartService.cartId,
      })
      .pipe(finalize(() => this.creatingOrder.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/checkout/datos']);
        },
        error: (error) => {
          if (
            error instanceof AuthRequiredError ||
            error instanceof EmptyCartError ||
            error instanceof InactiveStockProductError ||
            error instanceof InsufficientStockError
          ) {
            this.orderError.set(error.message);
            return;
          }

          this.orderError.set('No se ha podido generar el pedido.');
        },
      });
  }
}
