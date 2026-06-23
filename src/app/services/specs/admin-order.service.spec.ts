import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  ActualizarEstadoPedidoAdminRequestDto,
  AdminPedidoDetallesResponseDto,
  AdminPedidoResponseDto,
} from '../../models/admin-order.model';
import { AdminOrderService } from '../admin-order.service';

describe('AdminOrderService', () => {
  let service: AdminOrderService;
  let httpMock: HttpTestingController;

  const orders: AdminPedidoResponseDto[] = [
    {
      id: 1,
      fechaPedido: '2026-06-20T10:00:00',
      estado: 'CREADO',
      total: 10,
      emailUsuario: 'paula@test.com',
    },
    {
      id: 2,
      fechaPedido: '2026-06-22T10:00:00',
      estado: 'ENTREGADO',
      total: 20,
      emailUsuario: 'admin@test.com',
    },
  ];

  const detail: AdminPedidoDetallesResponseDto = {
    id: 2,
    fechaPedido: '2026-06-22T10:00:00',
    estado: 'ENTREGADO',
    total: 20,
    emailUsuario: 'admin@test.com',
    nombreUsuario: 'Admin',
    telefono: '600000000',
    direccion: 'Calle Miel 1',
    codigoPostal: '28001',
    localidad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
    lineaPedido: [
      {
        id: 1,
        cantidad: 2,
        nombreProducto: 'Miel de tomillo',
        nombreCategoria: 'Miel',
        imagenProducto: 'assets/images/miel-tomillo.svg',
        precioUnitario: 10,
        subtotal: 20,
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load admin orders and sort them by date descending', () => {
    service.cargarPedidos();

    const request = httpMock.expectOne('/api/admin/pedidos');

    expect(request.request.method).toBe('GET');

    request.flush(orders);

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.pedidos().map((order) => order.id)).toEqual([2, 1]);
  });

  it('should set controlled error when loading orders fails', () => {
    service.cargarPedidos();

    httpMock
      .expectOne('/api/admin/pedidos')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBe('No se han podido cargar los pedidos.');
  });

  it('should get order detail by id', () => {
    service.obtenerPedidoPorId(2).subscribe((response) => {
      expect(response).toEqual(detail);
    });

    const request = httpMock.expectOne('/api/admin/pedidos/2');

    expect(request.request.method).toBe('GET');

    request.flush(detail);
  });

  it('should update order status and replace it in state', () => {
    service.cargarPedidos();
    httpMock.expectOne('/api/admin/pedidos').flush(orders);

    const requestPayload: ActualizarEstadoPedidoAdminRequestDto = {
      estado: 'ENVIADO',
    };

    const updatedOrder: AdminPedidoResponseDto = {
      ...orders[0],
      estado: 'ENVIADO',
    };

    service.actualizarEstadoPedido(1, requestPayload).subscribe((response) => {
      expect(response).toEqual(updatedOrder);
    });

    const request = httpMock.expectOne('/api/admin/pedidos/1/estado');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(requestPayload);

    request.flush(updatedOrder);

    expect(service.pedidos().find((order) => order.id === 1)?.estado).toBe(
      'ENVIADO',
    );
  });
});
