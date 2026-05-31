export interface ShippingAddress {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  pais: string;
  principal: boolean;
  activa: boolean;
}