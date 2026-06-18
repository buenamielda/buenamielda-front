import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import {
  OrderReviewResponse,
  ProductReviewsResponse,
} from '../models/product-review.model';

@Injectable({
  providedIn: 'root',
})
export class ProductReviewService {
  private readonly http = inject(HttpClient);
  private readonly productsApiUrl = '/api/productos';
  private readonly ordersApiUrl = '/api/pedidos';

  getProductReviews(productId: number): Observable<ProductReviewsResponse> {
    return this.http.get<ProductReviewsResponse>(
      `${this.productsApiUrl}/${productId}/valoraciones`,
    );
  }

  getOrderReviews(orderId: number): Observable<OrderReviewResponse[]> {
    return this.http.get<OrderReviewResponse[]>(
      `${this.ordersApiUrl}/${orderId}/valoraciones`,
    );
  }
}