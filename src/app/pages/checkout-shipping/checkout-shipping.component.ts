import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.scss',
})
export class CheckoutShippingComponent {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);

  readonly address = this.checkoutService.address;
  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;

  email(): string {
    return this.authService.getAuthenticatedEmail() || 'Email pendiente';
  }

  formatAddress(): string {
    const address = this.address();

    if (!address) {
      return 'Direccion pendiente';
    }

    return `${address.direccion}, ${address.codigoPostal}, ${address.localidad}`;
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }
}