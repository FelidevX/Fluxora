import { useState, useCallback, useEffect } from "react";
import {
  MateriaPrima,
  MateriaPrimaDTO,
  LoteMateriaPrima,
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

interface UseMateriasResult {
  materias: MateriaPrima[];
  loading: boolean;
  error: string | null;
  cargarMaterias: () => Promise<void>;
  crearMateria: (materia: MateriaPrimaDTO) => Promise<void>;
  actualizarMateria: (
    id: number,
    materia: Partial<MateriaPrimaDTO>
  ) => Promise<void>;
  actualizarStock: (id: number, nuevaCantidad: number) => Promise<void>;
  eliminarMateria: (id: number) => Promise<void>;
  clearError: () => void;
  setOnMateriaCreated: (callback: (() => Promise<void>) | null) => void;
}

export function useMaterias(): UseMateriasResult {
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onMateriaCreated, setOnMateriaCreated] = useState<
    (() => Promise<void>) | null
  >(null);
  const toast = useToast();

  const cargarMaterias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMaterias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar materias primas:", err);
      const errorMsg =
        "No se pudo conectar con el servidor. Verifique que el microservicio esté ejecutándose.";
      setError(errorMsg);
      toast.error(errorMsg, "Error al cargar materias primas");
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMaterias();
  }, [cargarMaterias]);

  const crearMateria = async (materia: MateriaPrimaDTO) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const payload = {
        nombre: materia.nombre,
        unidad: materia.unidad,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Error al crear materia prima: ${response.status} - ${errorData}`
        );
      }

      await cargarMaterias();
      toast.success("Materia prima creada exitosamente", "Éxito");

      if (onMateriaCreated) await onMateriaCreated();
    } catch (err) {
      console.error("Error al crear materia prima:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Error al crear la materia prima";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
    } finally {
      setLoading(false);
    }
  };

  const eliminarMateria = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas/${id}`,
        { 
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok)
        throw new Error(`Error al eliminar materia prima: ${response.status}`);

      await cargarMaterias();
      toast.success("Materia prima eliminada exitosamente", "Éxito");
    } catch (err) {
      console.error("Error al eliminar materia prima:", err);
      const errorMsg = "Error al eliminar la materia prima";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
    } finally {
      setLoading(false);
    }
  };

  const actualizarMateria = async (
    id: number,
    materia: Partial<MateriaPrimaDTO>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas/${id}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(materia),
        }
      );

      if (!response.ok)
        throw new Error(
          `Error al actualizar materia prima: ${response.status}`
        );

      await cargarMaterias();
      toast.success("Materia prima actualizada exitosamente", "Éxito");
    } catch (err) {
      console.error("Error al actualizar materia prima:", err);
      const errorMsg = "Error al actualizar la materia prima";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
    } finally {
      setLoading(false);
    }
  };

  const actualizarStock = async (id: number, nuevaCantidad: number) => {
    // wrapper que crea un lote mínimo para ajustar stock
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const lote: Partial<LoteMateriaPrima> = {
        cantidad: nuevaCantidad,
        costoUnitario: 0,
        fechaCompra: new Date().toISOString().split("T")[0],
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas/${id}/lotes`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(lote),
        }
      );

      if (!response.ok)
        throw new Error(`Error al crear lote: ${response.status}`);

      await cargarMaterias();
      toast.success("Stock actualizado exitosamente", "Éxito");
    } catch (err) {
      console.error("Error al crear lote:", err);
      const errorMsg = "Error al crear lote para actualizar stock";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    materias,
    loading,
    error,
    cargarMaterias,
    crearMateria,
    actualizarMateria,
    actualizarStock,
    eliminarMateria,
    clearError,
    setOnMateriaCreated: (callback: (() => Promise<void>) | null) =>
      setOnMateriaCreated(callback),
  };
}
