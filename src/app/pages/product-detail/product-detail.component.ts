import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Producto } from '../../models/product.model';
import { ProductCatalogService } from '../../services/product-catalog.service';
import { CartService } from '../../services/cart.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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

  readonly cantidad = signal(1);
  readonly modoCompra = signal<ModoCompra>('single');

  readonly cargando = this.productCatalog.cargando;
  readonly error = this.productCatalog.error;
  readonly cartError = signal('');
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

    if (!this.authService.hasActiveSession()) {
      this.router.navigate(['/login']);
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
            this.router.navigate(['/login']);
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

    return 'No se ha podido anadir el producto al carrito.';
  }
}
