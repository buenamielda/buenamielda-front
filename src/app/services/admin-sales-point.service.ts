import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import {
  AdminSalesPointRequestDto,
  AdminSalesPointResponseDto,
} from '../models/admin-sales-point.model';

@Injectable({
  providedIn: 'root',
})
export class AdminSalesPointService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/admin/puntos-venta';

  private readonly salesPointsSignal = signal<AdminSalesPointResponseDto[]>([]);

  readonly salesPoints = computed(() =>
    [...this.salesPointsSignal()].sort((a, b) => a.id - b.id),
  );

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadSalesPoints(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<AdminSalesPointResponseDto[]>(this.apiUrl).subscribe({
      next: (salesPoints) => {
        this.salesPointsSignal.set(salesPoints);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se ha podido cargar el listado de puntos de venta.');
        this.loading.set(false);
      },
    });
  }

  createSalesPoint(
    request: AdminSalesPointRequestDto,
  ): Observable<AdminSalesPointResponseDto> {
    return this.http
      .post<AdminSalesPointResponseDto>(this.apiUrl, request)
      .pipe(
        tap((createdSalesPoint) => {
          this.salesPointsSignal.update((salesPoints) => [
            ...salesPoints,
            createdSalesPoint,
          ]);
        }),
      );
  }

  updateSalesPoint(
    id: number,
    request: AdminSalesPointRequestDto,
  ): Observable<AdminSalesPointResponseDto> {
    return this.http
      .put<AdminSalesPointResponseDto>(`${this.apiUrl}/${id}`, request)
      .pipe(
        tap((updatedSalesPoint) => {
          this.salesPointsSignal.update((salesPoints) =>
            salesPoints.map((salesPoint) =>
              salesPoint.id === id ? updatedSalesPoint : salesPoint,
            ),
          );
        }),
      );
  }
}
