import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import {
  CartItem,
  CartService,
  PurchaseMode,
} from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly itemCount = this.cartService.itemCount;

  readonly orderError = signal('');
  readonly needsLogin = signal(false);
  readonly verifyingCart = signal(false);

  ngOnInit(): void {
    if (this.authService.hasActiveSession()) {
      this.refreshCart();
    }
  }

  increaseQuantity(item: CartItem): void {
    this.cartService.increase(item).subscribe({
      error: (error: HttpErrorResponse) => {
        this.orderError.set(this.getErrorMessage(error));
      },
    });
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.decrease(item).subscribe({
      error: (error: HttpErrorResponse) => {
        this.orderError.set(this.getErrorMessage(error));
      },
    });
  }

  removeItem(item: CartItem): void {
    this.cartService.remove(item).subscribe({
      error: (error: HttpErrorResponse) => {
        this.orderError.set(this.getErrorMessage(error));
      },
    });
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

  confirmCart(): void {
    this.orderError.set('');
    this.needsLogin.set(false);

    if (!this.authService.hasActiveSession()) {
      this.needsLogin.set(true);
      this.orderError.set(
        'Inicia sesión para confirmar el carrito y continuar con la compra.',
      );
      return;
    }

    this.verifyingCart.set(true);

    this.cartService
      .verifyCart()
      .pipe(finalize(() => this.verifyingCart.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/checkout/datos']);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.needsLogin.set(true);
          }

          this.orderError.set(this.getErrorMessage(error));
          this.refreshCart();
        },
      });
  }

  private refreshCart(): void {
    this.cartService.loadCart().subscribe({
      error: (error: HttpErrorResponse) => {
        if (error.status !== 204) {
          this.orderError.set(this.getErrorMessage(error));
        }
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return 'No se ha podido validar el carrito.';
  }
}