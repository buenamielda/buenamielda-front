import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CartItem,
  CartService,
  PurchaseMode,
} from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  private readonly cartService = inject(CartService);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly itemCount = this.cartService.itemCount;

  increaseQuantity(item: CartItem): void {
    this.cartService.increase(item.product.id, item.purchaseMode);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.decrease(item.product.id, item.purchaseMode);
  }

  itemTotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  modeLabel(mode: PurchaseMode): string {
    return mode === 'subscription'
      ? 'Suscripcion cada 4 semanas'
      : 'Compra unica';
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  removeItem(item: CartItem): void {
    this.cartService.remove(item.product.id, item.purchaseMode);
  }
}
