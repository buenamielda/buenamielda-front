export interface ProductTechnicalSheet {
  id: number;
  titulo: string;
  descripcionAmpliada: string;
  propiedades: string | null;
  origen: string | null;
  usoRecomendado: string | null;
  conservacion: string | null;
  publicada: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  productoId: number;
  usuarioId: number;
  nombreUsuario: string;
}

export interface ProductTechnicalSheetPayload {
  titulo: string;
  descripcionAmpliada: string;
  propiedades: string;
  origen: string;
  usoRecomendado: string;
  conservacion: string;
  publicada: boolean;
}