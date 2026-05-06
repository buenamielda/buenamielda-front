import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
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
export class ProductGridComponent {
  private readonly productCatalog = inject(ProductCatalogService);

  @Input() sectionTitle = 'Todos los productos';
  @Input() showControls = true;
  @Input() showViewToggle = true;

  searchQuery = signal('');
  sortOrder = signal('default');
  viewMode = signal<'grid' | 'list'>('grid');

  sortOptions = [
    { value: 'default', label: 'Ordenar por' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
    { value: 'name-desc', label: 'Nombre: Z-A' },
  ];

  filteredProducts = computed(() => {
    let result = this.productCatalog.products();

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter((product) => product.name.toLowerCase().includes(q));
    }

    switch (this.sortOrder()) {
      case 'price-asc':
        return [...result].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...result].sort((a, b) => b.price - a.price);
      case 'name-asc':
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return [...result].sort((a, b) => b.name.localeCompare(a.name));
      default:
        return result;
    }
  });

  get resultLabel(): string {
    const total = this.productCatalog.products().length;
    const visible = this.filteredProducts().length;
    return `Mostrando 1-${visible} de ${total} resultados`;
  }

  onSearch(value: string) { this.searchQuery.set(value); }
  onSort(value: string) { this.sortOrder.set(value); }
  setView(mode: 'grid' | 'list') { this.viewMode.set(mode); }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + 'EUR';
  }
}