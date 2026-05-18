import { Injectable, signal } from '@angular/core';
import { ShippingData } from '../models/checkout.model';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly shippingData = signal<ShippingData | null>(null);

  readonly data = this.shippingData.asReadonly();

  saveShippingData(data: ShippingData): void {
    this.shippingData.set(data);
  }

  clear(): void {
    this.shippingData.set(null);
  }
}
