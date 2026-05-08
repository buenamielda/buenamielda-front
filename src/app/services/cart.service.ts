import { Injectable, computed, signal } from '@angular/core';

import { Producto } from '../models/product.model';

export type PurchaseMode = 'single' | 'subscription';

export interface CartItem {
  product: Producto;
  quantity: number;
  purchaseMode: PurchaseMode;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartItems = signal<CartItem[]>([]);

  readonly items = this.cartItems.asReadonly();

  readonly itemCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.cartItems().reduce(
      (total, item) => total + item.product.precio * item.quantity,
      0
    )
  );

  add(
    product: Producto,
    quantity = 1,
    purchaseMode: PurchaseMode = 'single'
  ): void {
    this.cartItems.update((items) => {
      const existing = items.find(
        (item) =>
          item.product.id === product.id &&
          item.purchaseMode === purchaseMode
      );

      if (!existing) {
        return [...items, { product, quantity, purchaseMode }];
      }

      return items.map((item) =>
        item === existing
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    });
  }

  increase(productId: number, purchaseMode: PurchaseMode): void {
    this.updateQuantity(productId, purchaseMode, 1);
  }

  decrease(productId: number, purchaseMode: PurchaseMode): void {
    this.updateQuantity(productId, purchaseMode, -1);
  }

  remove(productId: number, purchaseMode: PurchaseMode): void {
    this.cartItems.update((items) =>
      items.filter(
        (item) =>
          item.product.id !== productId ||
          item.purchaseMode !== purchaseMode
      )
    );
  }

  private updateQuantity(
    productId: number,
    purchaseMode: PurchaseMode,
    delta: number
  ): void {
    this.cartItems.update((items) =>
      items
        .map((item) => {
          if (
            item.product.id !== productId ||
            item.purchaseMode !== purchaseMode
          ) {
            return item;
          }

          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        })
        .filter((item) => item.quantity > 0)
    );
  }
}