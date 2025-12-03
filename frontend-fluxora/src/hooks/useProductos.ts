import { useState, useCallback, useEffect } from "react";
import { Producto, ProductoDTO, LoteProducto } from "@/types/inventario";

// Helper para obtener el token normalizado
const getAuthToken = (): string => {
  let token = localStorage.getItem("auth_token");
  if (token?.startsWith("Bearer ")) {
    token = token.substring(7);
  }
  return token || "";
};

interface UseProductosResult {
  productos: Producto[];
  loading: boolean;
  error: string | null;
  cargarProductos: () => Promise<void>;
  crearProducto: (producto: ProductoDTO) => Promise<void>;
  actualizarProducto: (
    id: number,
    producto: Partial<ProductoDTO>
  ) => Promise<void>;
  eliminarProducto: (id: number) => Promise<void>;

  // Funciones para lotes
  cargarLotes: (productoId: number) => Promise<LoteProducto[]>;
  crearLote: (
    productoId: number,
    lote: Omit<LoteProducto, "id">
  ) => Promise<void>;
  actualizarLote: (
    productoId: number,
    loteId: number,
    lote: Partial<LoteProducto>
  ) => Promise<void>;
  eliminarLote: (productoId: number, loteId: number) => Promise<void>;
  obtenerStockTotal: (productoId: number) => Promise<number>;

  clearError: () => void;
}

const API_BASE = "http://localhost:8080/api/inventario/productos";

export function useProductos(): UseProductosResult {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setError("No se pudo conectar con el servidor.");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const crearProducto = async (producto: ProductoDTO) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(producto),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Error al crear producto: ${response.status} - ${errorData}`
        );
      }

      await cargarProductos();
    } catch (err) {
      console.error("Error al crear producto:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear el producto"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const actualizarProducto = async (
    id: number,
    producto: Partial<ProductoDTO>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(producto),
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar producto: ${response.status}`);
      }

      await cargarProductos();
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      setError("Error al actualizar el producto");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${id}`, { 
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 400 || response.status === 409) {
          const errorText = await response.text();
          setError(
            "No se puede eliminar este producto porque uno o más de sus lotes ya han sido utilizados en producción."
          );
          throw new Error(
            errorText || "El producto tiene lotes que ya han sido utilizados"
          );
        }
        throw new Error(`Error al eliminar producto: ${response.status}`);
      }

      await cargarProductos();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      if (!error) {
        // Solo setear error si no se seteó antes
        setError("Error al eliminar el producto");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============== FUNCIONES PARA LOTES ==============

  const cargarLotes = async (productoId: number): Promise<LoteProducto[]> => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${productoId}/lotes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar lotes: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error al cargar lotes:", err);
      setError("Error al cargar los lotes del producto");
      return [];
    }
  };

  const crearLote = async (
    productoId: number,
    lote: Omit<LoteProducto, "id">
  ) => {
    try {
      setLoading(true);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${productoId}/lotes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(lote),
      });

      if (!response.ok) {
        // Parsear el error del backend
        let errorMessage = "Error al crear el lote";
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.mensaje || errorMessage;
        } catch {
          try {
            errorMessage = await response.text() || errorMessage;
          } catch {
            errorMessage = `Error ${response.status}: No se pudo crear el lote`;
          }
        }
        
        // Solo lanzar el error, NO guardarlo en el estado
        throw new Error(errorMessage);
      }

      await cargarProductos();
    } catch (err) {
      console.error("Error al crear lote:", err);
      // Re-lanzar para que el componente lo maneje
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const actualizarLote = async (
    productoId: number,
    loteId: number,
    lote: Partial<LoteProducto>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE}/${productoId}/lotes/${loteId}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(lote),
        }
      );

      if (!response.ok) {
        throw new Error(`Error al actualizar lote: ${response.status}`);
      }

      await cargarProductos();
    } catch (err) {
      console.error("Error al actualizar lote:", err);
      setError("Error al actualizar el lote");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarLote = async (productoId: number, loteId: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE}/${productoId}/lotes/${loteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 400 || response.status === 409) {
          const errorText = await response.text();
          setError(
            "No se puede eliminar este lote ya que ha sido utilizado en producción."
          );
          throw new Error(errorText || "El lote ya ha sido utilizado");
        }
        throw new Error(`Error al eliminar lote: ${response.status}`);
      }

      await cargarProductos();
    } catch (err) {
      console.error("Error al eliminar lote:", err);
      if (!error) {
        // Solo setear error si no se seteó antes
        setError("Error al eliminar el lote");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const obtenerStockTotal = async (productoId: number): Promise<number> => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/${productoId}/stock-total`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al obtener stock total: ${response.status}`);
      }

      const stockTotal = await response.json();
      return stockTotal || 0;
    } catch (err) {
      console.error("Error al obtener stock total:", err);
      return 0;
    }
  };

  const clearError = () => setError(null);

  return {
    productos,
    loading,
    error,
    cargarProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    cargarLotes,
    crearLote,
    actualizarLote,
    eliminarLote,
    obtenerStockTotal,
    clearError,
  };
}
