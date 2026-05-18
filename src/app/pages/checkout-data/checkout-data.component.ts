import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ShippingData } from '../../models/checkout.model';
import { AuthService } from '../../services/auth.service';
import { CheckoutService } from '../../services/checkout.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout-data',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout-data.component.html',
  styleUrl: './checkout-data.component.scss',
})
export class CheckoutDataComponent {
  private readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  readonly order = this.orderService.lastOrder;
  readonly submitted = signal(false);
  readonly errorMessage = signal('');

  readonly form = signal<ShippingData>({
    email: this.authService.getAuthenticatedEmail(),
    newsletter: false,
    nombre: '',
    apellidos: '',
    direccion: '',
    observaciones: '',
    ciudad: '',
    codigoPostal: '',
    poblacion: '',
    pais: 'Espana',
    guardarDatos: true,
  });

  readonly canSubmit = computed(() => {
    const value = this.form();

    return (
      this.isEmailValid(value.email) &&
      value.nombre.trim().length >= 2 &&
      value.apellidos.trim().length >= 2 &&
      value.direccion.trim().length >= 5 &&
      value.ciudad.trim().length >= 2 &&
      value.codigoPostal.trim().length >= 4 &&
      value.poblacion.trim().length >= 2 &&
      value.pais.trim().length >= 2
    );
  });

  updateField<K extends keyof ShippingData>(
    field: K,
    value: ShippingData[K],
  ): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
  }

  continueToPayment(): void {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (!this.authService.hasActiveSession()) {
      this.errorMessage.set('Inicia sesion para continuar con la compra.');
      return;
    }

    if (!this.order()) {
      this.errorMessage.set('No hay ningun pedido pendiente para completar.');
      return;
    }

    if (!this.canSubmit()) {
      this.errorMessage.set('Revisa los datos de envio antes de continuar.');
      return;
    }

    this.checkoutService.saveShippingData(this.form());
    this.router.navigate(['/pago']);
  }

  showRequiredError(field: keyof ShippingData): boolean {
    const value = this.form()[field];
    return (
      this.submitted() && typeof value === 'string' && value.trim().length === 0
    );
  }

  showEmailError(): boolean {
    return this.submitted() && !this.isEmailValid(this.form().email);
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
}
