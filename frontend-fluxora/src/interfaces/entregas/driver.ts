export interface Driver {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface Entrega {
  id: number;
  id_pedido: number;
  id_ruta: number;
  id_cliente: number;
  direccion: string;
  cliente: string;
  estado: "pendiente" | "entregado";
}

export interface FormularioEntrega {
  corriente: string;
  especial: string;
  comentario: string;
  [key: string]: any;
}

export interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  entregado?: boolean;
}
