import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ProductCatalogService } from '../../services/product-catalog.service';

interface CategoriaFiltro {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.scss',
})
export class ProductFiltersComponent implements OnInit {
  private readonly catalogoProductos = inject(ProductCatalogService);

  readonly productos = this.catalogoProductos.productos;
  readonly cargando = this.catalogoProductos.cargando;
  readonly error = this.catalogoProductos.error;

  readonly categoriaSeleccionada = signal<number | null>(null);
  readonly precioMinimo = signal<number | null>(null);
  readonly precioMaximo = signal<number | null>(null);
  readonly errorFiltros = signal<string | null>(null);
readonly disponibilidadSeleccionada = signal<boolean | null>(null);

  readonly categoriaAplicada = signal<number | null>(null);
  readonly precioMinimoAplicado = signal<number | null>(null);
  readonly precioMaximoAplicado = signal<number | null>(null);
readonly disponibilidadAplicada = signal<boolean | null>(null);

  readonly categorias: CategoriaFiltro[] = [
    { id: 1, nombre: 'Miel' },
    { id: 2, nombre: 'Polen' },
  ];

  readonly resumenFiltrosAplicados = computed(() => {
    const filtros: string[] = [];

    const categoria = this.categorias.find(
      (item) => item.id === this.categoriaAplicada(),
    );

    if (categoria) {
      filtros.push(categoria.nombre);
    }

    if (this.precioMinimoAplicado() !== null) {
      filtros.push(`Desde ${this.formatearPrecio(this.precioMinimoAplicado()!)}`);
    }

    if (this.precioMaximoAplicado() !== null) {
      filtros.push(`Hasta ${this.formatearPrecio(this.precioMaximoAplicado()!)}`);
    }

    if (this.disponibilidadAplicada() !== null) {
      filtros.push(this.disponibilidadAplicada() ? 'Disponible' : 'No disponible');
    }

    return filtros.length ? filtros.join(' · ') : 'Todos los productos';
  });

  ngOnInit(): void {
    this.catalogoProductos.cargarProductos();
  }

  seleccionarCategoria(valor: number | null): void {
    this.categoriaSeleccionada.set(valor ? Number(valor) : null);
  }

  cambiarPrecioMinimo(valor: number | null): void {
    this.precioMinimo.set(this.normalizarPrecio(valor));
    this.errorFiltros.set(null);
  }

  cambiarPrecioMaximo(valor: number | null): void {
    this.precioMaximo.set(this.normalizarPrecio(valor));
    this.errorFiltros.set(null);
  }

  aplicarFiltro(): void {
    if (!this.validarPrecios()) {
      return;
    }

    const categoriaId = this.categoriaSeleccionada();
    const precioMin = this.precioMinimo();
    const precioMax = this.precioMaximo();
const disponible = this.disponibilidadSeleccionada();

    this.categoriaAplicada.set(categoriaId);
    this.precioMinimoAplicado.set(precioMin);
    this.precioMaximoAplicado.set(precioMax);
    this.disponibilidadAplicada.set(disponible);

    this.catalogoProductos.cargarProductos({
      categoriaId: categoriaId ?? undefined,
      precioMin: precioMin ?? undefined,
      precioMax: precioMax ?? undefined,
      disponible: disponible ?? undefined,
    });
  }

  limpiarFiltro(): void {
    this.categoriaSeleccionada.set(null);
    this.precioMinimo.set(null);
    this.precioMaximo.set(null);
    this.errorFiltros.set(null);
    this.disponibilidadSeleccionada.set(null);

    this.categoriaAplicada.set(null);
    this.precioMinimoAplicado.set(null);
    this.precioMaximoAplicado.set(null);
    this.disponibilidadAplicada.set(null);

    this.catalogoProductos.cargarProductos();
  }

  formatearPrecio(precio: number): string {
    return `${precio.toFixed(2).replace('.', ',')} €`;
  }

  private validarPrecios(): boolean {
    const precioMin = this.precioMinimo();
    const precioMax = this.precioMaximo();

    if (precioMin !== null && precioMin < 0) {
      this.errorFiltros.set('El precio mínimo no puede ser negativo.');
      return false;
    }

    if (precioMax !== null && precioMax < 0) {
      this.errorFiltros.set('El precio máximo no puede ser negativo.');
      return false;
    }

    if (
      precioMin !== null &&
      precioMax !== null &&
      precioMin > precioMax
    ) {
      this.errorFiltros.set(
        'El precio mínimo no puede ser superior al precio máximo.',
      );
      return false;
    }

    this.errorFiltros.set(null);
    return true;
  }

  private normalizarPrecio(valor: number | null): number | null {
    if (valor === null || valor === undefined || valor === ('' as unknown)) {
      return null;
    }

    const precio = Number(valor);

    return Number.isFinite(precio) ? precio : null;
  }

  seleccionarDisponibilidad(valor: boolean | null): void {
  this.disponibilidadSeleccionada.set(valor);
}
}