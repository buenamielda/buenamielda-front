import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  FiltrosProducto,
  ProductCatalogService,
} from '../../services/product-catalog.service';

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

  readonly nombreBusqueda = signal('');
  readonly categoriaSeleccionada = signal<number | null>(null);
  readonly precioMinimo = signal<number | null>(null);
  readonly precioMaximo = signal<number | null>(null);
  readonly disponibilidadSeleccionada = signal<boolean | null>(null);
  readonly errorFiltros = signal<string | null>(null);

  readonly filtrosAplicados = signal<FiltrosProducto>({});

  readonly categorias: CategoriaFiltro[] = [
    { id: 1, nombre: 'Miel' },
    { id: 2, nombre: 'Polen' },
  ];

  readonly resumenFiltrosAplicados = computed(() => {
    const filtros = this.filtrosAplicados();
    const resumen: string[] = [];

    if (filtros.nombre) {
      resumen.push(`Nombre: ${filtros.nombre}`);
    }

    const categoria = this.categorias.find(
      (item) => item.id === filtros.categoriaId,
    );

    if (categoria) {
      resumen.push(categoria.nombre);
    }

    if (filtros.precioMin !== undefined) {
      resumen.push(`Desde ${this.formatearPrecio(filtros.precioMin)}`);
    }

    if (filtros.precioMax !== undefined) {
      resumen.push(`Hasta ${this.formatearPrecio(filtros.precioMax)}`);
    }

    if (filtros.disponible === true) {
      resumen.push('Con stock');
    }

    return resumen.length ? resumen.join(' · ') : 'Todos los productos';
  });

  ngOnInit(): void {
    this.catalogoProductos.cargarProductos();
  }

  cambiarNombre(valor: string): void {
    this.nombreBusqueda.set(valor);
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

  seleccionarDisponibilidad(valor: boolean | null): void {
    this.disponibilidadSeleccionada.set(valor);
  }

  aplicarFiltro(): void {
    if (!this.validarPrecios()) {
      return;
    }

    const filtros = this.construirFiltros();

    this.filtrosAplicados.set(filtros);
    this.catalogoProductos.cargarProductos(filtros);
  }

  limpiarFiltro(): void {
    this.nombreBusqueda.set('');
    this.categoriaSeleccionada.set(null);
    this.precioMinimo.set(null);
    this.precioMaximo.set(null);
    this.disponibilidadSeleccionada.set(null);
    this.errorFiltros.set(null);
    this.filtrosAplicados.set({});

    this.catalogoProductos.cargarProductos();
  }

  formatearPrecio(precio: number): string {
    return `${precio.toFixed(2).replace('.', ',')} €`;
  }

  private construirFiltros(): FiltrosProducto {
    const filtros: FiltrosProducto = {};

    const nombre = this.nombreBusqueda().trim();

    if (nombre) {
      filtros.nombre = nombre;
    }

    if (this.categoriaSeleccionada()) {
      filtros.categoriaId = this.categoriaSeleccionada()!;
    }

    if (this.precioMinimo() !== null) {
      filtros.precioMin = this.precioMinimo()!;
    }

    if (this.precioMaximo() !== null) {
      filtros.precioMax = this.precioMaximo()!;
    }

    if (this.disponibilidadSeleccionada() !== null) {
      filtros.disponible = this.disponibilidadSeleccionada()!;
    }

    return filtros;
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

    if (precioMin !== null && precioMax !== null && precioMin > precioMax) {
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
}