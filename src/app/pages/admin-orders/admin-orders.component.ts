import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AdminOrderService } from '../../services/admin-order.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private readonly adminOrderService = inject(AdminOrderService);

  readonly pedidos = this.adminOrderService.pedidos;
  readonly cargando = this.adminOrderService.cargando;
  readonly error = this.adminOrderService.error;
  readonly busqueda = signal('');

  readonly pedidosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();

    if (!texto) {
      return this.pedidos();
    }

    return this.pedidos().filter((pedido) =>
      [
        pedido.id.toString(),
        pedido.emailUsuario ?? '',
        pedido.estado,
        pedido.total.toString(),
        pedido.fechaPedido,
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto),
    );
  });

  readonly totalPendientes = computed(
    () =>
      this.pedidos().filter(
        (pedido) =>
          pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO',
      ).length,
  );

  readonly totalEntregados = computed(
    () =>
      this.pedidos().filter((pedido) => pedido.estado === 'ENTREGADO').length,
  );

  ngOnInit(): void {
    this.adminOrderService.cargarPedidos();
  }

  formatearEstado(estado: string): string {
    return estado
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (letra) => letra.toUpperCase());
  }
}