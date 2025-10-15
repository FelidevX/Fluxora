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
  cantidad: number;
  costoUnitario: number;
  fechaCompra: string;
  fechaVencimiento?: string | null;
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
