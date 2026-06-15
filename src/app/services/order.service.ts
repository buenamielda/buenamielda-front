import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import {
  ActualizarEstadoPedidoRequestDto,
  LineaPedidoResponseDto,
  PedidoEstado,
  PedidoResponseDto,
} from '../models/order.model';
import { CartService } from './cart.service';
import { ProductCatalogService } from './product-catalog.service';

interface PedidoApiResponseDto {
  idPedido: number;
  fechaPedido: string;
  estado: string;
  total: number;
  idUsuario: number;
  lineas: LineaPedidoApiResponseDto[];
}

interface LineaPedidoApiResponseDto {
  idLineaPedido: number;
  cantidad: number;
  idProducto: number;
  nombreProducto: string;
  precioUnitario: number;
  subtotal: number;
}

export class EmptyCartError extends Error {
  constructor() {
    super('El carrito está vacio.');
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Inicia sesión para continuar.');
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super('El pedido no existe.');
  }
}

export class InvalidOrderStatusError extends Error {
  constructor(estado: string) {
    super(`El estado "${estado}" no es válido.`);
  }
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly cartService = inject(CartService);
  private readonly productCatalog = inject(ProductCatalogService);
  private readonly apiUrl = '/api/pedidos';

  private readonly lastCreatedOrder = signal<PedidoResponseDto | null>(null);

  readonly lastOrder = this.lastCreatedOrder.asReadonly();

  createFromCart(idDireccionEnvio: number, stripeToken: string): Observable<PedidoResponseDto> {
    return this.http
      .post<PedidoApiResponseDto>(this.apiUrl, { idDireccionEnvio, stripeToken })
      .pipe(
        map((response) => this.mapApiOrder(response)),
        tap((pedido) => {
          this.lastCreatedOrder.set(pedido);
          this.cartService.clear();
          this.productCatalog.cargarProductos();
        }),
        catchError((error: HttpErrorResponse) =>
          this.handleCreateOrderError(error),
        ),
      );
  }

  getOrderByIdFromApi(id: number): Observable<PedidoResponseDto> {
    return this.http.get<PedidoApiResponseDto>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.mapApiOrder(response)),
      tap((pedido) => this.lastCreatedOrder.set(pedido)),
      catchError((error: HttpErrorResponse) => this.handleGetOrderError(error)),
    );
  }

  updateStatusFromApi(
    id: number,
    request: ActualizarEstadoPedidoRequestDto,
  ): Observable<PedidoResponseDto> {
    if (!this.isValidStatus(request.estado)) {
      return throwError(() => new InvalidOrderStatusError(request.estado));
    }

    return this.http
      .patch<PedidoApiResponseDto>(`${this.apiUrl}/${id}/estado`, request)
      .pipe(
        map((response) => this.mapApiOrder(response)),
        tap((pedido) => this.lastCreatedOrder.set(pedido)),
        catchError((error: HttpErrorResponse) =>
          this.handleUpdateStatusError(error),
        ),
      );
  }

  private mapApiOrder(response: PedidoApiResponseDto): PedidoResponseDto {
    return {
      id: response.idPedido,
      fechaPedido: response.fechaPedido,
      estado: response.estado as PedidoEstado,
      total: Number(response.total),
      idUsuario: response.idUsuario,
      lineas: response.lineas.map((line) => this.mapApiLine(line)),
    };
  }

  private mapApiLine(line: LineaPedidoApiResponseDto): LineaPedidoResponseDto {
    const producto = this.productCatalog.obtenerPorId(line.idProducto);

    return {
      id: line.idLineaPedido,
      cantidad: line.cantidad,
      idProducto: line.idProducto,
      nombreProducto: line.nombreProducto,
      precioUnitario: Number(line.precioUnitario),
      subtotal: Number(line.subtotal),
      imagenProducto: producto?.imagenUrl || 'assets/images/placeholder.svg',
    };
  }

  private handleCreateOrderError(error: HttpErrorResponse): Observable<never> {
    const message = this.getErrorMessage(error).toLowerCase();

    if (error.status === 401 || error.status === 403) {
      return throwError(() => new AuthRequiredError());
    }

    if (message.includes('carrito')) {
      return throwError(() => new EmptyCartError());
    }

    return throwError(() => error);
  }

  private handleGetOrderError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401 || error.status === 403) {
      return throwError(() => new AuthRequiredError());
    }

    if (error.status === 404) {
      return throwError(() => new OrderNotFoundError());
    }

    return throwError(() => error);
  }

  private handleUpdateStatusError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401 || error.status === 403) {
      return throwError(() => new AuthRequiredError());
    }

    if (error.status === 404) {
      return throwError(() => new OrderNotFoundError());
    }

    return throwError(() => error);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error && typeof error.error === 'object') {
      return Object.values(error.error).join(' ');
    }

    return '';
  }

  private isValidStatus(estado: string): estado is PedidoEstado {
    return [
      'CREADO',
      'PENDIENTE',
      'PAGADO',
      'EN_PREPARACION',
      'ENVIADO',
      'ENTREGADO',
      'CANCELADO',
    ].includes(estado);
  }
}
