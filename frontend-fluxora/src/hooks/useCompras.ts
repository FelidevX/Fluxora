import { useState, useCallback } from "react";
import {
  CompraMateriaPrimaDTO,
  CompraMateriaPrimaResponse,
} from "@/types/inventario";

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
  clearError: () => void;
}

export function useCompras(): UseComprasResult {
  const [compras, setCompras] = useState<CompraMateriaPrimaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarCompras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8080/api/inventario/compras"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar compras:", err);
      setError(
        "No se pudo conectar con el servidor. Verifique que el microservicio esté ejecutándose."
      );
      setCompras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearCompra = async (compra: CompraMateriaPrimaDTO) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8080/api/inventario/compras",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    } catch (err) {
      console.error("Error al crear compra:", err);
      setError(err instanceof Error ? err.message : "Error al crear la compra");
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

      const response = await fetch(
        `http://localhost:8080/api/inventario/compras/${id}`
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

      const response = await fetch(
        `http://localhost:8080/api/inventario/compras/proveedor/${encodeURIComponent(
          proveedor
        )}`
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

      const response = await fetch(
        `http://localhost:8080/api/inventario/compras/recientes?dias=${dias}`
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

      const response = await fetch(
        `http://localhost:8080/api/inventario/compras/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar compra: ${response.status}`);
      }

      await cargarCompras();
    } catch (err) {
      setError(
        "No se puede eliminar esta compra ya que los lotes ya han sido utilizados."
      );
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
    clearError,
  };
}
