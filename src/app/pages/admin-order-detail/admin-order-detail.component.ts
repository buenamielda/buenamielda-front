import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminPedidoDetallesResponseDto } from '../../models/admin-order.model';
import { AdminOrderService } from '../../services/admin-order.service';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
})
export class AdminOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminOrderService = inject(AdminOrderService);

  readonly pedido = signal<AdminPedidoDetallesResponseDto | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

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
}