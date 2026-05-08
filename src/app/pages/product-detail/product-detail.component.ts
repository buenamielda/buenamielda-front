import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Producto } from '../../models/product.model';
import { ProductCatalogService } from '../../services/product-catalog.service';
import { CartService } from '../../services/cart.service';

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

  readonly cantidad = signal(1);
  readonly modoCompra = signal<ModoCompra>('single');

  readonly cargando = this.productCatalog.cargando;
  readonly error = this.productCatalog.error;

  readonly idProducto = computed(() =>
    Number(this.route.snapshot.paramMap.get('id'))
  );

  readonly producto = computed<Producto | undefined>(() =>
    this.productCatalog.obtenerPorId(this.idProducto())
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
    const producto = this.producto();

    if (!producto) {
      return;
    }

    this.cartService.add(producto, this.cantidad(), this.modoCompra());
    this.router.navigate(['/carrito']);
  }

  formatearPrecio(precio: number): string {
    return precio.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }
}