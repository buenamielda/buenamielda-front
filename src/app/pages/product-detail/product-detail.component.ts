import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Producto } from '../../models/product.model';
import { ProductCatalogService } from '../../services/product-catalog.service';
import { CartService } from '../../services/cart.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ProductReviewCommentResponse } from '../../models/product-review.model';
import { ProductReviewService } from '../../services/product-review.service';
import { ProductTechnicalSheet } from '../../models/product-technical-sheet.model';
import { ProductTechnicalSheetService } from '../../services/product-technical-sheet.service';

type ModoCompra = 'single' | 'subscription';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productCatalog = inject(ProductCatalogService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly productReviewService = inject(ProductReviewService);
  private readonly technicalSheetService = inject(ProductTechnicalSheetService);

  readonly cantidad = signal(1);
  readonly modoCompra = signal<ModoCompra>('single');
  readonly reviewsLoading = signal(false);
  readonly reviewsError = signal<string | null>(null);
  readonly reviews = signal<ProductReviewCommentResponse[]>([]);
  readonly averageRating = signal(0);
  readonly hasRating = computed(() => this.averageRating() > 0);

  readonly ratingLabel = computed(() =>
    this.reviews().length === 1
      ? '1 comentario publicado'
      : `${this.reviews().length} comentarios publicados`,
  );
  readonly ratingStars = [1, 2, 3, 4, 5];
  readonly isAdmin = computed(() => this.authService.isAdmin());

  readonly cargando = this.productCatalog.cargando;
  readonly error = this.productCatalog.error;
  readonly cartError = signal('');
  readonly technicalSheet = signal<ProductTechnicalSheet | null>(null);
  readonly technicalSheetLoading = signal(false);

  readonly idProducto = computed(() =>
    Number(this.route.snapshot.paramMap.get('id')),
  );

  readonly producto = computed<Producto | undefined>(() =>
    this.productCatalog.obtenerPorId(this.idProducto()),
  );

  readonly total = computed(() => {
    const producto = this.producto();

    if (!producto) {
      return 0;
    }

    return producto.precio * this.cantidad();
  });

  ngOnInit(): void {
    const id = this.idProducto();

    if (!id || Number.isNaN(id)) {
      this.router.navigate(['/productos']);
      return;
    }

    this.productCatalog.cargarProductoPorId(id);
    this.loadProductReviews(id);
    this.loadTechnicalSheet(id);
  }

  incrementarCantidad(): void {
    this.cantidad.update((value) => value + 1);
  }

  reducirCantidad(): void {
    this.cantidad.update((value) => Math.max(1, value - 1));
  }

  seleccionarModoCompra(modo: ModoCompra): void {
    this.modoCompra.set(modo);
  }

  anadirAlCarrito(): void {
    this.cartError.set('');

    if (this.authService.isAdmin()) {
      this.cartError.set(
        'Los administradores no pueden añadir productos al carrito.',
      );
      return;
    }

    if (!this.authService.hasActiveSession()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const producto = this.producto();

    if (!producto) {
      return;
    }

    this.cartService
      .add(producto, this.cantidad(), this.modoCompra())
      .subscribe({
        next: () => {
          this.router.navigate(['/carrito']);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: this.router.url },
            });
            return;
          }

          this.cartError.set(this.getCartErrorMessage(error));
        },
      });
  }

  formatearPrecio(precio: number): string {
    return precio.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  private getCartErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error && typeof error.error === 'object') {
      return Object.values(error.error).join(' ');
    }

    return 'No se ha podido añadir el producto al carrito.';
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

  formatReviewDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  private loadProductReviews(productId: number): void {
    this.reviewsLoading.set(true);
    this.reviewsError.set(null);

    this.productReviewService.getProductReviews(productId).subscribe({
      next: (response) => {
        this.averageRating.set(response.puntuacionTotal ?? 0);
        this.reviews.set(
          response.valoracionProductoComentarioResponseDtos ?? [],
        );
        this.reviewsLoading.set(false);
      },
      error: () => {
        this.reviewsError.set('No se han podido cargar las valoraciones.');
        this.reviewsLoading.set(false);
      },
    });
  }
  private loadTechnicalSheet(productId: number): void {
    this.technicalSheetLoading.set(true);
    this.technicalSheet.set(null);

    this.technicalSheetService.getPublicByProductId(productId).subscribe({
      next: (technicalSheet) => {
        this.technicalSheet.set(technicalSheet);
        this.technicalSheetLoading.set(false);
      },
      error: () => {
        this.technicalSheet.set(null);
        this.technicalSheetLoading.set(false);
      },
    });
  }
}
