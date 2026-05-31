import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ShippingData } from '../../models/checkout.model';
import { AuthService } from '../../services/auth.service';
import { CheckoutService } from '../../services/checkout.service';
import { CartService } from '../../services/cart.service';
import { ShippingAddressService } from '../../services/shipping-address.service';
import { CreateShippingAddressRequest } from '../../models/shipping-address.model';

@Component({
  selector: 'app-checkout-data',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout-data.component.html',
  styleUrl: './checkout-data.component.scss',
})
export class CheckoutDataComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly submitted = signal(false);
  readonly errorMessage = signal('');
  readonly creatingAddress = signal(false);
  readonly createAddressError = signal('');
  readonly createAddressSuccess = signal('');
  readonly shippingAddressService = inject(ShippingAddressService);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly addresses = this.shippingAddressService.addresses;
  readonly addressesLoading = this.shippingAddressService.loading;
  readonly addressesError = this.shippingAddressService.errorMessage;

  readonly newAddressForm = signal<CreateShippingAddressRequest>({
    nombreDestinatario: '',
    telefono: '',
    direccion: '',
    codigoPostal: '',
    localidad: '',
    provincia: '',
    pais: 'Espana',
    principal: false,
  });

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

  ngOnInit(): void {
    if (!this.authService.hasActiveSession()) {
      this.router.navigate(['/login']);
      return;
    }

    this.shippingAddressService.loadAddresses();
  }

  updateField<K extends keyof ShippingData>(
    field: K,
    value: ShippingData[K],
  ): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
  }

  updateNewAddressField<K extends keyof CreateShippingAddressRequest>(
    field: K,
    value: CreateShippingAddressRequest[K],
  ): void {
    this.newAddressForm.update((current) => ({
      ...current,
      [field]: value,
    }));

    this.createAddressError.set('');
    this.createAddressSuccess.set('');
  }

  createAddress(): void {
    const address = this.newAddressForm();

    this.createAddressError.set('');
    this.createAddressSuccess.set('');

    if (
      address.nombreDestinatario.trim().length < 2 ||
      !/^\+?[0-9]{7,15}$/.test(address.telefono.trim()) ||
      address.direccion.trim().length < 5 ||
      !/^[0-9]{5}$/.test(address.codigoPostal.trim()) ||
      address.localidad.trim().length < 2 ||
      address.provincia.trim().length < 2 ||
      address.pais.trim().length < 2
    ) {
      this.createAddressError.set('Revisa los datos de la nueva direccion.');
      return;
    }

    this.creatingAddress.set(true);

    this.shippingAddressService.createAddress(address).subscribe({
      next: () => {
        this.creatingAddress.set(false);
        this.createAddressSuccess.set('Direccion guardada correctamente.');

        this.newAddressForm.set({
          nombreDestinatario: '',
          telefono: '',
          direccion: '',
          codigoPostal: '',
          localidad: '',
          provincia: '',
          pais: 'Espana',
          principal: false,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.creatingAddress.set(false);
        this.createAddressError.set(
          error.error?.message ?? 'No ha sido posible guardar la direccion.',
        );
      },
    });
  }

  continueToPayment(): void {
    this.submitted.set(true);
    this.errorMessage.set('');

    if (!this.authService.hasActiveSession()) {
      this.errorMessage.set('Inicia sesion para continuar con la compra.');
      return;
    }

    if (!this.canSubmit()) {
      this.errorMessage.set('Revisa los datos de envio antes de continuar.');
      return;
    }

    this.checkoutService.saveShippingData(this.form());
    this.router.navigate(['/checkout/envio']);
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
