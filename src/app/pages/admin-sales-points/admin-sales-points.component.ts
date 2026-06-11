import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { HttpErrorResponse } from '@angular/common/http';

import {
  AdminSalesPointRequestDto,
  AdminSalesPointResponseDto,
} from '../../models/admin-sales-point.model';
import { AdminSalesPointService } from '../../services/admin-sales-point.service';

interface SalesPointForm {
  nombre: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  latitud: number | null;
  longitud: number | null;
  telefono: string;
  horario: string;
}

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

  readonly form = signal<SalesPointForm>(this.emptyForm());
  readonly saving = signal(false);
  readonly creationError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

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

  updateField<K extends keyof SalesPointForm>(
    field: K,
    value: SalesPointForm[K],
  ): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));

    this.creationError.set(null);
    this.successMessage.set(null);
  }

  createSalesPoint(): void {
    const form = this.form();

    this.creationError.set(null);
    this.successMessage.set(null);

    if (!form.nombre.trim()) {
      this.creationError.set('Introduce el nombre del punto de venta.');
      return;
    }

    if (!form.direccion.trim()) {
      this.creationError.set('Introduce la dirección.');
      return;
    }

    if (!form.codigoPostal.trim()) {
      this.creationError.set('Introduce el código postal.');
      return;
    }

    if (!form.localidad.trim()) {
      this.creationError.set('Introduce la localidad.');
      return;
    }

    if (!form.provincia.trim()) {
      this.creationError.set('Introduce la provincia.');
      return;
    }

    if (!form.pais.trim()) {
      this.creationError.set('Introduce el país.');
      return;
    }

    if (form.latitud === null || form.latitud < -90 || form.latitud > 90) {
      this.creationError.set('La latitud debe estar entre -90 y 90.');
      return;
    }

    if (form.longitud === null || form.longitud < -180 || form.longitud > 180) {
      this.creationError.set('La longitud debe estar entre -180 y 180.');
      return;
    }

    if (!form.telefono.trim()) {
      this.creationError.set('Introduce el teléfono.');
      return;
    }

    const request: AdminSalesPointRequestDto = {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      codigoPostal: form.codigoPostal.trim(),
      localidad: form.localidad.trim(),
      provincia: form.provincia.trim(),
      pais: form.pais.trim(),
      latitud: Number(form.latitud),
      longitud: Number(form.longitud),
      telefono: form.telefono.trim(),
      horario: form.horario.trim(),
    };

    this.saving.set(true);

    this.adminSalesPointService.createSalesPoint(request).subscribe({
      next: (createdSalesPoint) => {
        this.successMessage.set(
          `El punto de venta "${createdSalesPoint.nombre}" se ha creado correctamente.`,
        );
        this.form.set(this.emptyForm());
        this.saving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.creationError.set(
          error.error?.message ?? 'No se ha podido crear el punto de venta.',
        );
        this.saving.set(false);
      },
    });
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

  private emptyForm(): SalesPointForm {
    return {
      nombre: '',
      direccion: '',
      codigoPostal: '',
      localidad: '',
      provincia: '',
      pais: 'España',
      latitud: null,
      longitud: null,
      telefono: '',
      horario: '',
    };
  }
}
