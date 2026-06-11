export interface SalesPointResponseDto {
  id: number;
  nombre: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  latitud: number;
  longitud: number;
  telefono: string;
  horario: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}