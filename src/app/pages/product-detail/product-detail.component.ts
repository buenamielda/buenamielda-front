import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProductCatalogService } from '../../services/product-catalog.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productCatalog = inject(ProductCatalogService);

  readonly quantity = signal(1);
  readonly purchaseMode = signal<'single' | 'subscription'>('single');

  readonly product = computed(() => {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 1);
    return this.productCatalog.getById(id) ?? this.productCatalog.products()[0];
  });

  readonly total = computed(() => this.product().price * this.quantity());

  increaseQuantity(): void {
    this.quantity.update((value) => value + 1);
  }

  decreaseQuantity(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  setPurchaseMode(mode: 'single' | 'subscription'): void {
    this.purchaseMode.set(mode);
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }
}