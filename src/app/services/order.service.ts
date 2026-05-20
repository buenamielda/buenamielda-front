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
    super('El carrito esta vacio.');
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Inicia sesion para confirmar el carrito.');
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

export class InvalidOrderStatusError extends Error {
  constructor(estado: string) {
    super(`El estado "${estado}" no es valido.`);
  }
}

export class InvalidOrderTransitionError extends Error {
  constructor(currentStatus: PedidoEstado, nextStatus: PedidoEstado) {
    super(`No se puede cambiar un pedido de ${currentStatus} a ${nextStatus}.`);
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
  private readonly http = inject(HttpClient);
  private readonly cartService = inject(CartService);
  private readonly apiUrl = '/api/pedidos';

  private readonly allowedStatuses: PedidoEstado[] = [
    'CREADO',
    'PENDIENTE',
    'PAGADO',
    'EN_PREPARACION',
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
  ];

  private readonly allowedTransitions: Record<PedidoEstado, PedidoEstado[]> = {
    CREADO: ['PAGADO', 'CANCELADO'],
    PENDIENTE: ['PAGADO', 'CANCELADO'],
    PAGADO: ['EN_PREPARACION', 'CANCELADO'],
    EN_PREPARACION: ['ENVIADO', 'CANCELADO'],
    ENVIADO: ['ENTREGADO'],
    ENTREGADO: [],
    CANCELADO: [],
  };

  private readonly orders = signal<PedidoResponseDto[]>([]);
  private readonly lastCreatedOrder = signal<PedidoResponseDto | null>(null);

  readonly allOrders = this.orders.asReadonly();
  readonly lastOrder = this.lastCreatedOrder.asReadonly();

  createFromCart(): Observable<PedidoResponseDto> {
    return this.http.post<PedidoApiResponseDto>(this.apiUrl, null).pipe(
      map((response) => this.mapApiOrder(response)),
      tap((pedido) => {
        this.orders.update((orders) => [...orders, pedido]);
        this.lastCreatedOrder.set(pedido);
        this.cartService.clear();
      }),
      catchError((error: HttpErrorResponse) =>
        this.handleCreateOrderError(error),
      ),
    );
  }

  getById(id: number): PedidoResponseDto | undefined {
    return this.orders().find((order) => order.id === id);
  }

  getOrderById(id: number): PedidoResponseDto {
    const order = this.getById(id);

    if (!order) {
      throw new OrderNotFoundError();
    }

    return order;
  }

  getOrderStatus(id: number): PedidoEstado {
    return this.getOrderById(id).estado;
  }

  updateStatus(
    id: number,
    request: ActualizarEstadoPedidoRequestDto,
  ): PedidoResponseDto {
    const order = this.getOrderById(id);
    const estado = request.estado;

    if (!this.isValidStatus(estado)) {
      throw new InvalidOrderStatusError(estado);
    }

    if (order.estado === estado) {
      return order;
    }

    if (!this.canTransition(order.estado, estado)) {
      throw new InvalidOrderTransitionError(order.estado, estado);
    }

    const updatedOrder: PedidoResponseDto = { ...order, estado };

    this.orders.update((orders) =>
      orders.map((currentOrder) =>
        currentOrder.id === id ? updatedOrder : currentOrder,
      ),
    );

    this.lastCreatedOrder.set(updatedOrder);
    return updatedOrder;
  }

  validatePayableOrder(idPedido: number, importe: number): PedidoResponseDto {
    const order = this.getOrderById(idPedido);

    if (order.estado !== 'CREADO' && order.estado !== 'PENDIENTE') {
      throw new OrderStateError();
    }

    if (Number(order.total.toFixed(2)) !== Number(importe.toFixed(2))) {
      throw new PaymentAmountError();
    }

    return order;
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
    return {
      id: line.idLineaPedido,
      cantidad: line.cantidad,
      idProducto: line.idProducto,
      nombreProducto: line.nombreProducto,
      precioUnitario: Number(line.precioUnitario),
      subtotal: Number(line.subtotal),
      imagenProducto: 'assets/images/placeholder.svg',
    };
  }

  private handleCreateOrderError(error: HttpErrorResponse): Observable<never> {
    const message = this.getErrorMessage(error).toLowerCase();

    if (error.status === 401 || error.status === 403) {
      return throwError(() => new AuthRequiredError());
    }

    if (error.status === 400 && message.includes('carrito')) {
      return throwError(() => new EmptyCartError());
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
    return this.allowedStatuses.includes(estado as PedidoEstado);
  }

  private canTransition(
    currentStatus: PedidoEstado,
    nextStatus: PedidoEstado,
  ): boolean {
    return this.allowedTransitions[currentStatus].includes(nextStatus);
  }
}
