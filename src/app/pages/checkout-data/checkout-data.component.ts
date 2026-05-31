import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ShippingData } from '../../models/checkout.model';
import {
  CreateShippingAddressRequest,
  ShippingAddress,
} from '../../models/shipping-address.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CheckoutService } from '../../services/checkout.service';
import { ShippingAddressService } from '../../services/shipping-address.service';

type AddressField =
  | 'nombreDestinatario'
  | 'telefono'
  | 'direccion'
  | 'codigoPostal'
  | 'localidad'
  | 'provincia'
  | 'pais';

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

  readonly shippingAddressService = inject(ShippingAddressService);

  readonly submitted = signal(false);
  readonly savingAddress = signal(false);
  readonly editingAddressId = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly addresses = this.shippingAddressService.addresses;
  readonly addressesLoading = this.shippingAddressService.loading;
  readonly addressesError = this.shippingAddressService.errorMessage;

  readonly form = signal<ShippingData>({
    email: this.authService.getAuthenticatedEmail(),
    newsletter: false,
    nombreDestinatario: '',
    telefono: '',
    direccion: '',
    codigoPostal: '',
    localidad: '',
    provincia: '',
    pais: 'Espana',
    principal: false,
  });

  readonly canSubmit = computed(() => {
    return (
      this.isEmailValid(this.form().email) &&
      !this.getAddressFieldError('nombreDestinatario') &&
      !this.getAddressFieldError('telefono') &&
      !this.getAddressFieldError('direccion') &&
      !this.getAddressFieldError('codigoPostal') &&
      !this.getAddressFieldError('localidad') &&
      !this.getAddressFieldError('provincia') &&
      !this.getAddressFieldError('pais')
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
    this.successMessage.set('');
  }

  saveAddress(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.authService.hasActiveSession()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.canSubmit()) {
      this.errorMessage.set('Revisa los campos indicados antes de continuar.');
      return;
    }

    const value = this.form();

    const request: CreateShippingAddressRequest = {
      nombreDestinatario: value.nombreDestinatario.trim(),
      telefono: value.telefono.trim(),
      direccion: value.direccion.trim(),
      codigoPostal: value.codigoPostal.trim(),
      localidad: value.localidad.trim(),
      provincia: value.provincia.trim(),
      pais: value.pais.trim(),
      principal: value.principal,
    };

    const editingId = this.editingAddressId();

    const saveRequest =
      editingId === null
        ? this.shippingAddressService.createAddress(request)
        : this.shippingAddressService.updateAddress(editingId, request);

    this.savingAddress.set(true);

    saveRequest.subscribe({
      next: () => {
        this.checkoutService.saveShippingData(value);
        this.shippingAddressService.loadAddresses();
        this.savingAddress.set(false);
        this.submitted.set(false);
        this.editingAddressId.set(null);
        this.resetAddressFields();
        this.successMessage.set(
          editingId === null
            ? 'Direccion guardada correctamente.'
            : 'Direccion actualizada correctamente.',
        );
      },
      error: (error: HttpErrorResponse) => {
        this.savingAddress.set(false);
        this.errorMessage.set(
          error.error?.message ?? 'No ha sido posible guardar la direccion.',
        );
      },
    });
  }

  showEmailError(): boolean {
    return this.submitted() && !this.isEmailValid(this.form().email);
  }

  showAddressFieldError(field: AddressField): string {
    return this.submitted() ? this.getAddressFieldError(field) : '';
  }

  editAddress(address: ShippingAddress): void {
    this.editingAddressId.set(address.id);
    this.submitted.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.form.update((current) => ({
      ...current,
      nombreDestinatario: address.nombre,
      telefono: address.telefono,
      direccion: address.direccion,
      codigoPostal: address.codigoPostal,
      localidad: address.localidad,
      provincia: address.provincia,
      pais: address.pais,
      principal: address.principal,
    }));
  }

  cancelEditing(): void {
    this.editingAddressId.set(null);
    this.submitted.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.resetAddressFields();
  }

  private resetAddressFields(): void {
    this.form.update((current) => ({
      ...current,
      nombreDestinatario: '',
      telefono: '',
      direccion: '',
      codigoPostal: '',
      localidad: '',
      provincia: '',
      pais: 'Espana',
      principal: false,
    }));
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  private getAddressFieldError(field: AddressField): string {
    const value = this.form()[field].trim();

    if (field === 'telefono' && !/^\+?[0-9]{7,15}$/.test(value)) {
      return 'Introduce un telefono valido de entre 7 y 15 cifras.';
    }

    if (field === 'codigoPostal' && !/^[0-9]{5}$/.test(value)) {
      return 'Introduce un codigo postal de 5 cifras.';
    }

    if (value.length < 2) {
      return 'Este campo es obligatorio.';
    }

    if (field === 'direccion' && value.length < 5) {
      return 'Introduce una direccion valida.';
    }

    return '';
  }

  private isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
}
