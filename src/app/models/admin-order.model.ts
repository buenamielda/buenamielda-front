export interface AdminPedidoResponseDto {
  id: number;
  fechaPedido: string;
  estado: string;
  total: number;
  emailUsuario: string | null;
}