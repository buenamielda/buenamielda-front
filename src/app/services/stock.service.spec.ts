import { TestBed } from '@angular/core/testing';

import { PedidoResponseDto } from '../models/order.model';
import { Producto } from '../models/product.model';
import { OrderNotFoundError, OrderService } from './order.service';
import { ProductCatalogService } from './product-catalog.service';
import {
  StockProductNotFoundError,
  StockService,
  StockWouldBeNegativeError,
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

  const order: PedidoResponseDto = {
    id: 1,
    fechaPedido: new Date().toISOString(),
    estado: 'PENDIENTE',
    total: 25.5,
    idUsuario: 7,
    lineas: [
      {
        id: 1,
        cantidad: 3,
        idProducto: 1,
        nombreProducto: 'Miel de tomillo',
        precioUnitario: 8.5,
        subtotal: 25.5,
        imagenProducto: 'assets/images/miel-tomillo.svg',
      },
    ],
  };

  beforeEach(() => {
    orderService = jasmine.createSpyObj<OrderService>('OrderService', [
      'getById',
    ]);

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

  it('should reduce product stock using the order lines', () => {
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

  it('should throw a controlled error when order does not exist', () => {
    orderService.getById.and.returnValue(undefined);

    expect(() =>
      service.updateStockForOrder({ idPedido: 999 }),
    ).toThrowError(OrderNotFoundError);

    expect(productCatalog.actualizarStockLocal).not.toHaveBeenCalled();
  });

  it('should throw a controlled error when a product does not exist', () => {
    orderService.getById.and.returnValue(order);
    productCatalog.obtenerPorId.and.returnValue(undefined);

    expect(() =>
      service.updateStockForOrder({ idPedido: 1 }),
    ).toThrowError(StockProductNotFoundError);

    expect(productCatalog.actualizarStockLocal).not.toHaveBeenCalled();
  });

  it('should not allow stock to become negative', () => {
    orderService.getById.and.returnValue(order);
    productCatalog.obtenerPorId.and.returnValue({
      ...product,
      stock: 2,
    });

    expect(() =>
      service.updateStockForOrder({ idPedido: 1 }),
    ).toThrowError(StockWouldBeNegativeError);

    expect(productCatalog.actualizarStockLocal).not.toHaveBeenCalled();
  });

  it('should not update any stock if one line would make stock negative', () => {
    const multiLineOrder: PedidoResponseDto = {
      ...order,
      lineas: [
        order.lineas[0],
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
    ).toThrowError(StockWouldBeNegativeError);

    expect(productCatalog.actualizarStockLocal).not.toHaveBeenCalled();
  });
});