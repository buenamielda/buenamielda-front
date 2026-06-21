import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { PedidoEstado, PedidoResponseDto } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-user-order-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, MatIconModule],
  templateUrl: './user-order-detail.component.html',
  styleUrl: './user-order-detail.component.scss',
})
export class UserOrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  readonly pedido = signal<PedidoResponseDto | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate(['/pedidos']);
      return;
    }

    this.cargarPedido(id);
  }

  formatearEstado(estado: PedidoEstado): string {
    return estado
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }

  private cargarPedido(id: number): void {
    this.cargando.set(true);
    this.error.set('');

    this.orderService.getOrderByIdFromApi(id).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se ha podido cargar el detalle del pedido.');
        this.cargando.set(false);
      },
    });
  }
}