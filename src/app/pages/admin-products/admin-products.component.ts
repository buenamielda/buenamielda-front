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
  private readonly catalogoProductos = inject(ProductCatalogService);

  readonly productos = this.catalogoProductos.todosLosProductos;
  readonly error = this.catalogoProductos.error;

  readonly editingId = signal<number | null>(null);
  readonly busqueda = signal('');
  readonly form = signal<FormularioProducto>(this.formularioVacio());

  readonly productosFiltrados = computed(() => {
    const textoBusqueda = this.busqueda().trim().toLowerCase();

    if (!textoBusqueda) {
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
        .includes(textoBusqueda)
    );
  });

  readonly totalProductos = computed(() => this.productos().length);

  readonly totalActivos = computed(
    () => this.productos().filter((producto) => producto.activo).length
  );

  readonly totalInactivos = computed(
    () => this.productos().filter((producto) => !producto.activo).length
  );

  ngOnInit(): void {
    this.catalogoProductos.cargarProductos();
  }

  cambiarCampo<K extends keyof FormularioProducto>(
    campo: K,
    valor: FormularioProducto[K]
  ): void {
    this.form.update((actual) => ({ ...actual, [campo]: valor }));
  }

  cambiarCategoria(idCategoria: number): void {
    this.form.update((actual) => ({
      ...actual,
      idCategoria: Number(idCategoria),
      nombreCategoria: this.obtenerNombreCategoria(Number(idCategoria)),
    }));
  }

  guardarProducto(): void {
    const payload = this.convertirFormularioAPayload(this.form());
    const editingId = this.editingId();

    if (editingId) {
      this.catalogoProductos.actualizarProducto(editingId, payload);
    } else {
      this.catalogoProductos.crearProducto(payload);
    }

    this.reiniciarFormulario();
  }

  editarProducto(producto: Producto): void {
    const idCategoria =
      producto.idCategoria ?? this.resolverIdCategoria(producto.nombreCategoria);

    this.editingId.set(producto.id);

    this.form.set({
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock ?? 1,
      imagenUrl: producto.imagenUrl,
      idCategoria,
      nombreCategoria: producto.nombreCategoria,
      activo: producto.activo,
      pesoNeto: producto.pesoNeto ?? '',
      descripcion: producto.descripcion ?? '',
      detallesTexto: producto.detalles?.join('\n') ?? '',
    });
  }

  reiniciarFormulario(): void {
    this.editingId.set(null);
    this.form.set(this.formularioVacio());
  }

  desactivarProducto(producto: Producto): void {
    if (!producto.activo) {
      return;
    }

    this.catalogoProductos.desactivarProducto(producto.id);
  }

  borrarProducto(producto: Producto): void {
    const confirmado = window.confirm(
      `¿Quieres desactivar "${producto.nombre}"?`
    );

    if (confirmado) {
      this.catalogoProductos.desactivarProducto(producto.id);

      if (this.editingId() === producto.id) {
        this.reiniciarFormulario();
      }
    }
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  formatearPrecio(precio: number): string {
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

  private convertirFormularioAPayload(
    form: FormularioProducto
  ): ProductoPayload {
    return {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio) || 0,
      stock: Number(form.stock) || 1,
      imagenUrl: form.imagenUrl.trim() || 'assets/images/miel-tomillo.svg',
      idCategoria: Number(form.idCategoria) || 1,
      nombreCategoria: form.nombreCategoria,
      activo: form.activo,
      pesoNeto: form.pesoNeto.trim(),
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

  private obtenerNombreCategoria(idCategoria: number): string {
    if (idCategoria === 2) {
      return 'Polen';
    }

    return 'Miel';
  }
}