import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  AdminProductoStockResponseDto,
  AdminStockAlertResponseDto,
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

  private readonly alertasUrl = '/api/admin/alertas-stock';

  private readonly alertasSignal = signal<AdminStockAlertResponseDto[]>([]);

  readonly alertasPendientes = computed(() =>
    this.alertasSignal()
      .filter((alerta) => alerta.estado === 'PENDIENTE')
      .sort(
        (a, b) =>
          new Date(b.fechaCreacion).getTime() -
          new Date(a.fechaCreacion).getTime(),
      ),
  );

  readonly cargandoAlertas = signal(false);
  readonly errorAlertas = signal<string | null>(null);

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

  cargarAlertasPendientes(): void {
    this.cargandoAlertas.set(true);
    this.errorAlertas.set(null);

    this.http.get<AdminStockAlertResponseDto[]>(this.alertasUrl).subscribe({
      next: (alertas) => {
        this.alertasSignal.set(alertas);
        this.cargandoAlertas.set(false);
      },
      error: () => {
        this.errorAlertas.set(
          'No se han podido cargar las alertas de stock pendientes.',
        );
        this.cargandoAlertas.set(false);
      },
    });
  }
  resolverAlerta(idAlerta: number): Observable<AdminStockAlertResponseDto> {
    return this.http
      .patch<AdminStockAlertResponseDto>(
        `${this.alertasUrl}/${idAlerta}/resolver`,
        {},
      )
      .pipe(
        tap((alertaResuelta) => {
          this.alertasSignal.update((alertas) =>
            alertas.map((alerta) =>
              alerta.id === idAlerta ? alertaResuelta : alerta,
            ),
          );
        }),
      );
  }
}