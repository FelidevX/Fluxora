export interface MateriaPrima {
  id: number;
  nombre: string;
  unidad: string;
  // cantidad se calcula en backend como la suma de lotes; puede venir undefined si no hay lotes
  cantidad?: number;
  fecha?: string;
  estado?: string;
}

export interface MateriaPrimaDTO {
  // DTO para crear una materia prima (catálogo)
  nombre: string;
  unidad: string;
}

export interface LoteMateriaPrima {
  id?: number;
  materiaPrimaId: number;
  compraId?: number | null; // ID de la compra asociada (nuevo)
  cantidad: number; // Cantidad original comprada (fija)
  stockActual?: number; // Cantidad disponible actual (nuevo)
  costoUnitario: number;
  numeroLote?: string | null; // Número de lote del proveedor (nuevo)
  fechaCompra: string;
  fechaVencimiento?: string | null;
  materiaPrimaNombre?: string; // Nombre de la materia prima (para responses con JOIN)
}

// Enum de tipo de documento
export type TipoDocumento = "BOLETA" | "FACTURA";

// DTO para crear lote dentro de una compra
export interface LoteCompraDTO {
  materiaPrimaId: number;
  materiaPrimaNombre?: string; // Para mostrar en UI
  cantidad: number;
  costoUnitario: number;
  numeroLote?: string | null;
  fechaVencimiento?: string | null;
}

// DTO para crear una compra
export interface CompraMateriaPrimaDTO {
  numDoc: string;
  tipoDoc: TipoDocumento;
  proveedor: string;
  fechaCompra: string;
  fechaPago?: string | null; // Fecha de pago (opcional)
  lotes: LoteCompraDTO[];
}

// Response completo de una compra
export interface CompraMateriaPrimaResponse {
  id: number;
  numDoc: string;
  tipoDoc: TipoDocumento;
  proveedor: string;
  fechaCompra: string;
  fechaPago?: string | null; // Fecha de pago (opcional)
  createdAt: string;
  totalLotes: number;
  montoTotal: number;
  lotes: LoteMateriaPrima[];
}

export interface Producto {
  id: number;
  nombre: string;
  estado: string; // activo, descontinuado
  precioVenta: number;
  tipoProducto?: string | null; // CORRIENTE, ESPECIAL, NO_APLICA
  categoria: string; // panaderia, pasteleria, etc.
  stockTotal?: number; // Calculado desde los lotes
  recetaMaestraId?: number | null; // ID de la receta asociada
}

export interface ProductoDTO {
  nombre: string;
  estado: string;
  precioVenta: number;
  tipoProducto?: string | null;
  categoria: string;
  recetaMaestraId?: number | null; // ID de la receta asociada
}

export interface LoteProducto {
  id?: number;
  productoId: number;
  cantidadProducida: number;
  stockActual: number;
  costoProduccionTotal: number;
  costoUnitario: number;
  fechaProduccion: string;
  fechaVencimiento?: string | null;
  estado?: string; // disponible, agotado, vencido
}

export interface RecetaItem {
  materiaPrimaId: number;
  materiaPrimaNombre: string;
  cantidadNecesaria: number;
  unidad: string;
}

export interface ProductoConRecetaDTO {
  producto: ProductoDTO;
  receta: RecetaItem[];
  cantidadAPrducir: number;
}

export interface InsumoProduccion {
  id: number;
  cantidadUsada: number;
  fecha: string;
  materiaPrimaId: number;
}

export interface InsumoProduccionDTO {
  id?: number;
  cantidadUsada: number;
  fecha: string;
  materiaPrimaId: number;
}
