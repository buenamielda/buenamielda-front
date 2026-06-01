import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  CreateShippingAddressRequest,
  ShippingAddress,
} from '../models/shipping-address.model';

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

  createAddress(
    request: CreateShippingAddressRequest,
  ): Observable<ShippingAddress> {
    return this.http.post<ShippingAddress>(this.apiUrl, request).pipe(
      tap((createdAddress) => {
        this.addressesState.update((addresses) => [
          ...addresses,
          createdAddress,
        ]);
      }),
    );
  }

  updateAddress(
    id: number,
    request: CreateShippingAddressRequest,
  ): Observable<ShippingAddress> {
    return this.http.put<ShippingAddress>(`${this.apiUrl}/${id}`, request).pipe(
      tap((updatedAddress) => {
        this.addressesState.update((addresses) =>
          addresses.map((address) => {
            if (address.id === updatedAddress.id) {
              return updatedAddress;
            }

            if (updatedAddress.principal) {
              return { ...address, principal: false };
            }

            return address;
          }),
        );
      }),
    );
  }

  deleteAddress(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
    tap(() => {
      this.addressesState.update((addresses) =>
        addresses.filter((address) => address.id !== id),
      );
    }),
  );
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
      return 'Inicia sesión para consultar tus direcciones.';
    }

    return 'No ha sido posible cargar tus direcciones.';
  }
}
