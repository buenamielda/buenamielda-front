export interface ActualizarStockRequestDto {
  idPedido: number;
}

export interface ProductoStockResponseDto {
  idProducto: number;
  nombre: string;
  stock: number;
  activo: boolean;
}