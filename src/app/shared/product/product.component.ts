import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../models/product.model';

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
  @Input() sectionTitle = 'Todos los productos';
  @Input() showControls = true;
  @Input() showViewToggle = true;
  // this.products.set(await this.productService.getAll())
  private allProducts = signal<Product[]>([
    { id: 1, name: 'Miel de Tomillo',    price: 9.99,  image: 'assets/images/miel-tomillo.jpg',    category: 'miel' },
    { id: 2, name: 'Miel de Mil Flores', price: 9.99,  image: 'assets/images/miel-mil-flores.jpg', category: 'miel' },
    { id: 3, name: 'Miel de Montaña',    price: 9.99,  image: 'assets/images/miel-montana.jpg',    category: 'miel' },
    { id: 4, name: 'Miel de Lavanda',    price: 9.99,  image: 'assets/images/miel-lavanda.jpg',    category: 'miel' },
    { id: 5, name: 'Miel del Bosque',    price: 9.99,  image: 'assets/images/miel-bosque.jpg',     category: 'miel' },
    { id: 6, name: 'Miel de Azahar',     price: 9.99,  image: 'assets/images/miel-azahar.jpg',     category: 'miel' },
    { id: 7, name: 'Miel de Eucalipto',  price: 9.99,  image: 'assets/images/miel-eucalipto.jpg',  category: 'miel' },
    { id: 8, name: 'Polen natural',      price: 12.50, image: 'assets/images/polen-natural.jpg',   category: 'polen' },
  ]);

  searchQuery  = signal('');
  sortOrder    = signal('default');
  viewMode     = signal<'grid' | 'list'>('grid');

  sortOptions = [
    { value: 'default',     label: 'Ordenar por' },
    { value: 'price-asc',   label: 'Precio: menor a mayor' },
    { value: 'price-desc',  label: 'Precio: mayor a menor' },
    { value: 'name-asc',    label: 'Nombre: A-Z' },
    { value: 'name-desc',   label: 'Nombre: Z-A' },
  ];

  // Productos filtrados y ordenados reactivamente
  filteredProducts = computed(() => {
    let result = this.allProducts();

    // Filtro por búsqueda
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }

    // Ordenación
    switch (this.sortOrder()) {
      case 'price-asc':  return [...result].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...result].sort((a, b) => b.price - a.price);
      case 'name-asc':   return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':  return [...result].sort((a, b) => b.name.localeCompare(a.name));
      default:           return result;
    }
  });

  get resultLabel(): string {
    const total   = this.allProducts().length;
    const visible = this.filteredProducts().length;
    return `Mostrando 1-${visible} de ${total} resultados`;
  }

  onSearch(value: string)  { this.searchQuery.set(value); }
  onSort(value: string)    { this.sortOrder.set(value); }
  setView(mode: 'grid' | 'list') { this.viewMode.set(mode); }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + '€';
  }
}