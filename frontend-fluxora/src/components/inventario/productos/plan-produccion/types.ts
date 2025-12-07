export interface ProgramacionEntrega {
  id: number;
  id_ruta: number;
  id_cliente: number;
  id_lote?: number;
  fecha_programada: string;
  nombreProducto: string;
  unidadMedida?: string;
  cantidadProducto: number;
  kg_corriente_programado?: number;
  kg_especial_programado?: number;
  orden?: number;
  estado: string;
}

export interface ProductoAgrupado {
  nombreProducto: string;
  unidadMedida: string;
  cantidadTotal: number;
  clientes: {
    nombreCliente: string;
    cantidad: number;
    ruta: string;
  }[];
}
