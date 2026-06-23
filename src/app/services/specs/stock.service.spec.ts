import { TestBed } from '@angular/core/testing';

import { Producto } from '../../models/product.model';
import { ProductCatalogService } from '../product-catalog.service';
import {
  InactiveStockProductError,
  InsufficientStockError,
  StockProductNotFoundError,
  StockService,
} from '../stock.service';

describe('StockService', () => {
  let service: StockService;
  let productCatalog: jasmine.SpyObj<ProductCatalogService>;

  const product: Producto = {
    id: 1,
    nombre: 'Miel de tomillo',
    descripcion: 'Miel natural',
    precio: 8.5,
    stock: 10,
    imagenUrl: 'assets/images/miel-tomillo.svg',
    activo: true,
    nombreCategoria: 'Miel',
  };

  const inactiveProduct: Producto = {
    ...product,
    id: 2,
    nombre: 'Miel inactiva',
    activo: false,
  };

  const outOfStockProduct: Producto = {
    ...product,
    id: 3,
    nombre: 'Miel agotada',
    stock: 0,
  };

  beforeEach(() => {
    productCatalog = jasmine.createSpyObj<ProductCatalogService>(
      'ProductCatalogService',
      ['todosLosProductos', 'obtenerPorId'],
    );

    TestBed.configureTestingModule({
      providers: [
        StockService,
        { provide: ProductCatalogService, useValue: productCatalog },
      ],
    });

    service = TestBed.inject(StockService);
  });

  it('should return stock for all products', () => {
    productCatalog.todosLosProductos.and.returnValue([
      product,
      inactiveProduct,
      outOfStockProduct,
    ]);

    const response = service.getAllProductStocks();

    expect(response.productos).toEqual([
      {
        idProducto: 1,
        nombre: 'Miel de tomillo',
        precio: 8.5,
        stock: 10,
        activo: true,
      },
      {
        idProducto: 2,
        nombre: 'Miel inactiva',
        precio: 8.5,
        stock: 10,
        activo: false,
      },
      {
        idProducto: 3,
        nombre: 'Miel agotada',
        precio: 8.5,
        stock: 0,
        activo: true,
      },
    ]);
  });

  it('should return stock for one product by id', () => {
    productCatalog.obtenerPorId.and.returnValue(product);

    const response = service.getProductStockById(1);

    expect(response).toEqual({
      idProducto: 1,
      nombre: 'Miel de tomillo',
      precio: 8.5,
      stock: 10,
      activo: true,
    });
  });

  it('should throw controlled error when product stock by id does not exist', () => {
    productCatalog.obtenerPorId.and.returnValue(undefined);

    expect(() => service.getProductStockById(999)).toThrowError(
      StockProductNotFoundError,
    );
  });

  it('should validate stock as available when product is active and has enough units', () => {
    productCatalog.obtenerPorId.and.returnValue(product);

    const response = service.validateStock({
      idProducto: 1,
      cantidadSolicitada: 3,
    });

    expect(response).toEqual({
      idProducto: 1,
      nombreProducto: 'Miel de tomillo',
      stockDisponible: 10,
      cantidadSolicitada: 3,
      disponible: true,
    });
  });

  it('should validate stock as unavailable when requested quantity is greater than stock', () => {
    productCatalog.obtenerPorId.and.returnValue(product);

    const response = service.validateStock({
      idProducto: 1,
      cantidadSolicitada: 11,
    });

    expect(response.disponible).toBeFalse();
    expect(response.stockDisponible).toBe(10);
    expect(response.cantidadSolicitada).toBe(11);
  });

  it('should validate stock as unavailable when requested quantity is zero', () => {
    productCatalog.obtenerPorId.and.returnValue(product);

    const response = service.validateStock({
      idProducto: 1,
      cantidadSolicitada: 0,
    });

    expect(response.disponible).toBeFalse();
  });

  it('should validate stock as unavailable when stock is zero', () => {
    productCatalog.obtenerPorId.and.returnValue(outOfStockProduct);

    const response = service.validateStock({
      idProducto: 3,
      cantidadSolicitada: 1,
    });

    expect(response.disponible).toBeFalse();
    expect(response.stockDisponible).toBe(0);
  });

  it('should validate stock as unavailable when product is inactive', () => {
    productCatalog.obtenerPorId.and.returnValue(inactiveProduct);

    const response = service.validateStock({
      idProducto: 2,
      cantidadSolicitada: 1,
    });

    expect(response.disponible).toBeFalse();
  });

  it('should throw when validating a product that does not exist', () => {
    productCatalog.obtenerPorId.and.returnValue(undefined);

    expect(() =>
      service.validateStock({ idProducto: 999, cantidadSolicitada: 1 }),
    ).toThrowError(StockProductNotFoundError);
  });

  it('should return validation response when asserting available stock', () => {
    productCatalog.obtenerPorId.and.returnValue(product);

    const response = service.assertStockAvailable(1, 2);

    expect(response.disponible).toBeTrue();
    expect(response.stockDisponible).toBe(10);
  });

  it('should throw inactive product error when asserting inactive product stock', () => {
    productCatalog.obtenerPorId.and.returnValue(inactiveProduct);

    expect(() => service.assertStockAvailable(2, 1)).toThrowError(
      InactiveStockProductError,
    );
  });

  it('should throw insufficient stock error when asserting unavailable stock', () => {
    productCatalog.obtenerPorId.and.returnValue(product);

    expect(() => service.assertStockAvailable(1, 11)).toThrowError(
      InsufficientStockError,
    );
  });
});