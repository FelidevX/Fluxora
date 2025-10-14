// Tipos para el sistema de recetas

// ===== RECETAS MAESTRAS =====
export interface RecetaMaestra {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  unidadBase: string;
  cantidadBase: number;
  precioEstimado?: number;
  precioUnidad: number; // Precio por kilo o por unidad según unidadBase
  tiempoPreparacion: number; // en minutos
  fechaCreacion: string;
  activa: boolean;
  ingredientes: RecetaIngrediente[];
}

export interface RecetaMaestraDTO {
  nombre: string;
  descripcion: string;
  categoria: string;
  unidadBase: string;
  cantidadBase: number;
  precioUnidad: number; // Precio por kilo o por unidad según unidadBase
  tiempoPreparacion: number;
  ingredientes: RecetaIngredienteDTO[];
}

// ===== INGREDIENTES DE RECETAS =====
export interface RecetaIngrediente {
  id: number;
  recetaId: number;
  materiaPrimaId: number;
  materiaPrimaNombre: string;
  cantidadNecesaria: number;
  unidad: string;
  esOpcional: boolean;
  notas?: string;
  ppp?: number; // Precio Promedio Ponderado por unidad
  costoParcial?: number; // Costo parcial (cantidadNecesaria * ppp)
}

export interface RecetaIngredienteDTO {
  materiaPrimaId: number;
  materiaPrimaNombre?: string; // Opcional para cuando se envía desde el formulario
  cantidadNecesaria: number;
  unidad: string;
  esOpcional: boolean;
  notas?: string;
}
