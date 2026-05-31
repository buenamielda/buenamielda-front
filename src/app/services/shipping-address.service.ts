import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { ShippingAddress } from '../models/shipping-address.model';

@Injectable({
  providedIn: 'root',
})
export class ShippingAddressService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/direcciones';

  private readonly addressesState = signal<ShippingAddress[]>([]);

  readonly addresses = this.addressesState.asReadonly();
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  loadAddresses(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<ShippingAddress[]>(this.apiUrl).subscribe({
      next: (addresses) => {
        this.addressesState.set(addresses);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.addressesState.set([]);
        this.errorMessage.set(this.getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    if (error.status === 401 || error.status === 403) {
      return 'Inicia sesion para consultar tus direcciones.';
    }

    return 'No ha sido posible cargar tus direcciones.';
  }
}