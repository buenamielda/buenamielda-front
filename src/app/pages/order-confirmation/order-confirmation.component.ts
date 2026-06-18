import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { OrderService } from '../../services/order.service';
import { ProductReviewService } from '../../services/product-review.service';
import { OrderReviewResponse } from '../../models/product-review.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
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
}