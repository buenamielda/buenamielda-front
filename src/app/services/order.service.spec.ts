import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  AuthRequiredError,
  EmptyCartError,
  InvalidOrderStatusError,
  OrderNotFoundError,
  OrderService,
} from './order.service';
import { CartService } from './cart.service';
import { ProductCatalogService } from './product-catalog.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  let cartService: jasmine.SpyObj<CartService>;
  let productCatalog: jasmine.SpyObj<ProductCatalogService>;

  const apiOrder = {
    idPedido: 5,
    fechaPedido: '2026-05-20T12:00:00',
    estado: 'CREADO',
    total: 17,
    idUsuario: 7,
    telefono: '600000000',
    direccion: 'Calle Miel 1',
    codigoPostal: '28001',
    localidad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
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
    cartService = jasmine.createSpyObj<CartService>('CartService', ['clear']);
    productCatalog = jasmine.createSpyObj<ProductCatalogService>(
      'ProductCatalogService',
      ['obtenerPorId', 'cargarProductos'],
    );

    productCatalog.obtenerPorId.and.returnValue({
      id: 1,
      nombre: 'Miel de tomillo',
      descripcion: 'Miel natural',
      precio: 8.5,
      stock: 10,
      imagenUrl: 'assets/images/miel-tomillo.svg',
      activo: true,
      nombreCategoria: 'Miel',
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CartService, useValue: cartService },
        { provide: ProductCatalogService, useValue: productCatalog },
      ],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create an order from the persistent cart using the API', () => {
    service.createFromCart(3, 'tok_test').subscribe((order) => {
      expect(order.id).toBe(5);
      expect(order.estado).toBe('CREADO');
      expect(order.total).toBe(17);
      expect(order.idUsuario).toBe(7);
      expect(order.direccion).toBe('Calle Miel 1');
      expect(order.lineas.length).toBe(1);
      expect(order.lineas[0].id).toBe(1);
      expect(order.lineas[0].idProducto).toBe(1);
      expect(order.lineas[0].nombreProducto).toBe('Miel de tomillo');
      expect(order.lineas[0].imagenProducto).toBe(
        'assets/images/miel-tomillo.svg',
      );
    });

    const request = httpMock.expectOne('/api/pedidos');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      idDireccionEnvio: 3,
      stripeToken: 'tok_test',
    });

    request.flush(apiOrder);

    expect(cartService.clear).toHaveBeenCalled();
    expect(productCatalog.cargarProductos).toHaveBeenCalled();
    expect(service.lastOrder()?.id).toBe(5);
  });

  it('should map an empty cart backend error to EmptyCartError', () => {
    service.createFromCart(3, 'tok_test').subscribe({
      next: () => fail('Expected EmptyCartError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(EmptyCartError));
      },
    });

    httpMock.expectOne('/api/pedidos').flush(
      { message: 'carrito vacio' },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('should map unauthorized backend errors to AuthRequiredError', () => {
    service.createFromCart(3, 'tok_test').subscribe({
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

  it('should get all user orders from the API', () => {
    service.getOrdersFromApi().subscribe((orders) => {
      expect(orders.length).toBe(1);
      expect(orders[0].id).toBe(5);
      expect(orders[0].lineas[0].nombreProducto).toBe('Miel de tomillo');
    });

    const request = httpMock.expectOne('/api/pedidos');

    expect(request.request.method).toBe('GET');

    request.flush([apiOrder]);
  });

  it('should map not found backend errors when getting an order', () => {
    service.getOrderByIdFromApi(999).subscribe({
      next: () => fail('Expected OrderNotFoundError'),
      error: (error) => {
        expect(error).toEqual(jasmine.any(OrderNotFoundError));
      },
    });

    httpMock.expectOne('/api/pedidos/999').flush(
      {},
      { status: 404, statusText: 'Not Found' },
    );
  });

  it('should update order status through the API', () => {
    const updatedApiOrder = {
      ...apiOrder,
      estado: 'ENTREGADO',
    };

    service.updateStatusFromApi(5, { estado: 'ENTREGADO' }).subscribe((order) => {
      expect(order.id).toBe(5);
      expect(order.estado).toBe('ENTREGADO');
      expect(service.lastOrder()?.estado).toBe('ENTREGADO');
    });

    const request = httpMock.expectOne('/api/pedidos/5/estado');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ estado: 'ENTREGADO' });

    request.flush(updatedApiOrder);
  });

  it('should reject invalid status before calling the API', () => {
    service
      .updateStatusFromApi(5, { estado: 'INVALIDO' as never })
      .subscribe({
        next: () => fail('Expected InvalidOrderStatusError'),
        error: (error) => {
          expect(error).toEqual(jasmine.any(InvalidOrderStatusError));
        },
      });

    httpMock.expectNone('/api/pedidos/5/estado');
  });
});