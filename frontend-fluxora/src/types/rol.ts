export interface Rol {
  id: number;
  rol: string;
  permisos?: string[];
}

// Módulos disponibles en el sistema
export type Modulo = 
  | 'dashboard'
  | 'inventario'
  | 'entregas'
  | 'clientes'
  | 'reportes'
  | 'admin'
  | 'driver';

// Configuración de permisos por rol
export const PERMISOS_POR_ROL: Record<string, Modulo[]> = {
  'ADMIN': ['dashboard', 'inventario', 'entregas', 'clientes', 'reportes', 'admin'],
  'DRIVER': ['driver'],
  'PRODUCER': ['inventario'],
};
