import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import {
  OrderNotFoundError,
  OrderOwnershipError,
  OrderService,
  OrderStateError,
  PaymentAmountError,
} from '../../services/order.service';
import {
  PaymentFailedError,
  PaymentService,
} from '../../services/payment.service';

interface PaymentForm {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  billingSameAsShipping: boolean;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);

  readonly order = this.orderService.lastOrder;
  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = signal<PaymentForm>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    billingSameAsShipping: true,
  });

  readonly canSubmit = computed(() => {
    const value = this.form();

    return (
      value.cardNumber.replace(/\s/g, '').length >= 12 &&
      value.cardHolder.trim().length >= 3 &&
      value.expiryDate.trim().length >= 4 &&
      value.cvv.trim().length >= 3
    );
  });

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

    const order = this.order();
    const idUsuario = this.authService.getAuthenticatedUserId();

    if (!order) {
      this.errorMessage.set('No hay ningun pedido pendiente de pago.');
      return;
    }

    if (!idUsuario) {
      this.errorMessage.set('Inicia sesion para poder pagar el pedido.');
      return;
    }

    if (!this.canSubmit()) {
      this.errorMessage.set('Revisa los datos de pago antes de continuar.');
      return;
    }

    this.loading.set(true);

    this.paymentService
      .payOrder({
        idPedido: order.id,
        idUsuario,
        importe: order.total,
        metodoPago: 'TARJETA',
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/pedido-confirmado']);
        },
        error: (error) => {
          if (
            error instanceof OrderNotFoundError ||
            error instanceof OrderOwnershipError ||
            error instanceof OrderStateError ||
            error instanceof PaymentAmountError ||
            error instanceof PaymentFailedError
          ) {
            this.errorMessage.set(error.message);
            return;
          }

          this.errorMessage.set('No se ha podido procesar el pago.');
        },
      });
  }

  showCardNumberError(): boolean {
    return (
      this.submitted() && this.form().cardNumber.replace(/\s/g, '').length < 12
    );
  }

  showHolderError(): boolean {
    return this.submitted() && this.form().cardHolder.trim().length < 3;
  }

  showExpiryError(): boolean {
    return this.submitted() && this.form().expiryDate.trim().length < 4;
  }

  showCvvError(): boolean {
    return this.submitted() && this.form().cvv.trim().length < 3;
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }
}
