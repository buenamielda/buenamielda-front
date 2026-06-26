import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Producto, ProductoPayload } from '../../models/product.model';
import { ProductCatalogService } from '../../services/product-catalog.service';
import { AdminProductoStockResponseDto } from '../../models/admin-stock.model';
import { AdminStockService } from '../../services/admin-stock.service';
import { AdminCategoryService } from '../../services/admin-category.service';
import {
  ProductTechnicalSheet,
  ProductTechnicalSheetPayload,
} from '../../models/product-technical-sheet.model';
import { ProductTechnicalSheetService } from '../../services/product-technical-sheet.service';

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

interface FormularioFichaTecnica {
  titulo: string;
  descripcionAmpliada: string;
  propiedades: string;
  origen: string;
  usoRecomendado: string;
  conservacion: string;
  publicada: boolean;
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
  private readonly adminStockService = inject(AdminStockService);
  private readonly technicalSheetService = inject(ProductTechnicalSheetService);
  private readonly categoryService = inject(AdminCategoryService);

  readonly productos = this.catalogoProductos.todosLosProductos;
  readonly error = this.catalogoProductos.error;
  readonly categorias = this.categoryService.categorias;
  readonly categoriasError = this.categoryService.error;

  readonly categoriasActivas = computed(() =>
    this.categorias().filter((categoria) => categoria.activa),
  );

  readonly editingId = signal<number | null>(null);
  readonly busqueda = signal('');
  readonly form = signal<FormularioProducto>(this.formularioVacio());
  readonly busquedaStock = signal('');
  readonly stockLookupId = signal<number | null>(null);
  readonly stockLookupError = signal('');
  readonly selectedStock = signal<AdminProductoStockResponseDto | null>(null);
  readonly editingStockId = signal<number | null>(null);
  readonly editingStockValue = signal<number | null>(null);
  readonly stockUpdateLoading = signal(false);
  readonly stockUpdateError = signal('');
  readonly stockUpdateSuccess = signal('');
  readonly resolvingAlertId = signal<number | null>(null);
  readonly resolveAlertError = signal('');
  readonly resolveAlertSuccess = signal('');

  readonly technicalSheetPublishing = signal(false);

  readonly technicalSheet = signal<ProductTechnicalSheet | null>(null);
  readonly technicalSheetForm = signal<FormularioFichaTecnica>(
    this.formularioFichaVacio(),
  );
  readonly technicalSheetLoading = signal(false);
  readonly technicalSheetSaving = signal(false);
  readonly technicalSheetError = signal('');
  readonly technicalSheetSuccess = signal('');

  readonly productosFiltrados = computed(() => {
    const textoBusqueda = this.busqueda().trim().toLowerCase();

    if (!textoBusqueda) {
      return this.productos();
    }

    return this.productos().filter((producto) =>
      [producto.nombre, producto.nombreCategoria, producto.descripcion ?? '']
        .join(' ')
        .toLowerCase()
        .includes(textoBusqueda),
    );
  });

  readonly totalProductos = computed(() => this.productos().length);

  readonly totalActivos = computed(
    () => this.productos().filter((producto) => producto.activo).length,
  );

  readonly totalInactivos = computed(
    () => this.productos().filter((producto) => !producto.activo).length,
  );

  readonly stockProducts = this.adminStockService.productosStock;
  readonly stockLoading = this.adminStockService.cargando;
  readonly stockError = this.adminStockService.error;
  readonly pendingStockAlerts = this.adminStockService.alertasPendientes;
  readonly stockAlertsLoading = this.adminStockService.cargandoAlertas;
  readonly stockAlertsError = this.adminStockService.errorAlertas;

  readonly filteredStockProducts = computed(() => {
    const textoBusqueda = this.busquedaStock().trim().toLowerCase();

    if (!textoBusqueda) {
      return this.stockProducts();
    }

    return this.stockProducts().filter((producto) =>
      [
        producto.id.toString(),
        producto.nombre,
        producto.activo ? 'activo' : 'inactivo',
      ]
        .join(' ')
        .toLowerCase()
        .includes(textoBusqueda),
    );
  });

