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
  readonly categoriaAplicada = signal<number | null>(null);

  readonly categorias: CategoriaFiltro[] = [
    { id: 1, nombre: 'Miel' },
    { id: 2, nombre: 'Polen' },
  ];

  readonly nombreCategoriaAplicada = computed(() => {
    const categoriaId = this.categoriaAplicada();

    return (
      this.categorias.find((categoria) => categoria.id === categoriaId)
        ?.nombre ?? 'Todas las categorías'
    );
  });

  ngOnInit(): void {
    this.catalogoProductos.cargarProductos();
  }

  seleccionarCategoria(valor: string): void {
    this.categoriaSeleccionada.set(valor ? Number(valor) : null);
  }

  aplicarFiltro(): void {
    const categoriaId = this.categoriaSeleccionada();

    this.categoriaAplicada.set(categoriaId);
    this.catalogoProductos.cargarProductos({
      categoriaId: categoriaId ?? undefined,
    });
  }

  limpiarFiltro(): void {
    this.categoriaSeleccionada.set(null);
    this.categoriaAplicada.set(null);
    this.catalogoProductos.cargarProductos();
  }

  formatearPrecio(precio: number): string {
    return `${precio.toFixed(2).replace('.', ',')} €`;
  }
}