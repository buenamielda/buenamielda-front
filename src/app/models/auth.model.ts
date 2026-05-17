export interface RegistroRequestDto {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface UsuarioResponseDto {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  roles: string[];
}

export interface LoginResponseDto {
  token: string;
}

export interface PasswordRecoveryRequestDto {
  email: string;
}
