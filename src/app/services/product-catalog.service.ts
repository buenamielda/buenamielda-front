import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Producto, ProductoPayload } from '../models/product.model';

export interface FiltrosProducto {
  nombre?: string;
  categoriaId?: number;
  precioMin?: number;
  precioMax?: number;
  disponible?: boolean;
}

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
    this.productosSignal().filter((producto) => producto.activo),
  );

  cargarProductos(filtros: FiltrosProducto = {}): void {
    this.cargando.set(true);
    this.error.set(null);

    let params = new HttpParams();

    const nombre = filtros.nombre?.trim();

    if (nombre) {
      params = params.set('nombre', nombre);
    }

    if (filtros.categoriaId) {
      params = params.set('categoriaId', filtros.categoriaId.toString());
    }

    if (filtros.precioMin !== undefined) {
      params = params.set('precioMin', filtros.precioMin.toString());
    }

    if (filtros.precioMax !== undefined) {
      params = params.set('precioMax', filtros.precioMax.toString());
    }

    if (filtros.disponible !== undefined) {
      params = params.set('disponible', filtros.disponible.toString());
    }

    this.http.get<Producto[]>(this.apiUrl, { params }).subscribe({
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
          this.insertarOActualizar(productos, producto),
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

    this.http
      .post<Producto>(this.apiUrl, this.toRequestDto(payload))
      .subscribe({
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
              producto.id === id ? productoActualizado : producto,
            ),
          );
        },
        error: () => {
          this.error.set('No se ha podido modificar el producto.');
        },
      });
  }

  borrarProducto(id: number): void {
    this.error.set(null);

    this.http.delete<void>(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.productosSignal.update((productos) =>
          productos.filter((producto) => producto.id !== id),
        );
      },
      error: () => {
        this.error.set('No se ha podido borrar el producto.');
      },
    });
  }

  actualizarEstadoProducto(id: number, activo: boolean): void {
    this.error.set(null);

    this.http.patch<Producto>(`${this.apiUrl}/${id}`, { activo }).subscribe({
      next: (productoActualizado) => {
        this.productosSignal.update((productos) =>
          productos.map((producto) =>
            producto.id === id ? productoActualizado : producto,
          ),
        );
      },
      error: () => {
        this.error.set('No se ha podido actualizar el estado del producto.');
      },
    });
  }

  actualizarStockLocal(id: number, stock: number): void {
    this.productosSignal.update((productos) =>
      productos.map((producto) =>
        producto.id === id
          ? { ...producto, stock: Math.max(0, stock) }
          : producto,
      ),
    );
  }

  descontarStockLocal(id: number, cantidad: number): void {
    this.productosSignal.update((productos) =>
      productos.map((producto) =>
        producto.id === id
          ? { ...producto, stock: Math.max(0, producto.stock - cantidad) }
          : producto,
      ),
    );
  }

  private toRequestDto(producto: ProductoPayload) {
    return {
      nombre: producto.nombre.trim(),
      descripcion: producto.descripcion?.trim() ?? '',
      precio: Number(producto.precio) || 0,
      stock: Math.max(0, Number(producto.stock) || 0),
      imagenUrl: producto.imagenUrl?.trim() || 'assets/images/placeholder.svg',
      idCategoria:
        producto.idCategoria ||
        this.resolverIdCategoria(producto.nombreCategoria),
      activo: producto.activo ?? true,
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
    producto: Producto,
  ): Producto[] {
    const existe = productos.some((item) => item.id === producto.id);

    if (!existe) {
      return [...productos, producto];
    }

    return productos.map((item) => (item.id === producto.id ? producto : item));
  }
}
