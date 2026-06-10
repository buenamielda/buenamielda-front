export type RolUsuarioAdmin =
  | 'USUARIO'
  | 'DIVULGATIVO'
  | 'ADMINISTRADOR';

export interface UsuarioAdminResponseDto {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  roles: string[];
}

export interface UsuarioAdminUpdateRequestDto {
  nombre: string;
  email: string;
  activo: boolean;
  rol: RolUsuarioAdmin;
}