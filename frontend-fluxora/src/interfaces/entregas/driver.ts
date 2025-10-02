export interface Driver {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface Entrega {
  id: number;
  direccion: string;
  cliente: string;
  estado: "pendiente" | "entregado";
}

export interface FormularioEntrega {
  corriente: string;
  especial: string;
  observaciones: string;
}
