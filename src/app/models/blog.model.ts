export interface EntradaBlog {
  id: number;
  titulo: string;
  resumen: string;
  imagenUrl: string;
  categoria: string;
  activa: boolean;
  fechaPublicacion: string;
  autor: string;
}

export interface EntradaBlogDetalle {
  id: number;
  titulo: string;
  resumen: string;
  contenido: string;
  imagenUrl: string;
  categoria: string;
  fechaPublicacion: string;
  autor: string;
}

export interface EntradaBlogPayload {
  titulo: string;
  resumen: string;
  contenido: string;
  imagenUrl: string;
  categoria: string;
  activa: boolean;
}

export interface EntradaBlogCreada extends EntradaBlogDetalle {
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface PublicacionEntradaPayload {
  activa: boolean;
}
