// Interfaces basadas en el backend real

export interface ClienteDTO {
  id: number;
  nombreNegocio: string;
  nombre: string;
  direccion: string;
  contacto: string;
  email: string;
  latitud: number;
  longitud: number;
}

export interface UsuarioDTO {
  id: number;
  nombre: string;
  rol: string;
  latitud?: number;
  longitud?: number;
}

export interface RutaDTO {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  id_driver: number;
}

export interface RegistroEntrega {
  id?: number;
  id_cliente: number;
  hora_entregada?: string;
  corriente_entregado: number;
  especial_entregado: number;
}

export interface RutaActiva {
  id: number;
  nombre: string;
  id_driver: number;
  clientes: ClienteDTO[];
  totalClientes: number;
  entregasCompletadas: number;
  progreso: number;
}

export interface ClienteConEntrega {
  cliente: ClienteDTO;
  entregaRealizada: boolean;
  ultimaEntrega: RegistroEntrega | null;
  orden: number;
  kg_corriente_programado: number;
  kg_especial_programado: number;
  estado: string;
  fecha_programada: string;
}

export interface ProgramacionEntrega {
  id: number;
  id_ruta: number;
  id_cliente: number;
  kg_corriente_programado: number;
  kg_especial_programado: number;
  fecha_programada: string;
  estado: string;
  cliente?: ClienteDTO;
  ruta?: RutaDTO;
}

export interface EntregaConductor {
  entrega: RegistroEntrega;
  ruta: RutaDTO;
  cliente: ClienteDTO;
}
