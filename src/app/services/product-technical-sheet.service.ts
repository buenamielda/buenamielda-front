import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import {
  ProductTechnicalSheet,
  ProductTechnicalSheetPayload,
} from '../models/product-technical-sheet.model';

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
      .get<ProductTechnicalSheet>(
        `${this.apiUrl}/${productId}/ficha-ampliada`,
        {
          observe: 'response',
        },
      )
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

  getAdminByProductId(
    productId: number,
  ): Observable<ProductTechnicalSheet | null> {
    return this.getPublicByProductId(productId);
  }

  create(
    productId: number,
    payload: ProductTechnicalSheetPayload,
  ): Observable<ProductTechnicalSheet> {
    return this.http.post<ProductTechnicalSheet>(
      `${this.apiUrl}/${productId}/ficha-ampliada`,
      this.toRequest(payload),
    );
  }

  update(
    productId: number,
    payload: ProductTechnicalSheetPayload,
  ): Observable<ProductTechnicalSheet> {
    return this.http.put<ProductTechnicalSheet>(
      `${this.apiUrl}/${productId}/ficha-ampliada`,
      this.toRequest(payload),
    );
  }

  updatePublished(
    productId: number,
    publicada: boolean,
  ): Observable<ProductTechnicalSheet> {
    return this.http.patch<ProductTechnicalSheet>(
      `${this.apiUrl}/${productId}/ficha-ampliada/publicada`,
      { publicada },
    );
  }

  private toRequest(payload: ProductTechnicalSheetPayload) {
    return {
      titulo: payload.titulo.trim(),
      descripcionAmpliada: payload.descripcionAmpliada.trim(),
      propiedades: payload.propiedades.trim(),
      origen: payload.origen.trim(),
      usoRecomendado: payload.usoRecomendado.trim(),
      conservacion: payload.conservacion.trim(),
      publicada: payload.publicada,
    };
  }
}
