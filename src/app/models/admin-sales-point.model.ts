import { SalesPointResponseDto } from './sales-point.model';

export interface AdminSalesPointResponseDto extends SalesPointResponseDto {
  activo: boolean;
}

export interface AdminSalesPointRequestDto {
  nombre: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  latitud: number;
  longitud: number;
  telefono: string;
  horario: string;
}