  readonly lowStockCount = computed(
    () =>
      this.stockProducts().filter(
        (producto) =>
          producto.activo && producto.stock > 0 && producto.stock <= 10,
      ).length,
  );

  readonly outOfStockCount = computed(
    () =>
      this.stockProducts().filter((producto) => producto.stock === 0).length,
  );

  constructor() {
    effect(() => {
      const categorias = this.categoriasActivas();

      if (categorias.length === 0) {
        return;
      }

      const categoriaActualExiste = categorias.some(
        (categoria) => categoria.id === this.form().idCategoria,
      );

      if (!categoriaActualExiste) {
        const primeraCategoria = categorias[0];

        this.form.update((actual) => ({
          ...actual,
          idCategoria: primeraCategoria.id,
          nombreCategoria: primeraCategoria.nombre,
        }));
      }
    });
  }

  ngOnInit(): void {
    this.catalogoProductos.cargarProductos();
    this.categoryService.cargarCategorias();
    this.adminStockService.cargarStock();
    this.adminStockService.cargarAlertasPendientes();
  }

  cambiarCampo<K extends keyof FormularioProducto>(
    campo: K,
    valor: FormularioProducto[K],
  ): void {
    this.form.update((actual) => ({ ...actual, [campo]: valor }));
  }

  cambiarCategoria(idCategoria: number | string): void {
    const categoriaId = Number(idCategoria);
    const categoria = this.categorias().find((item) => item.id === categoriaId);

    this.form.update((actual) => ({
      ...actual,
      idCategoria: categoriaId,
      nombreCategoria: categoria?.nombre ?? actual.nombreCategoria,
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
      producto.idCategoria ??
      this.resolverIdCategoria(producto.nombreCategoria);

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
    this.cargarFichaTecnica(producto.id);
  }

  reiniciarFormulario(): void {
    this.editingId.set(null);
    this.form.set(this.formularioVacio());
    this.technicalSheet.set(null);
    this.technicalSheetForm.set(this.formularioFichaVacio());
    this.technicalSheetError.set('');
    this.technicalSheetSuccess.set('');
  }

  alternarEstadoProducto(producto: Producto): void {
    this.catalogoProductos.actualizarEstadoProducto(
      producto.id,
      !producto.activo,
    );
  }

  borrarProducto(producto: Producto): void {
    const confirmado = window.confirm(
      `¿Quieres borrar "${producto.nombre}"? El producto dejará de aparecer en el sistema.`,
    );

    if (confirmado) {
      this.catalogoProductos.borrarProducto(producto.id);

      if (this.editingId() === producto.id) {
        this.reiniciarFormulario();
      }
    }
  }

  cambiarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  consultarStockPorId(): void {
    const id = this.stockLookupId();

    if (!id || id <= 0) {
      this.selectedStock.set(null);
      this.stockLookupError.set(
        'Introduce un identificador de producto válido.',
      );
      return;
    }

    const producto = this.stockProducts().find((item) => item.id === id);

    if (!producto) {
      this.selectedStock.set(null);
      this.stockLookupError.set(
        `No se ha encontrado ningún producto con identificador ${id}.`,
      );
      return;
    }

    this.selectedStock.set(producto);
    this.stockLookupError.set('');
  }

  editarStock(producto: AdminProductoStockResponseDto): void {
    this.editingStockId.set(producto.id);
    this.editingStockValue.set(producto.stock);
    this.stockUpdateError.set('');
    this.stockUpdateSuccess.set('');
  }

  cancelarEdicionStock(): void {
    this.editingStockId.set(null);
    this.editingStockValue.set(null);
    this.stockUpdateError.set('');
  }

  guardarStock(producto: AdminProductoStockResponseDto): void {
    const nuevoStock = Number(this.editingStockValue());

    if (!Number.isInteger(nuevoStock) || nuevoStock < 0) {
      this.stockUpdateError.set(
        'El stock debe ser un número entero igual o superior a cero.',
      );
      return;
    }

    this.stockUpdateLoading.set(true);
    this.stockUpdateError.set('');
    this.stockUpdateSuccess.set('');

    this.adminStockService
      .actualizarStock(producto.id, { stock: nuevoStock })
      .subscribe({
        next: (productoActualizado) => {
          if (this.selectedStock()?.id === productoActualizado.id) {
            this.selectedStock.set(productoActualizado);
          }

          this.stockUpdateSuccess.set(
            `Stock de "${productoActualizado.nombre}" actualizado correctamente.`,
          );

          this.adminStockService.cargarAlertasPendientes();

          this.editingStockId.set(null);
          this.editingStockValue.set(null);
          this.stockUpdateLoading.set(false);
        },
        error: () => {
          this.stockUpdateError.set(
            'No se ha podido modificar el stock del producto.',
          );
          this.stockUpdateLoading.set(false);
        },
      });
  }

  resolverAlerta(idAlerta: number, nombreProducto: string): void {
    const confirmado = window.confirm(
      `¿Quieres marcar como resuelta la alerta de "${nombreProducto}"?`,
    );

    if (!confirmado) {
      return;
    }

    this.resolvingAlertId.set(idAlerta);
    this.resolveAlertError.set('');
    this.resolveAlertSuccess.set('');

    this.adminStockService.resolverAlerta(idAlerta).subscribe({
      next: () => {
        this.resolveAlertSuccess.set(
          `La alerta de "${nombreProducto}" se ha marcado como resuelta.`,
        );
        this.resolvingAlertId.set(null);
      },
      error: () => {
        this.resolveAlertError.set(
          'No se ha podido marcar la alerta como resuelta.',
        );
        this.resolvingAlertId.set(null);
      },
    });
  }

  formatearTipoAlerta(tipo: string): string {
    return tipo === 'AGOTADO' ? 'Producto agotado' : 'Stock bajo';
  }

  formatearFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(fecha));
  }

  formatearPrecio(precio: number): string {
    return precio.toFixed(2).replace('.', ',') + String.fromCharCode(8364);
  }

  private formularioVacio(): FormularioProducto {
    const categoriaInicial = this.categoriasActivas()[0];

    return {
      nombre: '',
      precio: 0,
      stock: 1,
      imagenUrl: 'assets/images/placeholder.svg',
      idCategoria: categoriaInicial?.id ?? 1,
      nombreCategoria: categoriaInicial?.nombre ?? '',
      activo: true,
      pesoNeto: '',
      descripcion: '',
      detallesTexto: '',
    };
  }

  private convertirFormularioAPayload(
    form: FormularioProducto,
  ): ProductoPayload {
    return {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio) || 0,
      stock: Math.max(0, Number(form.stock) || 0),
      imagenUrl: form.imagenUrl.trim() || 'assets/images/placeholder.svg',
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
    const categoria = this.categorias().find(
      (item) =>
        item.nombre.trim().toLowerCase() ===
        nombreCategoria.trim().toLowerCase(),
    );

    return categoria?.id ?? this.categoriasActivas()[0]?.id ?? 1;
  }

  cambiarCampoFicha<K extends keyof FormularioFichaTecnica>(
    campo: K,
    valor: FormularioFichaTecnica[K],
  ): void {
    this.technicalSheetForm.update((actual) => ({ ...actual, [campo]: valor }));
  }

  guardarFichaTecnica(): void {
    const productId = this.editingId();

    if (!productId) {
      this.technicalSheetError.set(
        'Selecciona primero un producto para gestionar su ficha ampliada.',
      );
      return;
    }

    const payload = this.convertirFormularioFichaAPayload(
      this.technicalSheetForm(),
    );

    if (!payload.titulo || !payload.descripcionAmpliada) {
      this.technicalSheetError.set(
        'El título y la descripción ampliada son obligatorios.',
      );
      return;
    }

    this.technicalSheetSaving.set(true);
    this.technicalSheetError.set('');
    this.technicalSheetSuccess.set('');

    const request$ = this.technicalSheet()
      ? this.technicalSheetService.update(productId, payload)
      : this.technicalSheetService.create(productId, payload);

    request$.subscribe({
      next: (technicalSheet) => {
        this.technicalSheet.set(technicalSheet);
        this.technicalSheetForm.set(
          this.formularioFichaDesdeDto(technicalSheet),
        );
        this.technicalSheetSuccess.set(
          this.technicalSheet()
            ? 'Ficha ampliada guardada correctamente.'
            : 'Ficha ampliada creada correctamente.',
        );
        this.technicalSheetSaving.set(false);
      },
      error: () => {
        this.technicalSheetError.set(
          'No se ha podido guardar la ficha ampliada.',
        );
        this.technicalSheetSaving.set(false);
      },
    });
  }

  private cargarFichaTecnica(productId: number): void {
    this.technicalSheetLoading.set(true);
    this.technicalSheetError.set('');
    this.technicalSheetSuccess.set('');
    this.technicalSheet.set(null);
    this.technicalSheetForm.set(this.formularioFichaVacio());

    this.technicalSheetService.getAdminByProductId(productId).subscribe({
      next: (technicalSheet) => {
        this.technicalSheet.set(technicalSheet);

        if (technicalSheet) {
          this.technicalSheetForm.set(
            this.formularioFichaDesdeDto(technicalSheet),
          );
        }

        this.technicalSheetLoading.set(false);
      },
      error: () => {
        this.technicalSheetError.set(
          'No se ha podido cargar la ficha ampliada del producto.',
        );
        this.technicalSheetLoading.set(false);
      },
    });
  }

  private formularioFichaVacio(): FormularioFichaTecnica {
    return {
      titulo: '',
      descripcionAmpliada: '',
      propiedades: '',
      origen: '',
      usoRecomendado: '',
      conservacion: '',
      publicada: true,
    };
  }

  private formularioFichaDesdeDto(
    ficha: ProductTechnicalSheet,
  ): FormularioFichaTecnica {
    return {
      titulo: ficha.titulo,
      descripcionAmpliada: ficha.descripcionAmpliada,
      propiedades: ficha.propiedades ?? '',
      origen: ficha.origen ?? '',
      usoRecomendado: ficha.usoRecomendado ?? '',
      conservacion: ficha.conservacion ?? '',
      publicada: ficha.publicada,
    };
  }

  private convertirFormularioFichaAPayload(
    form: FormularioFichaTecnica,
  ): ProductTechnicalSheetPayload {
    return {
      titulo: form.titulo.trim(),
      descripcionAmpliada: form.descripcionAmpliada.trim(),
      propiedades: form.propiedades.trim(),
      origen: form.origen.trim(),
      usoRecomendado: form.usoRecomendado.trim(),
      conservacion: form.conservacion.trim(),
      publicada: form.publicada,
    };
  }

  alternarPublicacionFicha(): void {
    const productId = this.editingId();
    const ficha = this.technicalSheet();

    if (!productId || !ficha) {
      this.technicalSheetError.set(
        'Guarda primero la ficha ampliada antes de cambiar su publicación.',
      );
      return;
    }

    const publicada = !ficha.publicada;

    this.technicalSheetPublishing.set(true);
    this.technicalSheetError.set('');
    this.technicalSheetSuccess.set('');

    this.technicalSheetService.updatePublished(productId, publicada).subscribe({
      next: (technicalSheet) => {
        this.technicalSheet.set(technicalSheet);
        this.technicalSheetForm.set(
          this.formularioFichaDesdeDto(technicalSheet),
        );
        this.technicalSheetSuccess.set(
          technicalSheet.publicada
            ? 'Ficha ampliada publicada correctamente.'
            : 'Ficha ampliada ocultada correctamente.',
        );
        this.technicalSheetPublishing.set(false);
      },
      error: () => {
        this.technicalSheetError.set(
          'No se ha podido cambiar el estado de publicación de la ficha.',
        );
        this.technicalSheetPublishing.set(false);
      },
    });
  }
}
