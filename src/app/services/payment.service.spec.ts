import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { OrderService, OrderStateError } from './order.service';
import { PaymentFailedError, PaymentService } from './payment.service';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let orderService: OrderService;
  let httpMock: HttpTestingController;

  const apiOrder = {
    idPedido: 5,
    fechaPedido: '2026-05-20T12:00:00',
    estado: 'CREADO',
    total: 17,
    idUsuario: 7,
    lineas: [
      {
        idLineaPedido: 1,
        cantidad: 2,
        idProducto: 1,
        nombreProducto: 'Miel de tomillo',
        precioUnitario: 8.5,
        subtotal: 17,
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    paymentService = TestBed.inject(PaymentService);
    orderService = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);

    orderService.createFromCart().subscribe();
    httpMock.expectOne('/api/pedidos').flush(apiOrder);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call payment endpoint and create a local accepted payment', () => {
    paymentService
      .payOrder({
        idPedido: 5,
        importe: 17,
        metodoPago: 'TARJETA',
      })
      .subscribe((payment) => {
        expect(payment.idPedido).toBe(5);
        expect(payment.importe).toBe(17);
        expect(payment.estado).toBe('ACEPTADO');
        expect(orderService.getOrderStatus(5)).toBe('PAGADO');
      });

    const request = httpMock.expectOne('/api/pedidos/pagar');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();

    request.flush(null);
  });

  it('should not call backend when simulated payment provider fails', () => {
    paymentService
      .payOrder({
        idPedido: 5,
        importe: 17,
        metodoPago: 'SIMULATED_FAIL',
      })
      .subscribe({
        next: () => fail('Expected PaymentFailedError'),
        error: (error) => {
          expect(error).toEqual(jasmine.any(PaymentFailedError));
          expect(orderService.getOrderStatus(5)).toBe('CREADO');
        },
      });

    httpMock.expectNone('/api/pedidos/pagar');
  });

  it('should map forbidden payment response to PaymentFailedError', () => {
    paymentService
      .payOrder({
        idPedido: 5,
        importe: 17,
        metodoPago: 'TARJETA',
      })
      .subscribe({
        next: () => fail('Expected PaymentFailedError'),
        error: (error) => {
          expect(error).toEqual(jasmine.any(PaymentFailedError));
          expect(orderService.getOrderStatus(5)).toBe('CREADO');
        },
      });

    httpMock.expectOne('/api/pedidos/pagar').flush(
      {},
      { status: 403, statusText: 'Forbidden' },
    );
  });

  it('should not allow paying an order twice locally', () => {
    paymentService
      .payOrder({
        idPedido: 5,
        importe: 17,
        metodoPago: 'TARJETA',
      })
      .subscribe();

    httpMock.expectOne('/api/pedidos/pagar').flush(null);

    expect(orderService.getOrderStatus(5)).toBe('PAGADO');

    expect(() =>
      paymentService.payOrder({
        idPedido: 5,
        importe: 17,
        metodoPago: 'TARJETA',
      }),
    ).toThrowError(OrderStateError);

    httpMock.expectNone('/api/pedidos/pagar');
  });

  it('should not allow paying with a wrong amount', () => {
    expect(() =>
      paymentService.payOrder({
        idPedido: 5,
        importe: 99,
        metodoPago: 'TARJETA',
      }),
    ).toThrowError('El importe del pago no coincide con el total del pedido.');

    httpMock.expectNone('/api/pedidos/pagar');
  });
});