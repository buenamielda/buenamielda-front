import { TestBed } from '@angular/core/testing';

import { LineaPedidoResponseDto, PedidoResponseDto } from '../models/order.model';
import { Producto } from '../models/product.model';
import { OrderNotFoundError, OrderService } from './order.service';
import { ProductCatalogService } from './product-catalog.service';
import {
  InactiveStockProductError,
  InsufficientStockError,
  StockProductNotFoundError,
  StockService,
} from './stock.service';

describe('StockService', () => {
  let service: StockService;
  let orderService: jasmine.SpyObj<OrderService>;
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

  const line: LineaPedidoResponseDto = {
    id: 1,
    cantidad: 3,
    idProducto: 1,
    nombreProducto: 'Miel de tomillo',
    precioUnitario: 8.5,
    subtotal: 25.5,
    imagenProducto: 'assets/images/miel-tomillo.svg',
  };

  const order: PedidoResponseDto = {
    id: 1,
    fechaPedido: new Date().toISOString(),
    estado: 'PENDIENTE',
    total: 25.5,
    idUsuario: 7,
    lineas: [line],
  };

  beforeEach(() => {
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['getById']);

    productCatalog = jasmine.createSpyObj<ProductCatalogService>(
      'ProductCatalogService',
      ['obtenerPorId', 'actualizarStockLocal'],
    );

    TestBed.configureTestingModule({
      providers: [
        StockService,
        { provide: OrderService, useValue: orderService },
        { provide: ProductCatalogService, useValue: productCatalog },
      ],
    });

    service = TestBed.inject(StockService);
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

  it('should validate stock as unavailable when stock is zero', () => {
    productCatalog.obtenerPorId.and.returnValue({ ...product, stock: 0 });

    const response = service.validateStock({
      idProducto: 1,
      cantidadSolicitada: 1,
    });

    expect(response.disponible).toBeFalse();
  });

  it('should validate stock as unavailable when product is inactive', () => {
    productCatalog.obtenerPorId.and.returnValue({ ...product, activo: false });

    const response = service.validateStock({
      idProducto: 1,
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

  it('should throw inactive product error when asserting inactive product stock', () => {
    productCatalog.obtenerPorId.and.returnValue({ ...product, activo: false });

    expect(() => service.assertStockAvailable(1, 1)).toThrowError(
      InactiveStockProductError,
    );
  });

  it('should throw insufficient stock error when asserting unavailable stock', () => {
    productCatalog.obtenerPorId.and.returnValue(product);

    expect(() => service.assertStockAvailable(1, 11)).toThrowError(
      InsufficientStockError,
    );
  });

  it('should reduce stock using order lines', () => {
    orderService.getById.and.returnValue(order);
    productCatalog.obtenerPorId.and.returnValue(product);

    const response = service.updateStockForOrder({ idPedido: 1 });

    expect(response).toEqual([
      {
        idProducto: 1,
        nombre: 'Miel de tomillo',
        stock: 7,
        activo: true,
      },
    ]);

    expect(productCatalog.actualizarStockLocal).toHaveBeenCalledOnceWith(1, 7);
  });

  it('should throw controlled error when order does not exist', () => {
    orderService.getById.and.returnValue(undefined);

    expect(() =>
      service.updateStockForOrder({ idPedido: 999 }),
    ).toThrowError(OrderNotFoundError);

    expect(productCatalog.actualizarStockLocal).not.toHaveBeenCalled();
  });

  it('should not update stock if one line has insufficient stock', () => {
    const multiLineOrder: PedidoResponseDto = {
      ...order,
      lineas: [
        line,
        {
          id: 2,
          cantidad: 20,
          idProducto: 2,
          nombreProducto: 'Polen natural',
          precioUnitario: 6,
          subtotal: 120,
        },
      ],
    };

    orderService.getById.and.returnValue(multiLineOrder);
    productCatalog.obtenerPorId.and.callFake((id: number) => {
      if (id === 1) {
        return product;
      }

      return {
        ...product,
        id: 2,
        nombre: 'Polen natural',
        stock: 5,
      };
    });

    expect(() =>
      service.updateStockForOrder({ idPedido: 1 }),
    ).toThrowError(InsufficientStockError);

    expect(productCatalog.actualizarStockLocal).not.toHaveBeenCalled();
  });
});