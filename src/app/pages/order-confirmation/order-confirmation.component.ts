import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LineaPedidoResponseDto } from '../../models/order.model';

import { OrderService } from '../../services/order.service';
import { ProductReviewService } from '../../services/product-review.service';
import { OrderReviewResponse } from '../../models/product-review.model';

interface ReviewForm {
  puntuacion: number;
  comentario: string;
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss',
})
export class OrderConfirmationComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly productReviewService = inject(ProductReviewService);

  readonly order = this.orderService.lastOrder;

  readonly reviewsLoading = signal(false);
  readonly reviewsError = signal<string | null>(null);
  readonly orderReviews = signal<OrderReviewResponse[]>([]);
  readonly ratingStars = [1, 2, 3, 4, 5];

  readonly reviewForms = signal<Record<number, ReviewForm>>({});
  readonly submittingReviewLineId = signal<number | null>(null);
  readonly createReviewErrors = signal<Record<number, string>>({});
  readonly createReviewMessage = signal<string | null>(null);

  readonly activeOrderReviews = computed(() =>
    this.orderReviews().filter((review) => review.activa),
  );

  ngOnInit(): void {
    const order = this.order();

    if (!order) {
      return;
    }

    this.loadOrderReviews(order.id);
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  formatReviewDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatReviewStatus(status: string): string {
    return status
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }

  starIcon(star: number, rating: number): string {
    if (rating >= star) {
      return 'star';
    }

    if (rating >= star - 0.5) {
      return 'star_half';
    }

    return 'star_border';
  }

  private loadOrderReviews(orderId: number): void {
    this.reviewsLoading.set(true);
    this.reviewsError.set(null);

    this.productReviewService.getOrderReviews(orderId).subscribe({
      next: (reviews) => {
        this.orderReviews.set(reviews);
        this.reviewsLoading.set(false);
      },
      error: () => {
        this.reviewsError.set(
          'No se han podido cargar las valoraciones de este pedido.',
        );
        this.reviewsLoading.set(false);
      },
    });
  }

  reviewForm(lineId: number): ReviewForm {
    return (
      this.reviewForms()[lineId] ?? {
        puntuacion: 5,
        comentario: '',
      }
    );
  }

  setReviewRating(lineId: number, puntuacion: number): void {
    this.reviewForms.update((forms) => ({
      ...forms,
      [lineId]: {
        ...this.reviewForm(lineId),
        puntuacion,
      },
    }));

    this.clearCreateReviewError(lineId);
  }

  updateReviewComment(lineId: number, comentario: string): void {
    this.reviewForms.update((forms) => ({
      ...forms,
      [lineId]: {
        ...this.reviewForm(lineId),
        comentario,
      },
    }));

    this.clearCreateReviewError(lineId);
  }

  getReviewForLine(
    line: LineaPedidoResponseDto,
  ): OrderReviewResponse | undefined {
    return this.activeOrderReviews().find(
      (review) => review.idProducto === line.idProducto,
    );
  }

  createReview(line: LineaPedidoResponseDto): void {
    const order = this.order();
    const form = this.reviewForm(line.id);

    this.createReviewMessage.set(null);
    this.clearCreateReviewError(line.id);

    if (form.puntuacion < 1 || form.puntuacion > 5) {
      this.setCreateReviewError(
        line.id,
        'Selecciona una puntuación entre 1 y 5.',
      );
      return;
    }

    if (!order) {
      this.setCreateReviewError(line.id, 'No se ha encontrado el pedido.');
      return;
    }

    this.submittingReviewLineId.set(line.id);

    this.productReviewService
      .createProductReview(line.id, {
        puntuacion: form.puntuacion,
        comentario: form.comentario.trim(),
      })
      .subscribe({
        next: () => {
          this.createReviewMessage.set(
            `La valoración de "${line.nombreProducto}" se ha enviado y queda pendiente de moderación.`,
          );

          this.reviewForms.update((forms) => ({
            ...forms,
            [line.id]: {
              puntuacion: 5,
              comentario: '',
            },
          }));

          this.submittingReviewLineId.set(null);
          this.loadOrderReviews(order.id);
        },
        error: (error: HttpErrorResponse) => {
          this.setCreateReviewError(
            line.id,
            error.error?.message ?? 'No se ha podido crear la valoración.',
          );

          this.submittingReviewLineId.set(null);
        },
      });
  }

  private setCreateReviewError(lineId: number, message: string): void {
    this.createReviewErrors.update((errors) => ({
      ...errors,
      [lineId]: message,
    }));
  }

  private clearCreateReviewError(lineId: number): void {
    this.createReviewErrors.update((errors) => {
      const next = { ...errors };
      delete next[lineId];
      return next;
    });
  }
}
