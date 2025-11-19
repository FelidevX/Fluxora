import { useState, useCallback } from "react";
import {
  MermaProducto,
  MermaProductoDTO,
  MermaAutomaticaDTO,
} from "@/types/inventario";

interface UseMermasResult {
  mermas: MermaProducto[];
  loading: boolean;
  error: string | null;
  cargarMermas: () => Promise<void>;
  registrarMermaManual: (merma: MermaProductoDTO) => Promise<void>;
  registrarMermaAutomatica: (motivo: string) => Promise<MermaProducto[]>;
  obtenerMermasPorProducto: (productoId: number) => Promise<MermaProducto[]>;
  clearError: () => void;
}

export function useMermas(): UseMermasResult {
  const [mermas, setMermas] = useState<MermaProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarMermas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/mermas`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMermas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar mermas:", err);
      setError("No se pudo conectar con el servidor.");
      setMermas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarMermaManual = async (merma: MermaProductoDTO) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/mermas/manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(merma),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Error al registrar merma: ${response.status} - ${errorData}`
        );
      }

      await cargarMermas();
    } catch (err) {
      console.error("Error al registrar merma manual:", err);
      setError(
        err instanceof Error ? err.message : "Error al registrar la merma"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registrarMermaAutomatica = async (
    motivo: string
  ): Promise<MermaProducto[]> => {
    try {
      setLoading(true);
      setError(null);

      const payload: MermaAutomaticaDTO = { motivo };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/mermas/automatica`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Error al registrar merma automática: ${response.status} - ${errorData}`
        );
      }

      const data = await response.json();
      await cargarMermas();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error al registrar merma automática:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrar la merma automática"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const obtenerMermasPorProducto = async (
    productoId: number
  ): Promise<MermaProducto[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/mermas/producto/${productoId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error al obtener mermas por producto:", err);
      setError("Error al obtener mermas del producto");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    mermas,
    loading,
    error,
    cargarMermas,
    registrarMermaManual,
    registrarMermaAutomatica,
    obtenerMermasPorProducto,
    clearError,
  };
}
