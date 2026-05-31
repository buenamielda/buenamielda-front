import { Injectable, signal } from '@angular/core';

import { ShippingData } from '../models/checkout.model';
import { ShippingAddress } from '../models/shipping-address.model';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly shippingData = signal<ShippingData | null>(null);
  private readonly selectedAddress = signal<ShippingAddress | null>(null);

  readonly data = this.shippingData.asReadonly();
  readonly address = this.selectedAddress.asReadonly();

  saveShippingData(data: ShippingData): void {
    this.shippingData.set(data);
  }

  selectAddress(address: ShippingAddress | null): void {
  this.selectedAddress.set(address);
}

  clear(): void {
    this.shippingData.set(null);
    this.selectedAddress.set(null);
  }
}