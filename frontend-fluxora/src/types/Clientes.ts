export interface ClienteDTO {
  nombreNegocio?: string;
  nombre?: string;
  contacto?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  email?: string;
  precioCorriente?: number;
  precioEspecial?: number;
  ruta?: string;
  estado?: "activo" | "inactivo";
}

export interface ClienteResponse {
  id: number;
  nombre: string;
  nombreNegocio?: string;
  contacto: string;
  direccion: string;
  email?: string;
  nombreRuta?: string; // Nombre de la ruta obtenido del backend
  ruta?: string; // Alias para nombreRuta (compatibilidad)
  ultimaEntrega?: string;
  estado?: "activo" | "inactivo";
  precioCorriente?: number;
  precioEspecial?: number;
  latitud?: number;
  longitud?: number;
}
