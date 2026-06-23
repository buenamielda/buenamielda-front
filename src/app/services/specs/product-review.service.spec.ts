import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ProductReviewService } from '../product-review.service';
import {
  CreateProductReviewRequest,
  OrderReviewResponse,
  ProductReviewCommentResponse,
  ProductReviewsResponse,
  UpdateProductReviewRequest,
} from '../../models/product-review.model';

describe('ProductReviewService', () => {
  let service: ProductReviewService;
  let httpMock: HttpTestingController;

  const review: ProductReviewCommentResponse = {
    id: 1,
    puntuacion: 5,
    comentario: 'Muy buena miel',
    fechaActualizacion: '2026-06-23T10:00:00',
    nombreUsuario: 'Paula',
  };

  const productReviews: ProductReviewsResponse = {
    puntuacionTotal: 4.5,
    valoracionProductoComentarioResponseDtos: [review],
  };

  const orderReview: OrderReviewResponse = {
    id: 9,
    puntuacion: 4,
    comentario: 'Buen producto',
    estado: 'PENDIENTE',
    activa: true,
    fechaCreacion: '2026-06-23T09:00:00',
    fechaActualizacion: '2026-06-23T10:00:00',
    idProducto: 1,
    nombreProducto: 'Miel de tomillo',
    nombreUsuario: 'Paula',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductReviewService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ProductReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar las valoraciones de un producto', () => {
    service.getProductReviews(1).subscribe((response) => {
      expect(response).toEqual(productReviews);
    });

    const request = httpMock.expectOne('/api/productos/1/valoraciones');
    expect(request.request.method).toBe('GET');
    request.flush(productReviews);
  });

  it('debe consultar las valoraciones asociadas a un pedido', () => {
    service.getOrderReviews(5).subscribe((response) => {
      expect(response).toEqual([orderReview]);
    });

    const request = httpMock.expectOne('/api/pedidos/5/valoraciones');
    expect(request.request.method).toBe('GET');
    request.flush([orderReview]);
  });

  it('debe crear una valoracion de producto', () => {
    const payload: CreateProductReviewRequest = {
      puntuacion: 5,
      comentario: 'Me ha encantado',
    };

    service.createProductReview(99, payload).subscribe((response) => {
      expect(response).toEqual(review);
    });

    const request = httpMock.expectOne('/api/productos/99/valoraciones');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(review);
  });

  it('debe modificar una valoracion propia', () => {
    const payload: UpdateProductReviewRequest = {
      puntuacion: 4,
      comentario: 'Actualizo mi comentario',
    };

    service.updateProductReview(1, payload).subscribe((response) => {
      expect(response).toEqual(review);
    });

    const request = httpMock.expectOne('/api/productos/1/valoraciones');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush(review);
  });

  it('debe eliminar una valoracion propia', () => {
    service.deleteProductReview(1).subscribe((response) => {
      expect(response).toBeNull();
    });

    const request = httpMock.expectOne('/api/productos/1/valoraciones');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});