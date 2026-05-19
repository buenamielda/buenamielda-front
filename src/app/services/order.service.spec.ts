import { TestBed } from '@angular/core/testing';

import { Producto } from '../models/product.model';
import { CartService } from './cart.service';
import {
  EmptyCartError,
  InsufficientStockError,
  InvalidOrderTransitionError,
  OrderNotFoundError,
  OrderService,
} from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let cartService: CartService;

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
    TestBed.configureTestingModule({});

    service = TestBed.inject(OrderService);
    cartService = TestBed.inject(CartService);
    cartService.clear();
  });

  it('should create an order with initial status PENDIENTE', () => {
    cartService.add(product, 2);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe((order) => {
      expect(order.estado).toBe('PENDIENTE');
      expect(order.idUsuario).toBe(7);
      expect(order.total).toBe(17);
      expect(order.lineas.length).toBe(1);
      expect(order.lineas[0].cantidad).toBe(2);
      expect(order.lineas[0].precioUnitario).toBe(8.5);
      expect(order.lineas[0].subtotal).toBe(17);
    });
  });

  it('should store and return the current order status', () => {
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

  it('should throw a controlled error when order does not exist', () => {
    expect(() => service.getOrderById(999)).toThrowError(OrderNotFoundError);
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
    cartService.add(product, 11);

    service.createFromCart({ idUsuario: 7, idCarrito: 1 }).subscribe({
      next: () => fail('Expected InsufficientStockError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(InsufficientStockError));
      },
    });
  });
});