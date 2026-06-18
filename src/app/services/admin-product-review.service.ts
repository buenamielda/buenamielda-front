import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import {
  OrderReviewResponse,
  UpdateReviewStatusRequest,
} from '../models/product-review.model';

@Injectable({
  providedIn: 'root',
})
export class AdminProductReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/admin/valoraciones';

  private readonly reviewsSignal = signal<OrderReviewResponse[]>([]);

  readonly reviews = computed(() =>
    [...this.reviewsSignal()].sort(
      (a, b) =>
        new Date(b.fechaActualizacion).getTime() -
        new Date(a.fechaActualizacion).getTime(),
    ),
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadReviews(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<OrderReviewResponse[]>(this.apiUrl).subscribe({
      next: (reviews) => {
        this.reviewsSignal.set(reviews);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar las valoraciones.');
        this.loading.set(false);
      },
    });
  }

  updateReviewStatus(
    reviewId: number,
    request: UpdateReviewStatusRequest,
  ): Observable<OrderReviewResponse> {
    return this.http
      .patch<OrderReviewResponse>(`${this.apiUrl}/${reviewId}/estado`, request)
      .pipe(
        tap((updatedReview) => {
          this.reviewsSignal.update((reviews) =>
            reviews.map((review) =>
              review.id === reviewId ? updatedReview : review,
            ),
          );
        }),
      );
  }
}