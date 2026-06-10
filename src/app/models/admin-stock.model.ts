export interface AdminProductoStockResponseDto {
  id: number;
  nombre: string;
  stock: number;
  activo: boolean;
  deleted: boolean;
}

export interface AdminStockUpdateRequestDto {
  stock: number;
}