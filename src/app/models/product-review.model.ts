export type ReviewStatus = 'PENDIENTE' | 'PUBLICADA' | 'OCULTA';

export interface ProductReviewCommentResponse {
  id: number;
  puntuacion: number;
  comentario: string | null;
  fechaActualizacion: string;
  nombreUsuario: string;
}

export interface ProductReviewsResponse {
  puntuacionTotal: number;
  valoracionProductoComentarioResponseDtos: ProductReviewCommentResponse[];
}

export interface OrderReviewResponse {
  id: number;
  puntuacion: number;
  comentario: string | null;
  estado: ReviewStatus;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  idProducto: number;
  nombreProducto: string;
  nombreUsuario: string;
}

export interface CreateProductReviewRequest {
  puntuacion: number;
  comentario: string;
}