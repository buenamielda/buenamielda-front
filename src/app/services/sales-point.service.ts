import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { SalesPointResponseDto } from '../models/sales-point.model';

@Injectable({
  providedIn: 'root',
})
export class SalesPointService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/puntos-venta';

  private readonly salesPointsSignal = signal<SalesPointResponseDto[]>([]);

  readonly salesPoints = computed(() =>
    [...this.salesPointsSignal()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    ),
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadSalesPoints(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<SalesPointResponseDto[]>(this.apiUrl).subscribe({
      next: (salesPoints) => {
        this.salesPointsSignal.set(salesPoints);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar los puntos de venta.');
        this.loading.set(false);
      },
    });
  }
}