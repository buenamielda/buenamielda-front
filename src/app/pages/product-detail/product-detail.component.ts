import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ProductCatalogService } from '../../services/product-catalog.service';
import { CartService } from '../../services/cart.service';

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

  readonly cantidad = signal(1);
  readonly modoCompra = signal<'single' | 'subscription'>('single');

  readonly producto = computed(() => {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 1);

    return (
      this.productCatalog.obtenerPorId(id) ??
      this.productCatalog.productos()[0]
    );
  });

  readonly total = computed(() => {
    const producto = this.producto();

    if (!producto) {
      return 0;
    }

    return producto.precio * this.cantidad();
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 1);
    this.productCatalog.cargarProductoPorId(id);
  }

  increaseQuantity(): void {
    this.cantidad.update((value) => value + 1);
  }

  decreaseQuantity(): void {
    this.cantidad.update((value) => Math.max(1, value - 1));
  }

  setPurchaseMode(mode: 'single' | 'subscription'): void {
    this.modoCompra.set(mode);
  }

  addToCart(): void {
    const producto = this.producto();

    if (!producto) {
      return;
    }

    this.cartService.add(producto, this.cantidad(), this.modoCompra());
    this.router.navigate(['/carrito']);
  }

  formatPrice(precio: number): string {
    return precio.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }
}