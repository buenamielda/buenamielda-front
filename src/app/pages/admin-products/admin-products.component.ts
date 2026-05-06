import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

  readonly form = signal<ProductForm>(this.emptyForm());

  onFieldChange<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K]
  ): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  createProduct(): void {
    const payload = this.toPayload(this.form());

    this.productCatalog.create(payload);

    this.resetForm();
  }

  resetForm(): void {
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