export type ForumStatus = 'PUBLICADA' | 'ELIMINADA';

export interface ForumQuestionListResponse {
  id: number;
  titulo: string;
  estado: ForumStatus;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioId: number;
  nombreUsuario: string;
  totalRespuestas: number;
}

export interface ForumAnswerResponse {
  id: number;
  contenido: string;
  estado: ForumStatus;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioId: number;
  nombreUsuario: string;
}

export interface ForumQuestionResponse {
  id: number;
  titulo: string;
  contenido: string;
  estado: ForumStatus;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioId: number;
  nombreUsuario: string;
  respuestas: ForumAnswerResponse[];
}