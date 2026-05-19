import { TestBed } from '@angular/core/testing';

import { Producto } from '../models/product.model';
import { CartService } from './cart.service';
import { OrderService, OrderStateError } from './order.service';
import { PaymentFailedError, PaymentService } from './payment.service';
import { InsufficientStockError, StockService } from './stock.service';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let orderService: OrderService;
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
      'updateStockForLines',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: StockService, useValue: stockService }],
    });

    paymentService = TestBed.inject(PaymentService);
    orderService = TestBed.inject(OrderService);
    cartService = TestBed.inject(CartService);
    cartService.clear();
  });

  it('should validate and update stock after successful payment', () => {
    cartService.add(product, 2);

    orderService
      .createFromCart({ idUsuario: 7, idCarrito: 1 })
      .subscribe((order) => {
        paymentService
          .payOrder({
            idPedido: order.id,
            idUsuario: 7,
            importe: order.total,
            metodoPago: 'TARJETA',
          })
          .subscribe((payment) => {
            expect(payment.estado).toBe('ACEPTADO');
            expect(stockService.updateStockForLines).toHaveBeenCalledOnceWith(
              order.lineas,
            );
            expect(orderService.getOrderStatus(order.id)).toBe('PAGADO');
          });
      });
  });

  it('should not complete payment if stock validation fails during payment', () => {
    stockService.updateStockForLines.and.throwError(
      new InsufficientStockError('Miel de tomillo'),
    );

    cartService.add(product, 2);

    orderService
      .createFromCart({ idUsuario: 7, idCarrito: 1 })
      .subscribe((order) => {
        expect(() =>
          paymentService.payOrder({
            idPedido: order.id,
            idUsuario: 7,
            importe: order.total,
            metodoPago: 'TARJETA',
          }),
        ).toThrowError(InsufficientStockError);

        expect(orderService.getOrderStatus(order.id)).toBe('PENDIENTE');
      });
  });

  it('should not update stock when payment provider fails', () => {
    cartService.add(product, 1);

    orderService
      .createFromCart({ idUsuario: 7, idCarrito: 1 })
      .subscribe((order) => {
        paymentService
          .payOrder({
            idPedido: order.id,
            idUsuario: 7,
            importe: order.total,
            metodoPago: 'SIMULATED_FAIL',
          })
          .subscribe({
            next: () => fail('Expected PaymentFailedError'),
            error: (error) => {
              expect(error).toEqual(jasmine.any(PaymentFailedError));
              expect(stockService.updateStockForLines).not.toHaveBeenCalled();
              expect(orderService.getOrderStatus(order.id)).toBe('PENDIENTE');
            },
          });
      });
  });

  it('should not allow paying an order twice', () => {
    cartService.add(product, 1);

    orderService
      .createFromCart({ idUsuario: 7, idCarrito: 1 })
      .subscribe((order) => {
        paymentService
          .payOrder({
            idPedido: order.id,
            idUsuario: 7,
            importe: order.total,
            metodoPago: 'TARJETA',
          })
          .subscribe();

        expect(() =>
          paymentService.payOrder({
            idPedido: order.id,
            idUsuario: 7,
            importe: order.total,
            metodoPago: 'TARJETA',
          }),
        ).toThrowError(OrderStateError);

        expect(stockService.updateStockForLines).toHaveBeenCalledTimes(1);
      });
  });
});