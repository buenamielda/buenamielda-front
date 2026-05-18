import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import {
  CrearPedidoRequestDto,
  LineaPedidoResponseDto,
  PedidoResponseDto,
} from '../models/order.model';
import { CartItem, CartService } from './cart.service';

export class EmptyCartError extends Error {
  constructor() {
    super('El carrito esta vacio.');
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Inicia sesion para confirmar el carrito.');
  }
}

export class InactiveProductError extends Error {
  constructor(productName: string) {
    super(`El producto "${productName}" ya no esta activo.`);
  }
}

export class InsufficientStockError extends Error {
  constructor(productName: string) {
    super(`No hay stock suficiente para "${productName}".`);
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super('El pedido no existe.');
  }
}

export class OrderOwnershipError extends Error {
  constructor() {
    super('El pedido no pertenece al usuario autenticado.');
  }
}

export class OrderStateError extends Error {
  constructor() {
    super('El pedido no esta en un estado que permita el pago.');
  }
}

export class PaymentAmountError extends Error {
  constructor() {
    super('El importe del pago no coincide con el total del pedido.');
  }
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly cartService = inject(CartService);

  private readonly orders = signal<PedidoResponseDto[]>([]);
  private readonly lastCreatedOrder = signal<PedidoResponseDto | null>(null);

  readonly allOrders = this.orders.asReadonly();
  readonly lastOrder = this.lastCreatedOrder.asReadonly();

  createFromCart(
    request: CrearPedidoRequestDto,
  ): Observable<PedidoResponseDto> {
    const items = this.cartService.items();

    if (items.length === 0) {
      return throwError(() => new EmptyCartError());
    }

    for (const item of items) {
      if (!item.product.activo) {
        return throwError(() => new InactiveProductError(item.product.nombre));
      }

      if (item.product.stock < item.quantity) {
        return throwError(
          () => new InsufficientStockError(item.product.nombre),
        );
      }
    }

    const lineas = items.map((item, index) =>
      this.toOrderLine(item, index + 1),
    );

    const pedido: PedidoResponseDto = {
      id: this.nextId(),
      fechaPedido: new Date().toISOString(),
      estado: 'PENDIENTE',
      total: lineas.reduce((total, line) => total + line.subtotal, 0),
      idUsuario: request.idUsuario,
      lineas,
    };

    this.orders.update((orders) => [...orders, pedido]);
    this.lastCreatedOrder.set(pedido);
    this.cartService.clear();

    return of(pedido);
  }

  getById(id: number): PedidoResponseDto | undefined {
    return this.orders().find((order) => order.id === id);
  }

  updateStatus(id: number, estado: string): PedidoResponseDto {
    const order = this.getById(id);

    if (!order) {
      throw new OrderNotFoundError();
    }

    const updatedOrder = { ...order, estado };

    this.orders.update((orders) =>
      orders.map((currentOrder) =>
        currentOrder.id === id ? updatedOrder : currentOrder,
      ),
    );

    this.lastCreatedOrder.set(updatedOrder);
    return updatedOrder;
  }

  validatePayableOrder(
    idPedido: number,
    idUsuario: number,
    importe: number,
  ): PedidoResponseDto {
    const order = this.getById(idPedido);

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.idUsuario !== idUsuario) {
      throw new OrderOwnershipError();
    }

    if (order.estado !== 'PENDIENTE') {
      throw new OrderStateError();
    }

    if (Number(order.total.toFixed(2)) !== Number(importe.toFixed(2))) {
      throw new PaymentAmountError();
    }

    return order;
  }

  private toOrderLine(item: CartItem, lineId: number): LineaPedidoResponseDto {
    return {
      id: lineId,
      cantidad: item.quantity,
      idProducto: item.product.id,
      nombreProducto: item.product.nombre,
      precioUnitario: item.product.precio,
      subtotal: item.product.precio * item.quantity,
      imagenProducto: item.product.imagenUrl,
    };
  }

  private nextId(): number {
    return Math.max(0, ...this.orders().map((order) => order.id)) + 1;
  }
}
