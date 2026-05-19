import { TestBed } from '@angular/core/testing';

import { Producto } from '../models/product.model';
import { CartService } from './cart.service';
import { OrderService, OrderStateError } from './order.service';
import { PaymentFailedError, PaymentService } from './payment.service';
import { StockService } from './stock.service';

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
      'updateStockForOrder',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: StockService, useValue: stockService }],
    });

    paymentService = TestBed.inject(PaymentService);
    orderService = TestBed.inject(OrderService);
    cartService = TestBed.inject(CartService);
    cartService.clear();
  });

  it('should update order status to PAGADO after successful payment', () => {
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
            expect(stockService.updateStockForOrder).toHaveBeenCalledOnceWith({
              idPedido: order.id,
            });
            expect(orderService.getOrderStatus(order.id)).toBe('PAGADO');
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

        expect(stockService.updateStockForOrder).toHaveBeenCalledTimes(1);
      });
  });

  it('should keep order as PENDIENTE and not update stock when payment fails', () => {
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
              expect(stockService.updateStockForOrder).not.toHaveBeenCalled();
              expect(orderService.getOrderStatus(order.id)).toBe('PENDIENTE');
            },
          });
      });
  });
});