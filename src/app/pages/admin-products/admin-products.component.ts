import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import {
  ProductCatalogService,
  ProductPayload,
} from '../../services/product-catalog.service';

interface ProductForm {
  name: string;
  price: number;
  image: string;
  category: string;
  active: boolean;
  netWeight: string;
  description: string;
  detailsText: string;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent {
  private readonly productCatalog = inject(ProductCatalogService);

  readonly products = this.productCatalog.allProducts;
  readonly editingId = signal<number | null>(null);
  readonly searchQuery = signal('');

  readonly form = signal<ProductForm>(this.emptyForm());

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.products();
    }

    return this.products().filter((product) =>
      [product.name, product.category, product.description ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  readonly activeCount = computed(
    () => this.products().filter((product) => product.active).length
  );

  readonly inactiveCount = computed(
    () => this.products().filter((product) => !product.active).length
  );

  onFieldChange<K extends keyof ProductForm>(field: K, value: ProductForm[K]): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  saveProduct(): void {
    const payload = this.toPayload(this.form());
    const editingId = this.editingId();

    if (editingId) {
      this.productCatalog.update(editingId, payload);
    } else {
      this.productCatalog.create(payload);
    }

    this.resetForm();
  }

  editProduct(product: Product): void {
    this.editingId.set(product.id);
    this.form.set({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      active: product.active,
      netWeight: product.netWeight ?? '',
      description: product.description ?? '',
      detailsText: product.details?.join('\n') ?? '',
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.set(this.emptyForm());
  }


  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  private emptyForm(): ProductForm {
    return {
      name: '',
      price: 0,
      image: 'assets/images/miel-tomillo.svg',
      category: 'miel',
      active: true,
      netWeight: '',
      description: '',
      detailsText: '',
    };
  }

  private toPayload(form: ProductForm): ProductPayload {
    return {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      image: form.image.trim() || 'assets/images/miel-tomillo.svg',
      category: form.category.trim() || 'miel',
      active: form.active,
      netWeight: form.netWeight.trim(),
      description: form.description.trim(),
      details: form.detailsText
        .split('\n')
        .map((detail) => detail.trim())
        .filter(Boolean),
    };
  }
}
