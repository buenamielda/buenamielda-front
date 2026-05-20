export type PedidoEstado =
  | 'CREADO'
  | 'PENDIENTE'
  | 'PAGADO'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface ActualizarEstadoPedidoRequestDto {
  estado: PedidoEstado;
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
  estado: PedidoEstado;
  total: number;
  idUsuario: number;
  lineas: LineaPedidoResponseDto[];
}

export interface PagoRequestDto {
  idPedido: number;
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
