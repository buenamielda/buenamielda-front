import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { PagoRequestDto, PagoResponseDto } from '../models/order.model';
import { OrderService } from './order.service';

export class PaymentFailedError extends Error {
  constructor() {
    super('El pago no se ha podido procesar.');
  }
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly orderService = inject(OrderService);
  private readonly apiUrl = '/api/pedidos/pagar';

  private readonly payments = signal<PagoResponseDto[]>([]);

  readonly allPayments = this.payments.asReadonly();

  payOrder(request: PagoRequestDto): Observable<PagoResponseDto> {
    this.orderService.validatePayableOrder(request.idPedido, request.importe);

    if (request.metodoPago === 'SIMULATED_FAIL') {
      return throwError(() => new PaymentFailedError());
    }

    return this.http.post<void>(this.apiUrl, null).pipe(
      map(() => this.createLocalPayment(request)),
      tap((payment) => {
        this.payments.update((payments) => [...payments, payment]);
        this.orderService.updateStatusLocal(request.idPedido, {
          estado: 'PAGADO',
        });
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          return throwError(() => new PaymentFailedError());
        }

        return throwError(() => error);
      }),
    );
  }

  private createLocalPayment(request: PagoRequestDto): PagoResponseDto {
    return {
      id: this.nextId(),
      idPedido: request.idPedido,
      importe: request.importe,
      estado: 'ACEPTADO',
      fechaPago: new Date().toISOString(),
    };
  }

  private nextId(): number {
    return Math.max(0, ...this.payments().map((payment) => payment.id)) + 1;
  }
}
