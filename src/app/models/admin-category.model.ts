export interface CategoriaAdminResponseDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}


export interface CategoriaAdminRequestDto {
  nombre: string;
  descripcion: string;
  activa: boolean;
}