/**
 * Configuración centralizada del API
 * Usa la variable de entorno NEXT_PUBLIC_API_URL
 */

// URL base del API Gateway
// En producción, usa la URL hardcodeada; en desarrollo, usa localhost
const getApiBaseUrl = () => {
  // Si estamos en el cliente (browser)
  if (typeof window !== "undefined") {
    // En producción, usa la URL de Render
    if (window.location.hostname.includes("onrender.com")) {
      return "https://fluxora-i000.onrender.com";
    }
    // En desarrollo local
    return "http://localhost:8080";
  }

  // En el servidor durante el build
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://localhost:8080"
  );
};

export const API_BASE_URL = getApiBaseUrl();

// Endpoints por microservicio
export const API_ENDPOINTS = {
  // Inventario
  inventario: {
    materiasPrimas: `${API_BASE_URL}/api/inventario/materias-primas`,
    productos: `${API_BASE_URL}/api/inventario/productos`,
    recetas: `${API_BASE_URL}/api/inventario/recetas-maestras`,
    compras: `${API_BASE_URL}/api/inventario/compras`,
  },
  // Usuarios
  usuarios: {
    base: `${API_BASE_URL}/api/usuarios`,
    login: `${API_BASE_URL}/api/usuarios/login`,
    register: `${API_BASE_URL}/api/usuarios/register`,
  },
  // Clientes
  clientes: {
    base: `${API_BASE_URL}/api/clientes`,
  },
  // Entregas
  entregas: {
    base: `${API_BASE_URL}/api/entregas`,
  },
} as const;

// Helper para construir URLs dinámicas
export const buildApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

// Configuración para fetch con headers comunes
export const getDefaultHeaders = (token?: string) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};
