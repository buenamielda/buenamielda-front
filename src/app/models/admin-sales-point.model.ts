import { SalesPointResponseDto } from './sales-point.model';

export interface AdminSalesPointResponseDto extends SalesPointResponseDto {
  activo: boolean;
}