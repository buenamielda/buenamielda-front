import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ProductTechnicalSheet } from '../models/product-technical-sheet.model';

@Injectable({
  providedIn: 'root',
})
export class ProductTechnicalSheetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/productos';

  getPublicByProductId(
    productId: number,
  ): Observable<ProductTechnicalSheet | null> {
    return this.http
      .get<ProductTechnicalSheet>(`${this.apiUrl}/${productId}/ficha-ampliada`, {
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<ProductTechnicalSheet>) => {
          if (response.status === 204 || !response.body) {
            return null;
          }

          return response.body;
        }),
        catchError(() => of(null)),
      );
  }
}