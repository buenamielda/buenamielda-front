import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

import {
  CrearPedidoRequestDto,
  PedidoResponseDto,
} from '../models/order.model';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';

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

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = '/api/pedidos';
  private readonly lastCreatedOrder = signal<PedidoResponseDto | null>(null);

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

    const lineas = items.map((item, index) => ({
      id: index + 1,
      cantidad: item.quantity,
      idProducto: item.product.id,
      nombreProducto: item.product.nombre,
      precioUnitario: item.product.precio,
      subtotal: item.product.precio * item.quantity,
      imagenProducto: item.product.imagenUrl,
    }));

    const pedido: PedidoResponseDto = {
      id: Date.now(),
      fechaPedido: new Date().toISOString(),
      estado: 'PENDIENTE',
      total: lineas.reduce((total, linea) => total + linea.subtotal, 0),
      idUsuario: request.idUsuario,
      lineas,
    };

    this.lastCreatedOrder.set(pedido);
    this.cartService.clear();

    return of(pedido);
  }
}
