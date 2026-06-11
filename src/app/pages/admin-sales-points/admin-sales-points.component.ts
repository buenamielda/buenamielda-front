import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AdminSalesPointResponseDto } from '../../models/admin-sales-point.model';
import { AdminSalesPointService } from '../../services/admin-sales-point.service';

@Component({
  selector: 'app-admin-sales-points',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './admin-sales-points.component.html',
  styleUrl: './admin-sales-points.component.scss',
})
export class AdminSalesPointsComponent implements OnInit {
  private readonly adminSalesPointService = inject(AdminSalesPointService);

  readonly salesPoints = this.adminSalesPointService.salesPoints;
  readonly loading = this.adminSalesPointService.loading;
  readonly error = this.adminSalesPointService.error;

  readonly search = signal('');

  readonly filteredSalesPoints = computed(() => {
    const value = this.search().trim().toLowerCase();

    if (!value) {
      return this.salesPoints();
    }

    return this.salesPoints().filter((salesPoint) =>
      [
        salesPoint.id.toString(),
        salesPoint.nombre,
        salesPoint.direccion,
        salesPoint.codigoPostal,
        salesPoint.localidad,
        salesPoint.provincia,
        salesPoint.pais,
        salesPoint.activo ? 'activo' : 'inactivo',
      ]
        .join(' ')
        .toLowerCase()
        .includes(value),
    );
  });

  readonly activeCount = computed(
    () => this.salesPoints().filter((salesPoint) => salesPoint.activo).length,
  );

  readonly inactiveCount = computed(
    () => this.salesPoints().filter((salesPoint) => !salesPoint.activo).length,
  );

  ngOnInit(): void {
    this.adminSalesPointService.loadSalesPoints();
  }

  fullAddress(salesPoint: AdminSalesPointResponseDto): string {
    return [
      salesPoint.direccion,
      `${salesPoint.codigoPostal} ${salesPoint.localidad}`,
      salesPoint.provincia,
      salesPoint.pais,
    ].join(', ');
  }

  formatCoordinates(salesPoint: AdminSalesPointResponseDto): string {
    return `${Number(salesPoint.latitud).toFixed(6)}, ${Number(
      salesPoint.longitud,
    ).toFixed(6)}`;
  }
}