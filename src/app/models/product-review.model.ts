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