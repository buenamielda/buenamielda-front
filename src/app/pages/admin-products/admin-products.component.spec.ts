import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import {
  AdminProductoStockResponseDto,
  AdminStockAlertResponseDto,
} from '../../models/admin-stock.model';
import { Producto } from '../../models/product.model';
import { AdminStockService } from '../../services/admin-stock.service';
import { ProductCatalogService } from '../../services/product-catalog.service';
import { ProductTechnicalSheetService } from '../../services/product-technical-sheet.service';
import { AdminProductsComponent } from './admin-products.component';

describe('AdminProductsComponent', () => {
  let component: AdminProductsComponent;
  let fixture: ComponentFixture<AdminProductsComponent>;
  let productCatalog: jasmine.SpyObj<ProductCatalogService>;
  let adminStockService: jasmine.SpyObj<AdminStockService>;
  let technicalSheetService: jasmine.SpyObj<ProductTechnicalSheetService>;

  const products: Producto[] = [
    {
      id: 1,
      nombre: 'Miel de tomillo',
      descripcion: 'Miel natural',
      precio: 8.5,
      stock: 10,
      imagenUrl: 'assets/images/miel-tomillo.svg',
      activo: true,
      nombreCategoria: 'Miel',
    },
    {
      id: 2,
      nombre: 'Polen natural',
      descripcion: 'Polen',
      precio: 6,
      stock: 2,
      imagenUrl: 'assets/images/polen-natural.svg',
      activo: true,
      nombreCategoria: 'Polen',
    },
    {
      id: 3,
      nombre: 'Miel agotada',
      descripcion: 'Sin stock',
      precio: 9,
      stock: 0,
      imagenUrl: 'assets/images/miel-tomillo.svg',
      activo: false,
      nombreCategoria: 'Miel',
    },
  ];

  const stockProducts: AdminProductoStockResponseDto[] = [
    {
      id: 1,
      nombre: 'Miel de tomillo',
      stock: 10,
      activo: true,
      deleted: false,
    },
    {
      id: 2,
      nombre: 'Polen natural',
      stock: 2,
      activo: true,
      deleted: false,
    },
    {
      id: 3,
      nombre: 'Miel agotada',
      stock: 0,
      activo: false,
      deleted: false,
    },
  ];

  const resolvedAlert: AdminStockAlertResponseDto = {
    id: 1,
    tipo: 'BAJO_STOCK',
    mensaje: 'Stock bajo',
    stockDetectado: 2,
    umbral: 10,
    estado: 'RESUELTA',
    fechaCreacion: '2026-06-23T10:00:00',
    fechaResolucion: '2026-06-23T11:00:00',
    idProducto: 2,
    nombreProducto: 'Polen natural',
    idUsuarioResolucion: 1,
    nombreUsuarioResolucion: 'Admin',
  };

  const stockSignal = signal<AdminProductoStockResponseDto[]>(stockProducts);
  const stockLoadingSignal = signal(false);
  const stockErrorSignal = signal<string | null>(null);
  const stockAlertsSignal = signal<AdminStockAlertResponseDto[]>([]);
  const stockAlertsLoadingSignal = signal(false);
  const stockAlertsErrorSignal = signal<string | null>(null);
  beforeEach(async () => {
    productCatalog = jasmine.createSpyObj<ProductCatalogService>(
      'ProductCatalogService',
      [
        'cargarProductos',
        'actualizarProducto',
        'crearProducto',
        'actualizarEstadoProducto',
        'borrarProducto',
      ],
      {
        todosLosProductos: signal(products).asReadonly(),
        error: signal<string | null>(null),
      },
    );

    adminStockService = jasmine.createSpyObj<AdminStockService>(
      'AdminStockService',
      [
        'cargarStock',
        'actualizarStock',
        'cargarAlertasPendientes',
        'resolverAlerta',
      ],
      {
        productosStock: stockSignal.asReadonly(),
        cargando: stockLoadingSignal,
        error: stockErrorSignal,
        alertasPendientes: stockAlertsSignal.asReadonly(),
        cargandoAlertas: stockAlertsLoadingSignal,
        errorAlertas: stockAlertsErrorSignal,
      },
    );

    adminStockService.actualizarStock.and.returnValue(of(stockProducts[0]));
    adminStockService.resolverAlerta.and.returnValue(of(resolvedAlert));

    technicalSheetService = jasmine.createSpyObj<ProductTechnicalSheetService>(
      'ProductTechnicalSheetService',
      ['getAdminByProductId', 'create', 'update', 'updatePublished'],
    );

    technicalSheetService.getAdminByProductId.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [AdminProductsComponent],
      providers: [
        { provide: ProductCatalogService, useValue: productCatalog },
        { provide: AdminStockService, useValue: adminStockService },
        {
          provide: ProductTechnicalSheetService,
          useValue: technicalSheetService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load products and stock information', () => {
    expect(component).toBeTruthy();
    expect(productCatalog.cargarProductos).toHaveBeenCalled();
    expect(adminStockService.cargarStock).toHaveBeenCalled();
    expect(adminStockService.cargarAlertasPendientes).toHaveBeenCalled();
  });

  it('should show all stock products', () => {
    expect(component.stockProducts()).toEqual(stockProducts);
  });

  it('should filter stock products by name', () => {
    component.busquedaStock.set('polen');

    expect(component.filteredStockProducts()).toEqual([stockProducts[1]]);
  });

  it('should filter stock products by id', () => {
    component.busquedaStock.set('3');

    expect(component.filteredStockProducts()).toEqual([stockProducts[2]]);
  });

  it('should filter stock products by status', () => {
    component.busquedaStock.set('inactivo');

    expect(component.filteredStockProducts()).toEqual([stockProducts[2]]);
  });

  it('should count low stock active products', () => {
    expect(component.lowStockCount()).toBe(2);
  });

  it('should count out of stock products', () => {
    expect(component.outOfStockCount()).toBe(1);
  });

  it('should consult stock by id from loaded admin stock products', () => {
    component.stockLookupId.set(1);

    component.consultarStockPorId();

    expect(component.selectedStock()).toEqual(stockProducts[0]);
    expect(component.stockLookupError()).toBe('');
  });

  it('should show validation error when consulted id is invalid', () => {
    component.stockLookupId.set(0);

    component.consultarStockPorId();

    expect(component.selectedStock()).toBeNull();
    expect(component.stockLookupError()).toBe(
      'Introduce un identificador de producto válido.',
    );
  });

  it('should show controlled error when consulted product does not exist', () => {
    component.stockLookupId.set(999);

    component.consultarStockPorId();

    expect(component.selectedStock()).toBeNull();
    expect(component.stockLookupError()).toBe(
      'No se ha encontrado ningún producto con identificador 999.',
    );
  });

  it('should prepare stock edition for a product', () => {
    component.editarStock(stockProducts[1]);

    expect(component.editingStockId()).toBe(2);
    expect(component.editingStockValue()).toBe(2);
    expect(component.stockUpdateError()).toBe('');
  });

  it('should reject invalid stock update values', () => {
    component.editarStock(stockProducts[1]);
    component.editingStockValue.set(-1);

    component.guardarStock(stockProducts[1]);

    expect(component.stockUpdateError()).toBe(
      'El stock debe ser un número entero igual o superior a cero.',
    );
    expect(adminStockService.actualizarStock).not.toHaveBeenCalled();
  });

  it('should update stock using admin stock service', () => {
    const updatedProduct: AdminProductoStockResponseDto = {
      ...stockProducts[1],
      stock: 8,
    };

    adminStockService.actualizarStock.and.returnValue(of(updatedProduct));

    component.editarStock(stockProducts[1]);
    component.editingStockValue.set(8);

    component.guardarStock(stockProducts[1]);

    expect(adminStockService.actualizarStock).toHaveBeenCalledOnceWith(2, {
      stock: 8,
    });
    expect(component.stockUpdateSuccess()).toBe(
      'Stock de "Polen natural" actualizado correctamente.',
    );
    expect(component.editingStockId()).toBeNull();
    expect(adminStockService.cargarAlertasPendientes).toHaveBeenCalled();
  });

  it('should show error when stock update fails', () => {
    adminStockService.actualizarStock.and.returnValue(
      throwError(() => new Error('Backend error')),
    );

    component.editarStock(stockProducts[1]);
    component.editingStockValue.set(8);

    component.guardarStock(stockProducts[1]);

    expect(component.stockUpdateError()).toBe(
      'No se ha podido modificar el stock del producto.',
    );
  });
});
