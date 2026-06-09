import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  AdminPedidoDetallesResponseDto,
  AdminPedidoEstado,
} from '../../models/admin-order.model';
import { AdminOrderService } from '../../services/admin-order.service';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
})
export class AdminOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminOrderService = inject(AdminOrderService);

  readonly pedido = signal<AdminPedidoDetallesResponseDto | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly estadosDisponibles: AdminPedidoEstado[] = [
    'CREADO',
    'PENDIENTE',
    'PAGADO',
    'EN_PREPARACION',
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
  ];

  readonly estadoSeleccionado = signal<AdminPedidoEstado>('CREADO');
  readonly actualizandoEstado = signal(false);
  readonly mensajeEstado = signal<string | null>(null);
  readonly errorEstado = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador del pedido no es válido.');
      return;
    }

    this.cargarPedido(id);
  }

  formatearEstado(estado: string): string {
    return estado
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (letra) => letra.toUpperCase());
  }

  mostrarImagenAlternativa(event: Event): void {
    const imagen = event.target as HTMLImageElement;
    imagen.src = 'assets/images/placeholder.svg';
  }

  private cargarPedido(id: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.adminOrderService.obtenerPedidoPorId(id).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.estadoSeleccionado.set(pedido.estado as AdminPedidoEstado);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          error.error?.message ?? 'No se ha podido cargar el pedido.',
        );

        this.cargando.set(false);
      },
    });
  }

  actualizarEstado(): void {
    const pedido = this.pedido();
    const nuevoEstado = this.estadoSeleccionado();

    if (!pedido || pedido.estado === nuevoEstado) {
      return;
    }

    const confirmado = window.confirm(
      `¿Quieres cambiar el estado del pedido #${pedido.id} a "${this.formatearEstado(nuevoEstado)}"?`,
    );

    if (!confirmado) {
      this.estadoSeleccionado.set(pedido.estado as AdminPedidoEstado);
      return;
    }

    this.actualizandoEstado.set(true);
    this.mensajeEstado.set(null);
    this.errorEstado.set(null);

    this.adminOrderService
      .actualizarEstadoPedido(pedido.id, { estado: nuevoEstado })
      .subscribe({
        next: (pedidoActualizado) => {
          this.pedido.update((pedidoActual) =>
            pedidoActual
              ? {
                  ...pedidoActual,
                  estado: pedidoActualizado.estado,
                }
              : null,
          );

          this.mensajeEstado.set(
            'El estado del pedido se ha actualizado correctamente.',
          );

          this.actualizandoEstado.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.estadoSeleccionado.set(pedido.estado as AdminPedidoEstado);

          this.errorEstado.set(
            error.error?.message ??
              'No se ha podido actualizar el estado del pedido.',
          );

          this.actualizandoEstado.set(false);
        },
      });
  }
}
