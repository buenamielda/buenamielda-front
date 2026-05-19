import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Producto } from '../../models/product.model';
import { ListadoStockResponseDto } from '../../models/stock.model';
import { ProductCatalogService } from '../../services/product-catalog.service';
import {
  StockProductNotFoundError,
  StockService,
} from '../../services/stock.service';
import { AdminProductsComponent } from './admin-products.component';

describe('AdminProductsComponent', () => {
  let component: AdminProductsComponent;
  let fixture: ComponentFixture<AdminProductsComponent>;
  let productCatalog: jasmine.SpyObj<ProductCatalogService>;
  let stockService: jasmine.SpyObj<StockService>;

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

  const stockResponse: ListadoStockResponseDto = {
    productos: [
      {
        idProducto: 1,
        nombre: 'Miel de tomillo',
        precio: 8.5,
        stock: 10,
        activo: true,
      },
      {
        idProducto: 2,
        nombre: 'Polen natural',
        precio: 6,
        stock: 2,
        activo: true,
      },
      {
        idProducto: 3,
        nombre: 'Miel agotada',
        precio: 9,
        stock: 0,
        activo: false,
      },
    ],
  };

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

    stockService = jasmine.createSpyObj<StockService>('StockService', [
      'getAllProductStocks',
      'getProductStockById',
    ]);

    stockService.getAllProductStocks.and.returnValue(stockResponse);

    await TestBed.configureTestingModule({
      imports: [AdminProductsComponent],
      providers: [
        { provide: ProductCatalogService, useValue: productCatalog },
        { provide: StockService, useValue: stockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load products', () => {
    expect(component).toBeTruthy();
    expect(productCatalog.cargarProductos).toHaveBeenCalled();
  });

  it('should show all stock products', () => {
    expect(component.stockProducts()).toEqual(stockResponse.productos);
  });

  it('should filter stock products by name', () => {
    component.busquedaStock.set('polen');

    expect(component.filteredStockProducts()).toEqual([
      stockResponse.productos[1],
    ]);
  });

  it('should filter stock products by id', () => {
    component.busquedaStock.set('3');

    expect(component.filteredStockProducts()).toEqual([
      stockResponse.productos[2],
    ]);
  });

  it('should filter stock products by status', () => {
    component.busquedaStock.set('inactivo');

    expect(component.filteredStockProducts()).toEqual([
      stockResponse.productos[2],
    ]);
  });

  it('should count low stock active products', () => {
    expect(component.lowStockCount()).toBe(1);
  });

  it('should count out of stock products', () => {
    expect(component.outOfStockCount()).toBe(1);
  });

  it('should consult stock by id', () => {
    stockService.getProductStockById.and.returnValue(stockResponse.productos[0]);
    component.stockLookupId.set(1);

    component.consultarStockPorId();

    expect(stockService.getProductStockById).toHaveBeenCalledOnceWith(1);
    expect(component.selectedStock()).toEqual(stockResponse.productos[0]);
    expect(component.stockLookupError()).toBe('');
  });

  it('should show validation error when consulted id is invalid', () => {
    component.stockLookupId.set(0);

    component.consultarStockPorId();

    expect(component.selectedStock()).toBeNull();
    expect(component.stockLookupError()).toBe(
      'Introduce un identificador de producto valido.',
    );
    expect(stockService.getProductStockById).not.toHaveBeenCalled();
  });

  it('should show controlled error when consulted product does not exist', () => {
    stockService.getProductStockById.and.throwError(
      new StockProductNotFoundError('ID 999'),
    );
    component.stockLookupId.set(999);

    component.consultarStockPorId();

    expect(component.selectedStock()).toBeNull();
    expect(component.stockLookupError()).toBe(
      'No se ha encontrado el producto "ID 999".',
    );
  });
});