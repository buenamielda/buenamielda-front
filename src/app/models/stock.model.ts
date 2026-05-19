export interface ActualizarStockRequestDto {
  idPedido: number;
}

export interface ProductoStockResponseDto {
  idProducto: number;
  nombre: string;
  stock: number;
  activo: boolean;
}

export interface ValidarStockRequestDto {
  idProducto: number;
  cantidadSolicitada: number;
}

export interface ValidarStockResponseDto {
  idProducto: number;
  nombreProducto: string;
  stockDisponible: number;
  cantidadSolicitada: number;
  disponible: boolean;
}