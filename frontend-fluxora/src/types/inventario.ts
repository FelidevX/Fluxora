export interface MateriaPrima {
  id: number;
  nombre: string;
  cantidad: number;
  proveedor: string;
  estado: string;
  unidad: string;
  fecha: string;
}

export interface MateriaPrimaDTO {
  id?: number;
  nombre: string;
  cantidad: number;
  proveedor: string;
  estado: string;
  unidad: string;
  fecha: string;
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
