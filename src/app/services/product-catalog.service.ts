import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Producto, ProductoPayload } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/productos';

  private readonly productosSignal = signal<Producto[]>([]);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly todosLosProductos = this.productosSignal.asReadonly();

  readonly productos = computed(() =>
    this.productosSignal().filter((producto) => producto.activo)
  );

  cargarProductos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<Producto[]>(this.apiUrl).subscribe({
      next: (productos) => {
        this.productosSignal.set(productos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar los productos.');
        this.cargando.set(false);
      },
    });
  }

  obtenerPorId(id: number): Producto | undefined {
    return this.productosSignal().find((producto) => producto.id === id);
  }

  crearProducto(payload: ProductoPayload): void {
    // Lo implementaremos cuando pasemos al endpoint POST /api/productos
  }

  actualizarProducto(id: number, payload: ProductoPayload): void {
    // Lo implementaremos cuando pasemos al endpoint PUT /api/productos/{id}
  }

  desactivarProducto(id: number): void {
    // Lo implementaremos cuando pasemos al endpoint DELETE /api/productos/{id}
  }
}