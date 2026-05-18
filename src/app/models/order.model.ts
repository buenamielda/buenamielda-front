export interface CrearPedidoRequestDto {
  idUsuario: number;
  idCarrito: number;
}

export interface LineaPedidoResponseDto {
  id: number;
  cantidad: number;
  idProducto: number;
  nombreProducto: string;
  precioUnitario: number;
  subtotal: number;
  imagenProducto?: string;
}

export interface PedidoResponseDto {
  id: number;
  fechaPedido: string;
  estado: string;
  total: number;
  idUsuario: number;
  lineas: LineaPedidoResponseDto[];
}

export interface PagoRequestDto {
  idPedido: number;
  idUsuario: number;
  importe: number;
  metodoPago: string;
}

export interface PagoResponseDto {
  id: number;
  idPedido: number;
  importe: number;
  estado: string;
  fechaPago: string;
}
