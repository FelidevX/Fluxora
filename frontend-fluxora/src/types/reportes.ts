// Tipos de periodo para los reportes
export type PeriodoReporte = "diario" | "semanal" | "mensual" | "personalizado";

// Tipos de reportes disponibles
export type TipoReporte =
  | "entregas"
  | "ventas"
  | "inventario"
  | "clientes"
  | "rutas"
  | "productividad";

// Filtros para generar reportes
export interface FiltrosReporte {
  tipo: TipoReporte;
  periodo: PeriodoReporte;
  fechaInicio: string;
  fechaFin: string;
  idRuta?: number;
  idCliente?: number;
  idProducto?: number;
}

// Reporte de entregas
export interface ReporteEntregas {
  fecha: string;
  entregasProgramadas: number;
  totalEntregas: number;
  entregasCompletadas: number;
  kgCorriente: number;
  kgEspecial: number;
  kgTotal: number;
  porcentajeCompletado: number;
}

// Reporte de ventas
export interface ReporteVentas {
  fecha: string;
  totalVentas: number;
  totalKilos: number;
  ventasCorriente: number;
  ventasEspecial: number;
  numeroClientes: number;
  ventaPromedio: number;
}

// Reporte de inventario
export interface ReporteInventario {
  fecha: string;
  producto: string;
  tipo: string;
  stockInicial: number;
  entradas: number;
  salidas: number;
  stockFinal: number;
  valorTotal: number;
}

// Reporte de clientes
export interface ReporteClientes {
  idCliente: number;
  nombreCliente: string;
  totalCompras: number;
  totalKilos: number;
  ultimaCompra: string;
  frecuenciaCompra: string;
  valorTotal: number;
}

// Reporte de rutas
export interface ReporteRutas {
  idRuta: number;
  nombreRuta: string;
  fecha: string;
  totalEntregas: number;
  entregasCompletadas: number;
  kgTransportado: number;
  tiempoPromedio: string;
  eficiencia: number;
}

// Reporte de productividad
export interface ReporteProductividad {
  fecha: string;
  totalPedidos: number;
  pedidosCompletados: number;
  kgProducidos: number;
  kgEntregados: number;
  eficienciaProduccion: number;
  eficienciaEntrega: number;
}

// Estructura general de respuesta de reportes
export interface RespuestaReporte<T> {
  tipo: TipoReporte;
  periodo: PeriodoReporte;
  fechaInicio: string;
  fechaFin: string;
  datos: T[];
  resumen: ResumenReporte;
}

// Resumen general del reporte
export interface ResumenReporte {
  totalRegistros: number;
  totalGeneral?: number;
  promedioGeneral?: number;
  maximoValor?: number;
  minimoValor?: number;
  [key: string]: any; // Permite agregar más campos dinámicamente
}

// Opciones para exportar reportes
export interface OpcionesExportacion {
  formato: "excel" | "pdf" | "csv";
  nombreArchivo: string;
  incluirGraficos: boolean;
  incluirResumen: boolean;
}
