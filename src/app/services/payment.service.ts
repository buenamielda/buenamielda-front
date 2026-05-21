import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

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
  private readonly apiUrl = '/api/pedidos/pagar';

  payOrder(): Observable<void> {
    return this.http.post<void>(this.apiUrl, null).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          return throwError(() => new PaymentFailedError());
        }

        return throwError(() => error);
      }),
    );
  }
}