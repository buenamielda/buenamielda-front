import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { PedidoEstado, PedidoResponseDto } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    MatIconModule,
  ],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss',
})
export class UserOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  readonly pedidos = signal<PedidoResponseDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly busqueda = signal('');

  readonly pedidosOrdenados = computed(() =>
    [...this.pedidos()].sort(
      (a, b) =>
        new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime(),
    ),
  );

  readonly pedidosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();

    if (!texto) {
      return this.pedidosOrdenados();
    }

    return this.pedidosOrdenados().filter((pedido) =>
      [
        pedido.id,
        pedido.estado,
        pedido.fechaPedido,
        pedido.total,
        pedido.localidad ?? '',
        pedido.provincia ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto),
    );
  });

  readonly totalPedidos = computed(() => this.pedidos().length);

  readonly totalGastado = computed(() =>
    this.pedidos().reduce((total, pedido) => total + pedido.total, 0),
  );

  readonly totalEntregados = computed(
    () =>
      this.pedidos().filter((pedido) => pedido.estado === 'ENTREGADO').length,
  );

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.orderService.getOrdersFromApi().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar tus pedidos.');
        this.cargando.set(false);
      },
    });
  }

  puedeValorar(pedido: PedidoResponseDto): boolean {
    return pedido.estado === 'ENTREGADO';
  }

  formatearEstado(estado: PedidoEstado): string {
    return estado
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }
}