import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { Producto, ProductoPayload } from '../../models/product.model';
import { ProductCatalogService } from '../product-catalog.service';

describe('ProductCatalogService', () => {
  let service: ProductCatalogService;
  let httpMock: HttpTestingController;

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

  const inactiveProduct: Producto = {
    ...product,
    id: 2,
    nombre: 'Miel inactiva',
    activo: false,
  };

  const payload: ProductoPayload = {
    nombre: ' Miel nueva ',
    descripcion: ' Descripción ',
    precio: 9.5,
    stock: 4,
    imagenUrl: '',
    idCategoria: 2,
    nombreCategoria: 'Polen',
    activo: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductCatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load products without filters', () => {
    service.cargarProductos();

    const request = httpMock.expectOne('/api/productos');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().length).toBe(0);

    request.flush([product, inactiveProduct]);

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.todosLosProductos()).toEqual([product, inactiveProduct]);
    expect(service.productos()).toEqual([product]);
  });

  it('should load products with filters', () => {
    service.cargarProductos({
      nombre: ' tomillo ',
      categoriaId: 1,
      precioMin: 5,
      precioMax: 20,
      disponible: true,
    });

    const request = httpMock.expectOne((req) => req.url === '/api/productos');

    expect(request.request.params.get('nombre')).toBe('tomillo');
    expect(request.request.params.get('categoriaId')).toBe('1');
    expect(request.request.params.get('precioMin')).toBe('5');
    expect(request.request.params.get('precioMax')).toBe('20');
    expect(request.request.params.get('disponible')).toBe('true');

    request.flush([product]);

    expect(service.todosLosProductos()).toEqual([product]);
  });

  it('should set error when loading products fails', () => {
    service.cargarProductos();

    httpMock
      .expectOne('/api/productos')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBe('No se han podido cargar los productos.');
  });

  it('should get product by id from loaded state', () => {
    service.cargarProductos();
    httpMock.expectOne('/api/productos').flush([product]);

    expect(service.obtenerPorId(1)).toEqual(product);
    expect(service.obtenerPorId(99)).toBeUndefined();
  });

  it('should load one product and insert it when it does not exist', () => {
    service.cargarProductoPorId(1);

    const request = httpMock.expectOne('/api/productos/1');

    expect(request.request.method).toBe('GET');

    request.flush(product);

    expect(service.todosLosProductos()).toEqual([product]);
  });

  it('should load one product and update it when it already exists', () => {
    service.cargarProductos();
    httpMock.expectOne('/api/productos').flush([product]);

    const updatedProduct = {
      ...product,
      nombre: 'Miel actualizada',
    };

    service.cargarProductoPorId(1);
    httpMock.expectOne('/api/productos/1').flush(updatedProduct);

    expect(service.todosLosProductos()).toEqual([updatedProduct]);
  });

  it('should create product with normalized request dto', () => {
    service.crearProducto(payload);

    const request = httpMock.expectOne('/api/productos');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Miel nueva',
      descripcion: 'Descripción',
      precio: 9.5,
      stock: 4,
      imagenUrl: 'assets/images/placeholder.svg',
      idCategoria: 2,
      activo: true,
    });

    const createdProduct: Producto = {
      ...product,
      id: 3,
      nombre: 'Miel nueva',
      precio: 9.5,
      stock: 4,
      imagenUrl: 'assets/images/placeholder.svg',
      nombreCategoria: 'Polen',
    };

    request.flush(createdProduct);

    expect(service.todosLosProductos()).toEqual([createdProduct]);
  });

  it('should update product and replace it in state', () => {
    service.cargarProductos();
    httpMock.expectOne('/api/productos').flush([product]);

    const updatedProduct = {
      ...product,
      nombre: 'Miel modificada',
    };

    service.actualizarProducto(1, payload);

    const request = httpMock.expectOne('/api/productos/1');

    expect(request.request.method).toBe('PUT');

    request.flush(updatedProduct);

    expect(service.todosLosProductos()).toEqual([updatedProduct]);
  });

  it('should delete product from state', () => {
    service.cargarProductos();
    httpMock.expectOne('/api/productos').flush([product, inactiveProduct]);

    service.borrarProducto(1);

    const request = httpMock.expectOne('/api/productos/1');

    expect(request.request.method).toBe('DELETE');

    request.flush(null);

    expect(service.todosLosProductos()).toEqual([inactiveProduct]);
  });

  it('should update product active status', () => {
    service.cargarProductos();
    httpMock.expectOne('/api/productos').flush([product]);

    const updatedProduct = {
      ...product,
      activo: false,
    };

    service.actualizarEstadoProducto(1, false);

    const request = httpMock.expectOne('/api/productos/1');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ activo: false });

    request.flush(updatedProduct);

    expect(service.todosLosProductos()[0].activo).toBeFalse();
  });

  it('should update local stock without negative values', () => {
    service.cargarProductos();
    httpMock.expectOne('/api/productos').flush([product]);

    service.actualizarStockLocal(1, -5);

    expect(service.todosLosProductos()[0].stock).toBe(0);
  });

  it('should discount local stock without negative values', () => {
    service.cargarProductos();
    httpMock.expectOne('/api/productos').flush([product]);

    service.descontarStockLocal(1, 99);

    expect(service.todosLosProductos()[0].stock).toBe(0);
  });
});
