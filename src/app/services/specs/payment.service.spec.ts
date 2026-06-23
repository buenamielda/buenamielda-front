import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { PaymentFailedError, PaymentService } from '../payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  const paymentResponse = {
    stripeChargeId: 'ch_test_123',
    estado: 'PAGADO',
    idPedido: 5,
    total: 17,
    mensaje: 'Pago realizado correctamente.',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call payment endpoint with order id and Stripe token', () => {
    service.payOrder(5, 'tok_test', 'Compra web').subscribe((payment) => {
      expect(payment.stripeChargeId).toBe('ch_test_123');
      expect(payment.estado).toBe('PAGADO');
      expect(payment.idPedido).toBe(5);
      expect(payment.total).toBe(17);
    });

    const request = httpMock.expectOne('/api/pedidos/pagar');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      idPedido: 5,
      stripeToken: 'tok_test',
      metadata: 'Compra web',
    });

    request.flush(paymentResponse);
  });

  it('should send empty metadata by default', () => {
    service.payOrder(5, 'tok_test').subscribe();

    const request = httpMock.expectOne('/api/pedidos/pagar');

    expect(request.request.body).toEqual({
      idPedido: 5,
      stripeToken: 'tok_test',
      metadata: '',
    });

    request.flush(paymentResponse);
  });

  it('should map forbidden payment response to PaymentFailedError', () => {
    service.payOrder(5, 'tok_test').subscribe({
      next: () => fail('Expected PaymentFailedError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(PaymentFailedError));
        expect(error.message).toBe('No tienes permisos para realizar el pago.');
      },
    });

    httpMock.expectOne('/api/pedidos/pagar').flush(
      {},
      { status: 403, statusText: 'Forbidden' },
    );
  });

  it('should map rejected card response to PaymentFailedError', () => {
    service.payOrder(5, 'tok_test').subscribe({
      next: () => fail('Expected PaymentFailedError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(PaymentFailedError));
        expect(error.message).toBe('Stripe ha rechazado la tarjeta.');
      },
    });

    httpMock.expectOne('/api/pedidos/pagar').flush(
      {},
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('should propagate unexpected backend errors', () => {
    service.payOrder(5, 'tok_test').subscribe({
      next: () => fail('Expected backend error'),
      error: (error) => {
        expect(error.status).toBe(500);
      },
    });

    httpMock.expectOne('/api/pedidos/pagar').flush(
      {},
      { status: 500, statusText: 'Server Error' },
    );
  });
});