import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import {
  LineaPedidoResponseDto,
  PedidoEstado,
  PedidoResponseDto,
} from '../../models/order.model';
import { OrderReviewResponse } from '../../models/product-review.model';
import { OrderService } from '../../services/order.service';
import { ProductReviewService } from '../../services/product-review.service';

interface ReviewForm {
  puntuacion: number;
  comentario: string;
}

@Component({
  selector: 'app-user-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    MatIconModule,
  ],
  templateUrl: './user-order-detail.component.html',
  styleUrl: './user-order-detail.component.scss',
})
export class UserOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly productReviewService = inject(ProductReviewService);

  readonly pedido = signal<PedidoResponseDto | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly reviewsLoading = signal(false);
  readonly reviewsError = signal<string | null>(null);
  readonly orderReviews = signal<OrderReviewResponse[]>([]);
  readonly ratingStars = [1, 2, 3, 4, 5];

  readonly reviewForms = signal<Record<number, ReviewForm>>({});
  readonly submittingReviewLineId = signal<number | null>(null);
  readonly createReviewErrors = signal<Record<number, string>>({});
  readonly createReviewMessage = signal<string | null>(null);

  readonly editingReviewId = signal<number | null>(null);
  readonly updatingReviewId = signal<number | null>(null);
  readonly updateReviewErrors = signal<Record<number, string>>({});
  readonly updateReviewMessage = signal<string | null>(null);

  readonly deletingReviewId = signal<number | null>(null);
  readonly deleteReviewErrors = signal<Record<number, string>>({});
  readonly deleteReviewMessage = signal<string | null>(null);

  readonly activeOrderReviews = computed(() =>
    this.orderReviews().filter((review) => review.activa),
  );

  readonly canReviewOrder = computed(() => this.pedido()?.estado === 'ENTREGADO');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate(['/pedidos']);
      return;
    }

    this.cargarPedido(id);
  }

  formatearEstado(estado: PedidoEstado): string {
    return estado
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
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
    const pedido = this.pedido();
    const form = this.reviewForm(line.id);

    this.createReviewMessage.set(null);
    this.clearCreateReviewError(line.id);

    if (!this.canReviewOrder()) {
      this.setCreateReviewError(
        line.id,
        'Solo puedes valorar productos de pedidos entregados.',
      );
      return;
    }

    if (!pedido) {
      this.setCreateReviewError(line.id, 'No se ha encontrado el pedido.');
      return;
    }

    if (form.puntuacion < 1 || form.puntuacion > 5) {
      this.setCreateReviewError(
        line.id,
        'Selecciona una puntuación entre 1 y 5.',
      );
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
          this.loadOrderReviews(pedido.id);
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

  startEditingReview(review: OrderReviewResponse): void {
    this.editingReviewId.set(review.id);
    this.updateReviewMessage.set(null);
    this.clearUpdateReviewError(review.id);

    this.reviewForms.update((forms) => ({
      ...forms,
      [review.id]: {
        puntuacion: review.puntuacion,
        comentario: review.comentario ?? '',
      },
    }));
  }

  cancelEditingReview(reviewId: number): void {
    this.editingReviewId.set(null);
    this.clearUpdateReviewError(reviewId);
  }

  updateReview(review: OrderReviewResponse): void {
    const pedido = this.pedido();
    const form = this.reviewForm(review.id);

    this.updateReviewMessage.set(null);
    this.clearUpdateReviewError(review.id);

    if (!this.canReviewOrder()) {
      this.setUpdateReviewError(
        review.id,
        'Solo puedes modificar valoraciones de pedidos entregados.',
      );
      return;
    }

    if (!pedido) {
      this.setUpdateReviewError(review.id, 'No se ha encontrado el pedido.');
      return;
    }

    if (form.puntuacion < 1 || form.puntuacion > 5) {
      this.setUpdateReviewError(
        review.id,
        'Selecciona una puntuación entre 1 y 5.',
      );
      return;
    }

    this.updatingReviewId.set(review.id);

    this.productReviewService
      .updateProductReview(review.id, {
        puntuacion: form.puntuacion,
        comentario: form.comentario.trim(),
      })
      .subscribe({
        next: () => {
          this.updateReviewMessage.set(
            `La valoración de "${review.nombreProducto}" se ha actualizado y queda pendiente de moderación.`,
          );

          this.editingReviewId.set(null);
          this.updatingReviewId.set(null);
          this.loadOrderReviews(pedido.id);
        },
        error: (error: HttpErrorResponse) => {
          this.setUpdateReviewError(
            review.id,
            error.error?.message ?? 'No se ha podido modificar la valoración.',
          );

          this.updatingReviewId.set(null);
        },
      });
  }

  deleteReview(review: OrderReviewResponse): void {
    const pedido = this.pedido();

    this.deleteReviewMessage.set(null);
    this.clearDeleteReviewError(review.id);

    if (!pedido) {
      this.setDeleteReviewError(review.id, 'No se ha encontrado el pedido.');
      return;
    }

    const confirmed = window.confirm(
      `¿Quieres retirar la valoración de "${review.nombreProducto}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingReviewId.set(review.id);

    this.productReviewService.deleteProductReview(review.id).subscribe({
      next: () => {
        this.deleteReviewMessage.set(
          `La valoración de "${review.nombreProducto}" se ha retirado correctamente.`,
        );

        this.deletingReviewId.set(null);
        this.editingReviewId.set(null);
        this.loadOrderReviews(pedido.id);
      },
      error: (error: HttpErrorResponse) => {
        this.setDeleteReviewError(
          review.id,
          error.error?.message ?? 'No se ha podido retirar la valoración.',
        );

        this.deletingReviewId.set(null);
      },
    });
  }

  private cargarPedido(id: number): void {
    this.cargando.set(true);
    this.error.set('');

    this.orderService.getOrderByIdFromApi(id).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.cargando.set(false);
        this.loadOrderReviews(pedido.id);
      },
      error: () => {
        this.error.set('No se ha podido cargar el detalle del pedido.');
        this.cargando.set(false);
      },
    });
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

  private setUpdateReviewError(reviewId: number, message: string): void {
    this.updateReviewErrors.update((errors) => ({
      ...errors,
      [reviewId]: message,
    }));
  }

  private clearUpdateReviewError(reviewId: number): void {
    this.updateReviewErrors.update((errors) => {
      const next = { ...errors };
      delete next[reviewId];
      return next;
    });
  }

  private setDeleteReviewError(reviewId: number, message: string): void {
    this.deleteReviewErrors.update((errors) => ({
      ...errors,
      [reviewId]: message,
    }));
  }

  private clearDeleteReviewError(reviewId: number): void {
    this.deleteReviewErrors.update((errors) => {
      const next = { ...errors };
      delete next[reviewId];
      return next;
    });
  }
}