export interface UsuarioAdminResponseDto {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  roles: string[];
}