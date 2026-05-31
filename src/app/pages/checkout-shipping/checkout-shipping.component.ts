import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CheckoutService } from '../../services/checkout.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.scss',
})
export class CheckoutShippingComponent {
  private readonly checkoutService = inject(CheckoutService);
  private readonly orderService = inject(OrderService);

  readonly order = this.orderService.lastOrder;
  readonly shippingData = this.checkoutService.data;

  address(): string {
    const data = this.shippingData();
    if (!data) {
      return 'Direccion pendiente';
    }

    return `${data.direccion}, ${data.codigoPostal}, ${data.localidad}`;
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }
}
