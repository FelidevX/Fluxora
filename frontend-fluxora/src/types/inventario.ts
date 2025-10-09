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
  cantidad: number;
  precio: number;
  estado: string;
  categoria: string;
  descripcion: string;
  fecha: string;
  receta?: RecetaItem[];
}

export interface ProductoDTO {
  nombre: string;
  cantidad: number;
  precio: number;
  estado: string;
  categoria: string;
  descripcion: string;
  fecha: string;
  receta?: RecetaItem[];
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
