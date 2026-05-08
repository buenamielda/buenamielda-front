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

  cargarProductoPorId(id: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<Producto>(`${this.apiUrl}/${id}`).subscribe({
      next: (producto) => {
        this.productosSignal.update((productos) =>
          this.insertarOActualizar(productos, producto)
        );
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se ha podido cargar el producto.');
        this.cargando.set(false);
      },
    });
  }

  crearProducto(payload: ProductoPayload): void {
    this.error.set(null);

    this.http.post<Producto>(this.apiUrl, this.toRequestDto(payload)).subscribe({
      next: (productoCreado) => {
        this.productosSignal.update((productos) => [
          ...productos,
          productoCreado,
        ]);
      },
      error: () => {
        this.error.set('No se ha podido crear el producto.');
      },
    });
  }

  actualizarProducto(id: number, payload: ProductoPayload): void {
    this.error.set(null);

    this.http
      .put<Producto>(`${this.apiUrl}/${id}`, this.toRequestDto(payload))
      .subscribe({
        next: (productoActualizado) => {
          this.productosSignal.update((productos) =>
            productos.map((producto) =>
              producto.id === id ? productoActualizado : producto
            )
          );
        },
        error: () => {
          this.error.set('No se ha podido modificar el producto.');
        },
      });
  }

  desactivarProducto(id: number): void {
    this.error.set(null);

    this.http.delete<void>(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.productosSignal.update((productos) =>
          productos.map((producto) =>
            producto.id === id ? { ...producto, activo: false } : producto
          )
        );
      },
      error: () => {
        this.error.set('No se ha podido desactivar el producto.');
      },
    });
  }

  private toRequestDto(producto: ProductoPayload) {
    return {
      nombre: producto.nombre.trim(),
      descripcion: producto.descripcion?.trim() ?? '',
      precio: Number(producto.precio) || 0,
      stock: Number(producto.stock) > 0 ? Number(producto.stock) : 1,
      imagenUrl: producto.imagenUrl?.trim() || 'assets/images/miel-tomillo.svg',
      idCategoria:
        producto.idCategoria || this.resolverIdCategoria(producto.nombreCategoria),
    };
  }

  private resolverIdCategoria(nombreCategoria?: string): number {
    const categoria = nombreCategoria?.toLowerCase().trim();

    if (categoria === 'polen') {
      return 2;
    }

    return 1;
  }

  private insertarOActualizar(
    productos: Producto[],
    producto: Producto
  ): Producto[] {
    const existe = productos.some((item) => item.id === producto.id);

    if (!existe) {
      return [...productos, producto];
    }

    return productos.map((item) =>
      item.id === producto.id ? producto : item
    );
  }
}