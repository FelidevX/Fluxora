import { useState, useCallback } from "react";
import {
  CompraMateriaPrimaDTO,
  CompraMateriaPrimaResponse,
} from "@/types/inventario";
import { useToast } from "@/hooks/useToast";

// Helper para obtener el token normalizado
const getAuthToken = (): string => {
  let token = localStorage.getItem("auth_token");
  if (token?.startsWith("Bearer ")) {
    token = token.substring(7);
  }
  return token || "";
};

interface UseComprasResult {
  compras: CompraMateriaPrimaResponse[];
  loading: boolean;
  error: string | null;
  cargarCompras: () => Promise<void>;
  crearCompra: (compra: CompraMateriaPrimaDTO) => Promise<void>;
  obtenerCompraPorId: (
    id: number
  ) => Promise<CompraMateriaPrimaResponse | null>;
  buscarPorProveedor: (proveedor: string) => Promise<void>;
  obtenerComprasRecientes: (dias?: number) => Promise<void>;
  eliminarCompra: (id: number) => Promise<void>;
  marcarComoPagado: (id: number) => Promise<void>;
  clearError: () => void;
}

export function useCompras(): UseComprasResult {
  const [compras, setCompras] = useState<CompraMateriaPrimaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const cargarCompras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/compras`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar compras:", err);
      const errorMsg =
        "No se pudo conectar con el servidor. Verifique que el microservicio esté ejecutándose.";
      setError(errorMsg);
      toast.error(errorMsg, "Error al cargar compras");
      setCompras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearCompra = async (compra: CompraMateriaPrimaDTO) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/compras`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(compra),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Error al crear compra: ${response.status} - ${errorData}`
        );
      }

      await cargarCompras();
      toast.success("Compra registrada exitosamente", "Éxito");
    } catch (err) {
      console.error("Error al crear compra:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Error al crear la compra";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const obtenerCompraPorId = async (
    id: number
  ): Promise<CompraMateriaPrimaResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/compras/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error al obtener compra:", err);
      setError("Error al obtener la compra");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buscarPorProveedor = async (proveedor: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/compras/proveedor/${encodeURIComponent(
          proveedor
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al buscar por proveedor:", err);
      setError("Error al buscar compras por proveedor");
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerComprasRecientes = async (dias: number = 30) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/compras/recientes?dias=${dias}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al obtener compras recientes:", err);
      setError("Error al obtener compras recientes");
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  const eliminarCompra = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/compras/${id}`,
        { 
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar compra: ${response.status}`);
      }

      await cargarCompras();
      toast.success("Compra eliminada exitosamente", "Éxito");
    } catch (err) {
      const errorMsg =
        "No se puede eliminar esta compra ya que los lotes ya han sido utilizados.";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const marcarComoPagado = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/compras/${id}/estado-pago?estadoPago=PAGADO`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error al actualizar estado de pago: ${response.status}`
        );
      }

      await cargarCompras();
      toast.success("Compra marcada como pagada exitosamente", "Éxito");
    } catch (err) {
      console.error("Error al marcar compra como pagada:", err);
      const errorMsg = "Error al actualizar el estado de pago";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    compras,
    loading,
    error,
    cargarCompras,
    crearCompra,
    obtenerCompraPorId,
    buscarPorProveedor,
    obtenerComprasRecientes,
    eliminarCompra,
    marcarComoPagado,
    clearError,
  };
}
