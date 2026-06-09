import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { AdminPedidoResponseDto } from '../models/admin-order.model';

@Injectable({
  providedIn: 'root',
})
export class AdminOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/admin/pedidos';

  private readonly pedidosSignal = signal<AdminPedidoResponseDto[]>([]);

  readonly pedidos = computed(() =>
    [...this.pedidosSignal()].sort(
      (a, b) =>
        new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime(),
    ),
  );

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargarPedidos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<AdminPedidoResponseDto[]>(this.apiUrl).subscribe({
      next: (pedidos) => {
        this.pedidosSignal.set(pedidos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar los pedidos.');
        this.cargando.set(false);
      },
    });
  }
}