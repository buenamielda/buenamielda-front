export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  activo: boolean;
  nombreCategoria: string;

  detalles?: string[];
  pesoNeto?: string;
  idCategoria?: number;
}

export interface ProductoPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  idCategoria: number;

  activo?: boolean;
  nombreCategoria?: string;
  detalles?: string[];
  pesoNeto?: string;
}