import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  AuthRequiredError,
  EmptyCartError,
  InvalidOrderTransitionError,
  OrderNotFoundError,
  OrderService,
} from './order.service';

describe('OrderService', () => {
  let service: OrderService;
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

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create an order from the persistent cart using the API', () => {
    service.createFromCart().subscribe((order) => {
      expect(order.id).toBe(5);
      expect(order.estado).toBe('CREADO');
      expect(order.total).toBe(17);
      expect(order.idUsuario).toBe(7);
      expect(order.lineas.length).toBe(1);
      expect(order.lineas[0].idProducto).toBe(1);
      expect(order.lineas[0].nombreProducto).toBe('Miel de tomillo');
    });

    const request = httpMock.expectOne('/api/pedidos');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();

    request.flush(apiOrder);
  });

  it('should store the last created order', () => {
    service.createFromCart().subscribe();

    httpMock.expectOne('/api/pedidos').flush(apiOrder);

    expect(service.lastOrder()?.id).toBe(5);
    expect(service.getOrderById(5).estado).toBe('CREADO');
  });

  it('should map an empty cart backend error to EmptyCartError', () => {
    service.createFromCart().subscribe({
      next: () => fail('Expected EmptyCartError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(EmptyCartError));
      },
    });

    httpMock.expectOne('/api/pedidos').flush(
      { message: 'carrito.vacio' },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('should map unauthorized backend errors to AuthRequiredError', () => {
    service.createFromCart().subscribe({
      next: () => fail('Expected AuthRequiredError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(AuthRequiredError));
      },
    });

    httpMock.expectOne('/api/pedidos').flush(
      {},
      { status: 403, statusText: 'Forbidden' },
    );
  });

  it('should get an order by id from the API', () => {
    service.getOrderByIdFromApi(5).subscribe((order) => {
      expect(order.id).toBe(5);
      expect(order.estado).toBe('CREADO');
      expect(service.lastOrder()?.id).toBe(5);
    });

    const request = httpMock.expectOne('/api/pedidos/5');

    expect(request.request.method).toBe('GET');

    request.flush(apiOrder);
  });

  it('should update order status locally when transition is valid', () => {
    service.createFromCart().subscribe();

    httpMock.expectOne('/api/pedidos').flush(apiOrder);

    const updatedOrder = service.updateStatusLocal(5, { estado: 'PAGADO' });

    expect(updatedOrder.estado).toBe('PAGADO');
    expect(service.getOrderStatus(5)).toBe('PAGADO');
  });

  it('should not allow incoherent local status transitions', () => {
    service.createFromCart().subscribe();

    httpMock.expectOne('/api/pedidos').flush(apiOrder);

    expect(() =>
      service.updateStatusLocal(5, { estado: 'ENTREGADO' }),
    ).toThrowError(InvalidOrderTransitionError);
  });

  it('should update order status through the API for admin flows', () => {
    const updatedApiOrder = {
      ...apiOrder,
      estado: 'EN_PREPARACION',
    };

    service
      .updateStatusFromApi(5, { estado: 'EN_PREPARACION' })
      .subscribe((order) => {
        expect(order.id).toBe(5);
        expect(order.estado).toBe('EN_PREPARACION');
      });

    const request = httpMock.expectOne('/api/pedidos/5/estado');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'EN_PREPARACION' });

    request.flush(updatedApiOrder);
  });

  it('should throw controlled error when local order does not exist', () => {
    expect(() => service.getOrderById(999)).toThrowError(OrderNotFoundError);
  });
});