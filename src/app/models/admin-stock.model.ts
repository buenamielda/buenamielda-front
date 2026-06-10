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

export type AdminStockAlertType = 'BAJO_STOCK' | 'AGOTADO';
export type AdminStockAlertStatus = 'PENDIENTE' | 'RESUELTA';

export interface AdminStockAlertResponseDto {
  id: number;
  tipo: AdminStockAlertType;
  mensaje: string;
  stockDetectado: number;
  umbral: number;
  estado: AdminStockAlertStatus;
  fechaCreacion: string;
  fechaResolucion: string | null;
  idProducto: number;
  nombreProducto: string;
  idUsuarioResolucion: number | null;
  nombreUsuarioResolucion: string | null;
}