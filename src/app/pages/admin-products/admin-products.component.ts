import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Producto, ProductoPayload } from '../../models/product.model';
import { ProductCatalogService } from '../../services/product-catalog.service';

interface FormularioProducto {
  nombre: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  idCategoria: number;
  nombreCategoria: string;
  activo: boolean;
  pesoNeto: string;
  descripcion: string;
  detallesTexto: string;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private readonly productCatalog = inject(ProductCatalogService);

  readonly productos = this.productCatalog.todosLosProductos;
  readonly editingId = signal<number | null>(null);
  readonly busqueda = signal('');
  readonly form = signal(this.formularioVacio());

  readonly productosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();

    if (!q) {
      return this.productos();
    }

    return this.productos().filter((producto) =>
      [
        producto.nombre,
        producto.nombreCategoria,
        producto.descripcion ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  readonly activeCount = computed(
    () => this.productos().filter((producto) => producto.activo).length
  );

  readonly inactiveCount = computed(
    () => this.productos().filter((producto) => !producto.activo).length
  );

  ngOnInit(): void {
    this.productCatalog.cargarProductos();
  }

  onFieldChange<K extends keyof FormularioProducto>(
    field: K,
    value: FormularioProducto[K]
  ): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  saveProduct(): void {
    const payload = this.toPayload(this.form());
    const editingId = this.editingId();

    if (editingId) {
      this.productCatalog.actualizarProducto(editingId, payload);
    } else {
      this.productCatalog.crearProducto(payload);
    }

    this.resetForm();
  }

  editProduct(producto: Producto): void {
    this.editingId.set(producto.id);

    this.form.set({
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock ?? 1,
      imagenUrl: producto.imagenUrl,
      idCategoria:
        producto.idCategoria ?? this.resolverIdCategoria(producto.nombreCategoria),
      nombreCategoria: producto.nombreCategoria,
      activo: producto.activo,
      pesoNeto: producto.pesoNeto ?? '',
      descripcion: producto.descripcion ?? '',
      detallesTexto: producto.detalles?.join('\n') ?? '',
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.set(this.formularioVacio());
  }

  toggleActive(producto: Producto): void {
    if (producto.activo) {
      this.productCatalog.desactivarProducto(producto.id);
    }
  }

  deleteProduct(producto: Producto): void {
    const confirmed = window.confirm(
      `Quieres borrar definitivamente "${producto.nombre}"?`
    );

    if (confirmed) {
      this.productCatalog.desactivarProducto(producto.id);

      if (this.editingId() === producto.id) {
        this.resetForm();
      }
    }
  }

  formatPrice(precio: number): string {
    return precio.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  private formularioVacio(): FormularioProducto {
    return {
      nombre: '',
      precio: 0,
      stock: 1,
      imagenUrl: 'assets/images/miel-tomillo.svg',
      idCategoria: 1,
      nombreCategoria: 'Miel',
      activo: true,
      pesoNeto: '',
      descripcion: '',
      detallesTexto: '',
    };
  }

  private toPayload(form: FormularioProducto): ProductoPayload {
    return {
      nombre: form.nombre.trim(),
      precio: Number(form.precio) || 0,
      stock: Number(form.stock) || 1,
      imagenUrl: form.imagenUrl.trim() || 'assets/images/miel-tomillo.svg',
      idCategoria: Number(form.idCategoria) || 1,
      nombreCategoria: form.nombreCategoria.trim() || 'Miel',
      activo: form.activo,
      pesoNeto: form.pesoNeto.trim(),
      descripcion: form.descripcion.trim(),
      detalles: form.detallesTexto
        .split('\n')
        .map((detalle) => detalle.trim())
        .filter(Boolean),
    };
  }

  private resolverIdCategoria(nombreCategoria: string): number {
    const categoria = nombreCategoria.toLowerCase().trim();

    if (categoria === 'polen') {
      return 2;
    }

    return 1;
  }
}