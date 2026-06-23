import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { Producto } from '../models/product.model';
import { ProductCatalogService } from './product-catalog.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let productCatalog: jasmine.SpyObj<ProductCatalogService>;

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

  const apiCart = {
    id: 10,
    fechaCreacion: '2026-06-23T10:00:00',
    fechaModificacion: '2026-06-23T10:10:00',
    estado: 'ACTIVO',
    idUsuario: 1,
    nombreUsuario: 'Paula',
    total: 17,
    lineas: [
      {
        id: 99,
        cantidad: 2,
        idProducto: 1,
        nombreProducto: 'Miel de tomillo',
        precioProducto: 8.5,
        subtotal: 17,
      },
    ],
  };

  beforeEach(() => {
    productCatalog = jasmine.createSpyObj<ProductCatalogService>(
      'ProductCatalogService',
      ['obtenerPorId'],
    );

    productCatalog.obtenerPorId.and.returnValue(product);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductCatalogService, useValue: productCatalog },
      ],
    });

    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load persisted cart and sync local items', () => {
    service.loadCart().subscribe((cart) => {
      expect(cart?.id).toBe(10);
    });

    const request = httpMock.expectOne('/api/carrito');

    expect(request.request.method).toBe('GET');

    request.flush(apiCart);

    expect(service.items().length).toBe(1);
    expect(service.items()[0].lineId).toBe(99);
    expect(service.items()[0].quantity).toBe(2);
    expect(service.items()[0].product.nombre).toBe('Miel de tomillo');
    expect(service.itemCount()).toBe(2);
    expect(service.subtotal()).toBe(17);
  });

  it('should clear local items when API cart is null', () => {
    service.loadCart().subscribe();

    httpMock.expectOne('/api/carrito').flush(null);

    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
    expect(service.subtotal()).toBe(0);
  });

  it('should add product to cart using backend endpoint', () => {
    service.add(product, 2, 'single').subscribe((cart) => {
      expect(cart.id).toBe(10);
    });

    const request = httpMock.expectOne('/api/carrito/lineas');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      idProducto: 1,
      cantidad: 2,
    });

    request.flush(apiCart);

    expect(service.items()[0].purchaseMode).toBe('single');
    expect(service.itemCount()).toBe(2);
  });

  it('should verify cart through backend endpoint', () => {
    service.verifyCart().subscribe();

    const request = httpMock.expectOne('/api/carrito/verificar');

    expect(request.request.method).toBe('GET');

    request.flush(null);
  });

  it('should increase an existing line quantity', () => {
    service.add(product, 2).subscribe();
    httpMock.expectOne('/api/carrito/lineas').flush(apiCart);

    service.increase(service.items()[0]).subscribe();

    const request = httpMock.expectOne('/api/carrito/lineas/99');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ cantidad: 3 });

    request.flush({
      ...apiCart,
      total: 25.5,
      lineas: [
        {
          ...apiCart.lineas[0],
          cantidad: 3,
          subtotal: 25.5,
        },
      ],
    });

    expect(service.itemCount()).toBe(3);
    expect(service.subtotal()).toBe(25.5);
  });

  it('should remove an existing line from backend and local state', () => {
    service.add(product, 2).subscribe();
    httpMock.expectOne('/api/carrito/lineas').flush(apiCart);

    service.remove(service.items()[0]).subscribe();

    const request = httpMock.expectOne('/api/carrito/lineas/99');

    expect(request.request.method).toBe('DELETE');

    request.flush(null);

    expect(service.items()).toEqual([]);
  });

  it('should clear local cart', () => {
    service.add(product, 2).subscribe();
    httpMock.expectOne('/api/carrito/lineas').flush(apiCart);

    service.clear();

    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
  });
});