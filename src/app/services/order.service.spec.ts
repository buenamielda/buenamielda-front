import { TestBed } from '@angular/core/testing';

import { Producto } from '../models/product.model';
import { CartService } from './cart.service';
import {
  EmptyCartError,
  InvalidOrderTransitionError,
  OrderNotFoundError,
  OrderService,
} from './order.service';
import {
  InactiveStockProductError,
  InsufficientStockError,
  StockService,
} from './stock.service';

describe('OrderService', () => {
  let service: OrderService;
  let cartService: CartService;
  let stockService: jasmine.SpyObj<StockService>;

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

  beforeEach(() => {
    stockService = jasmine.createSpyObj<StockService>('StockService', [
      'assertStockAvailable',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: StockService, useValue: stockService }],
    });

    service = TestBed.inject(OrderService);
    cartService = TestBed.inject(CartService);
    cartService.clear();
  });

  it('should validate stock before creating an order', () => {
    cartService.add(product, 2);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe((order) => {
      expect(stockService.assertStockAvailable).toHaveBeenCalledOnceWith(1, 2);
      expect(order.estado).toBe('PENDIENTE');
      expect(order.total).toBe(17);
    });
  });

  it('should not create an order from an empty cart', () => {
    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe({
      next: () => fail('Expected EmptyCartError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(EmptyCartError));
      },
    });
  });

  it('should not create an order when stock is insufficient', () => {
    stockService.assertStockAvailable.and.throwError(
      new InsufficientStockError('Miel de tomillo'),
    );

    cartService.add(product, 11);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe({
      next: () => fail('Expected InsufficientStockError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(InsufficientStockError));
      },
    });
  });

  it('should not create an order when product is inactive', () => {
    stockService.assertStockAvailable.and.throwError(
      new InactiveStockProductError('Miel de tomillo'),
    );

    cartService.add({ ...product, activo: false }, 1);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe({
      next: () => fail('Expected InactiveStockProductError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(InactiveStockProductError));
      },
    });
  });

  it('should store and return current order status', () => {
    cartService.add(product, 1);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe((order) => {
      expect(service.getOrderById(order.id)).toEqual(order);
      expect(service.getOrderStatus(order.id)).toBe('PENDIENTE');
    });
  });

  it('should update status when transition is valid', () => {
    cartService.add(product, 1);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe((order) => {
      const updatedOrder = service.updateStatus(order.id, { estado: 'PAGADO' });

      expect(updatedOrder.estado).toBe('PAGADO');
      expect(service.getOrderStatus(order.id)).toBe('PAGADO');
    });
  });

  it('should not allow incoherent status transitions', () => {
    cartService.add(product, 1);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe((order) => {
      expect(() =>
        service.updateStatus(order.id, { estado: 'ENTREGADO' }),
      ).toThrowError(InvalidOrderTransitionError);
    });
  });

  it('should throw controlled error when order does not exist', () => {
    expect(() => service.getOrderById(999)).toThrowError(OrderNotFoundError);
  });
});