import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export class PaymentFailedError extends Error {
  constructor(message = 'No se ha podido procesar el pago.') {
    super(message);
    this.name = 'PaymentFailedError';
  }
}

export interface PagoRequest {
  idPedido: number;
  stripeToken: string;
  metadata: string;
}

export interface PagoResponse {
  stripeChargeId: string;
  estado: string;
  idPedido: number;
  total: number;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/pedidos/pagar';

  payOrder(
    idPedido: number,
    stripeToken: string,
    metadata: string = '',
  ): Observable<PagoResponse> {
    const body: PagoRequest = {
      idPedido,
      stripeToken,
      metadata,
    };

    return this.http.post<PagoResponse>(this.apiUrl, body).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          return throwError(
            () => new PaymentFailedError('No tienes permisos para realizar el pago.'),
          );
        }
        
        if (error.status === 400) {
          return throwError(
            () => new PaymentFailedError('Stripe ha rechazado la tarjeta.'),
          );
        }
        
        return throwError(() => error);

      }),
    );
  }
}