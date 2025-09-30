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
