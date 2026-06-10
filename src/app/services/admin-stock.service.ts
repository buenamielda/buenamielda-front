import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  AdminProductoStockResponseDto,
  AdminStockUpdateRequestDto,
} from '../models/admin-stock.model';

@Injectable({
  providedIn: 'root',
})
export class AdminStockService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/admin/stock';

  private readonly productosStockSignal = signal<
    AdminProductoStockResponseDto[]
  >([]);

  readonly productosStock = computed(() =>
    [...this.productosStockSignal()].sort((a, b) => a.id - b.id),
  );

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargarStock(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<AdminProductoStockResponseDto[]>(this.apiUrl).subscribe({
      next: (productos) => {
        this.productosStockSignal.set(productos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se ha podido cargar el stock de los productos.');
        this.cargando.set(false);
      },
    });
  }

  actualizarStock(
    idProducto: number,
    request: AdminStockUpdateRequestDto,
  ): Observable<AdminProductoStockResponseDto> {
    return this.http
      .patch<AdminProductoStockResponseDto>(
        `/api/admin/productos/${idProducto}/stock`,
        request,
      )
      .pipe(
        tap((productoActualizado) => {
          this.productosStockSignal.update((productos) =>
            productos.map((producto) =>
              producto.id === idProducto ? productoActualizado : producto,
            ),
          );
        }),
      );
  }
}
