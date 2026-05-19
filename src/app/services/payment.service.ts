import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { PagoRequestDto, PagoResponseDto } from '../models/order.model';
import { OrderService } from './order.service';
import { StockService } from './stock.service';

export class PaymentFailedError extends Error {
  constructor() {
    super('El pago no se ha podido procesar.');
  }
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly orderService = inject(OrderService);
  private readonly stockService = inject(StockService);
  private readonly payments = signal<PagoResponseDto[]>([]);

  readonly allPayments = this.payments.asReadonly();

  payOrder(request: PagoRequestDto): Observable<PagoResponseDto> {
    this.orderService.validatePayableOrder(
      request.idPedido,
      request.idUsuario,
      request.importe,
    );

    if (request.metodoPago === 'SIMULATED_FAIL') {
      return throwError(() => new PaymentFailedError());
    }

    const payment: PagoResponseDto = {
      id: this.nextId(),
      idPedido: request.idPedido,
      importe: request.importe,
      estado: 'ACEPTADO',
      fechaPago: new Date().toISOString(),
    };

    const order = this.orderService.getOrderById(request.idPedido);
    this.stockService.updateStockForLines(order.lineas);
    this.payments.update((payments) => [...payments, payment]);
    this.orderService.updateStatus(request.idPedido, { estado: 'PAGADO' });

    return of(payment);
  }

  private nextId(): number {
    return Math.max(0, ...this.payments().map((payment) => payment.id)) + 1;
  }
}
