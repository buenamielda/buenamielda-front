import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { ProductReviewsResponse } from '../models/product-review.model';

@Injectable({
  providedIn: 'root',
})
export class ProductReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/productos';

  getProductReviews(productId: number): Observable<ProductReviewsResponse> {
    return this.http.get<ProductReviewsResponse>(
      `${this.apiUrl}/${productId}/valoraciones`,
    );
  }
}