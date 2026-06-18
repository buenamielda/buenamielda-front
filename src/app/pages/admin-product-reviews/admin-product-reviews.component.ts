import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import {
  OrderReviewResponse,
  ReviewStatus,
} from '../../models/product-review.model';
import { AdminProductReviewService } from '../../services/admin-product-review.service';

@Component({
  selector: 'app-admin-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './admin-product-reviews.component.html',
  styleUrl: './admin-product-reviews.component.scss',
})
export class AdminProductReviewsComponent implements OnInit {
  private readonly reviewService = inject(AdminProductReviewService);

  readonly reviews = this.reviewService.reviews;
  readonly loading = this.reviewService.loading;
  readonly error = this.reviewService.error;

  readonly search = signal('');
  readonly updatingReviewId = signal<number | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly statusError = signal<string | null>(null);

  readonly ratingStars = [1, 2, 3, 4, 5];

  readonly filteredReviews = computed(() => {
    const value = this.search().trim().toLowerCase();

    if (!value) {
      return this.reviews();
    }

    return this.reviews().filter((review) =>
      [
        review.id.toString(),
        review.nombreProducto,
        review.nombreUsuario,
        review.comentario ?? '',
        review.estado,
        review.activa ? 'activa' : 'retirada',
      ]
        .join(' ')
        .toLowerCase()
        .includes(value),
    );
  });

  readonly pendingCount = computed(
    () => this.reviews().filter((review) => review.estado === 'PENDIENTE').length,
  );

  readonly publishedCount = computed(
    () => this.reviews().filter((review) => review.estado === 'PUBLICADA').length,
  );

  readonly hiddenCount = computed(
    () => this.reviews().filter((review) => review.estado === 'OCULTA').length,
  );

  ngOnInit(): void {
    this.reviewService.loadReviews();
  }

  updateStatus(review: OrderReviewResponse, estado: ReviewStatus): void {
    if (review.estado === estado) {
      return;
    }

    this.statusMessage.set(null);
    this.statusError.set(null);
    this.updatingReviewId.set(review.id);

    this.reviewService.updateReviewStatus(review.id, { estado }).subscribe({
      next: (updatedReview) => {
        this.statusMessage.set(
          `La valoración de "${updatedReview.nombreProducto}" se ha actualizado a ${this.formatStatus(updatedReview.estado)}.`,
        );
        this.updatingReviewId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.statusError.set(
          error.error?.message ??
            'No se ha podido actualizar el estado de la valoración.',
        );
        this.updatingReviewId.set(null);
      },
    });
  }

  formatStatus(status: string): string {
    return status
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  starIcon(star: number, rating: number): string {
    return rating >= star ? 'star' : 'star_border';
  }
}