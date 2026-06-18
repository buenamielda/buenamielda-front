import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import {
  OrderReviewResponse,
  ProductReviewsResponse,
  CreateProductReviewRequest,
  ProductReviewCommentResponse,
  UpdateProductReviewRequest,
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

  createProductReview(
    lineOrderId: number,
    request: CreateProductReviewRequest,
  ): Observable<ProductReviewCommentResponse> {
    return this.http.post<ProductReviewCommentResponse>(
      `${this.productsApiUrl}/${lineOrderId}/valoraciones`,
      request,
    );
  }
  updateProductReview(
    reviewId: number,
    request: UpdateProductReviewRequest,
  ): Observable<ProductReviewCommentResponse> {
    return this.http.put<ProductReviewCommentResponse>(
      `${this.productsApiUrl}/${reviewId}/valoraciones`,
      request,
    );
  }

  deleteProductReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.productsApiUrl}/${reviewId}/valoraciones`,
    );
  }
}
