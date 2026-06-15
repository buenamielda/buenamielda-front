import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { from, finalize, switchMap } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { CheckoutService } from '../../services/checkout.service';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';

import {
  Stripe,
  StripeElements,
  StripeCardElement,
  loadStripe,
} from '@stripe/stripe-js';

import { AfterViewInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaymentFailedError, PaymentService } from '../../services/payment.service';

interface PaymentForm {
  billingSameAsShipping: boolean;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);

  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  
  private stripe: Stripe | null = null;
  private elements!: StripeElements;
  private card!: StripeCardElement;

  readonly address = this.checkoutService.address;
  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = signal<PaymentForm>({
    billingSameAsShipping: true,
  });

  readonly canSubmit = computed(() => true);

  async ngAfterViewInit() {
    this.stripe = await loadStripe(environment.stripePublicKey);

    if (!this.stripe) {
      return;
    }

    this.elements = this.stripe.elements();

    this.card = this.elements.create('card', {
      hidePostalCode: true
    });

    this.card.mount('#card-element');
  }

  updateField<K extends keyof PaymentForm>(
    field: K,
    value: PaymentForm[K],
  ): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
  }

  pay(): void {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (!this.authService.hasActiveSession()) {
      this.errorMessage.set('Inicia sesión para poder pagar el pedido.');
      return;
    }

    const address = this.address();

    if (!address) {
      this.errorMessage.set('Selecciona primero una dirección de envío.');
      return;
    }

    if (this.items().length === 0) {
      this.errorMessage.set('El carrito está vacío.');
      return;
    }

    if (!this.canSubmit()) {
      this.errorMessage.set('Revisa los datos de pago antes de continuar.');
      return;
    }

    this.loading.set(true);

    from(this.stripe!.createToken(this.card))
    .pipe(
      switchMap((result) => {
        if(result.error) {
          throw new PaymentFailedError(result.error.message);
        }

        return this.orderService.createFromCart(address.id, result.token!.id);
      }),
      finalize(() => this.loading.set(false)),
    )
    .subscribe({
      next: () => {
        this.router.navigate(['/pedido-confirmado']);
      },
      error: () => {
        this.errorMessage.set('No se ha podido procesar el pago.');
      },
    });
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  shippingAddress(): string {
    const address = this.address();

    if (!address) {
      return 'Dirección pendiente';
    }

    return `${address.direccion}, ${address.codigoPostal}, ${address.localidad}`;
  }

  email(): string {
    return this.authService.getAuthenticatedEmail() || 'Email pendiente';
  }
}
