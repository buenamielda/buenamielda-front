import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  AdminProductoStockResponseDto,
  AdminStockAlertResponseDto,
} from '../../models/admin-stock.model';
import { AdminStockService } from '../admin-stock.service';

describe('AdminStockService', () => {
  let service: AdminStockService;
  let httpMock: HttpTestingController;

  const stockProducts: AdminProductoStockResponseDto[] = [
    {
      id: 2,
      nombre: 'Polen natural',
      stock: 2,
      activo: true,
      deleted: false,
    },
    {
      id: 1,
      nombre: 'Miel de tomillo',
      stock: 10,
      activo: true,
      deleted: false,
    },
  ];

  const alerts: AdminStockAlertResponseDto[] = [
    {
      id: 1,
      tipo: 'BAJO_STOCK',
      mensaje: 'Stock bajo',
      stockDetectado: 2,
      umbral: 10,
      estado: 'PENDIENTE',
      fechaCreacion: '2026-06-23T10:00:00',
      fechaResolucion: null,
      idProducto: 2,
      nombreProducto: 'Polen natural',
      idUsuarioResolucion: null,
      nombreUsuarioResolucion: null,
    },
    {
      id: 2,
      tipo: 'AGOTADO',
      mensaje: 'Agotado',
      stockDetectado: 0,
      umbral: 10,
      estado: 'RESUELTA',
      fechaCreacion: '2026-06-22T10:00:00',
      fechaResolucion: '2026-06-22T11:00:00',
      idProducto: 3,
      nombreProducto: 'Miel agotada',
      idUsuarioResolucion: 1,
      nombreUsuarioResolucion: 'Admin',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminStockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load stock products and sort them by id', () => {
    service.cargarStock();

    const request = httpMock.expectOne('/api/admin/stock');

    expect(request.request.method).toBe('GET');

    request.flush(stockProducts);

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.productosStock().map((product) => product.id)).toEqual([1, 2]);
  });

  it('should set controlled error when loading stock fails', () => {
    service.cargarStock();

    httpMock.expectOne('/api/admin/stock').flush(
      {},
      { status: 500, statusText: 'Server Error' },
    );

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBe('No se ha podido cargar el stock de los productos.');
  });

  it('should update stock and replace product in state', () => {
    service.cargarStock();
    httpMock.expectOne('/api/admin/stock').flush(stockProducts);

    const updatedProduct: AdminProductoStockResponseDto = {
      id: 2,
      nombre: 'Polen natural',
      stock: 8,
      activo: true,
      deleted: false,
    };

    service.actualizarStock(2, { stock: 8 }).subscribe((response) => {
      expect(response).toEqual(updatedProduct);
    });

    const request = httpMock.expectOne('/api/admin/productos/2/stock');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ stock: 8 });

    request.flush(updatedProduct);

    expect(service.productosStock().find((product) => product.id === 2)?.stock).toBe(8);
  });

  it('should load only pending stock alerts sorted by date descending', () => {
    const newerPendingAlert: AdminStockAlertResponseDto = {
      ...alerts[0],
      id: 3,
      fechaCreacion: '2026-06-24T10:00:00',
      nombreProducto: 'Miel nueva',
    };

    service.cargarAlertasPendientes();

    const request = httpMock.expectOne('/api/admin/alertas-stock');

    expect(request.request.method).toBe('GET');

    request.flush([alerts[0], alerts[1], newerPendingAlert]);

    expect(service.cargandoAlertas()).toBeFalse();
    expect(service.errorAlertas()).toBeNull();
    expect(service.alertasPendientes().map((alert) => alert.id)).toEqual([3, 1]);
  });

  it('should set controlled error when loading stock alerts fails', () => {
    service.cargarAlertasPendientes();

    httpMock.expectOne('/api/admin/alertas-stock').flush(
      {},
      { status: 500, statusText: 'Server Error' },
    );

    expect(service.cargandoAlertas()).toBeFalse();
    expect(service.errorAlertas()).toBe(
      'No se han podido cargar las alertas de stock pendientes.',
    );
  });

  it('should resolve stock alert and update alert state', () => {
    service.cargarAlertasPendientes();
    httpMock.expectOne('/api/admin/alertas-stock').flush(alerts);

    const resolvedAlert: AdminStockAlertResponseDto = {
      ...alerts[0],
      estado: 'RESUELTA',
      fechaResolucion: '2026-06-23T11:00:00',
      idUsuarioResolucion: 1,
      nombreUsuarioResolucion: 'Admin',
    };

    service.resolverAlerta(1).subscribe((response) => {
      expect(response).toEqual(resolvedAlert);
    });

    const request = httpMock.expectOne('/api/admin/alertas-stock/1/resolver');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});

    request.flush(resolvedAlert);

    expect(service.alertasPendientes().some((alert) => alert.id === 1)).toBeFalse();
  });
});