export interface AdminPedidoResponseDto {
  id: number;
  fechaPedido: string;
  estado: string;
  total: number;
  emailUsuario: string | null;
}

export interface AdminLineaPedidoResponseDto {
  id: number;
  cantidad: number;
  nombreProducto: string | null;
  nombreCategoria: string | null;
  imagenProducto: string | null;
  precioUnitario: number;
  subtotal: number;
}

export interface AdminPedidoDetallesResponseDto {
  id: number;
  fechaPedido: string;
  estado: string;
  total: number;
  emailUsuario: string | null;
  nombreUsuario: string | null;
  telefono: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  localidad: string | null;
  provincia: string | null;
  pais: string | null;
  lineaPedido: AdminLineaPedidoResponseDto[];
}