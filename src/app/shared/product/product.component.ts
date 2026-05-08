import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ProductCatalogService } from '../../services/product-catalog.service';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductGridComponent implements OnInit {
  private readonly catalogoProductos = inject(ProductCatalogService);

  @Input() sectionTitle = 'Todos los productos';
  @Input() showControls = true;
  @Input() showViewToggle = true;

  busqueda = signal('');
  ordenSeleccionado = signal('default');
  modoVista = signal<'grid' | 'list'>('grid');

  opcionesOrden = [
    { value: 'default', label: 'Ordenar por' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
    { value: 'name-desc', label: 'Nombre: Z-A' },
  ];

  productosFiltrados = computed(() => {
    let resultado = this.catalogoProductos.productos();

    const textoBusqueda = this.busqueda().toLowerCase().trim();

    if (textoBusqueda) {
      resultado = resultado.filter((producto) =>
        producto.nombre.toLowerCase().includes(textoBusqueda)
      );
    }

    switch (this.ordenSeleccionado()) {
      case 'price-asc':
        return [...resultado].sort((a, b) => a.precio - b.precio);
      case 'price-desc':
        return [...resultado].sort((a, b) => b.precio - a.precio);
      case 'name-asc':
        return [...resultado].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
      case 'name-desc':
        return [...resultado].sort((a, b) =>
          b.nombre.localeCompare(a.nombre)
        );
      default:
        return resultado;
    }
  });

  get etiquetaResultados(): string {
    const total = this.catalogoProductos.productos().length;
    const visibles = this.productosFiltrados().length;

    if (visibles === 0) {
      return `Mostrando 0 de ${total} resultados`;
    }

    return `Mostrando 1-${visibles} de ${total} resultados`;
  }

  ngOnInit(): void {
    this.catalogoProductos.cargarProductos();
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
  }

  ordenar(valor: string): void {
    this.ordenSeleccionado.set(valor);
  }

  cambiarVista(modo: 'grid' | 'list'): void {
    this.modoVista.set(modo);
  }

  formatearPrecio(precio: number): string {
    return precio.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }
}