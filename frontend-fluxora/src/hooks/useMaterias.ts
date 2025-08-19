import { useState, useEffect } from "react";

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
  nombre: string;
  cantidad: number;
  proveedor: string;
  estado: string;
  unidad: string;
  fecha: string;
}

interface UseMateriasResult {
  materias: MateriaPrima[];
  loading: boolean;
  error: string | null;
  cargarMaterias: () => Promise<void>;
  crearMateria: (materia: MateriaPrimaDTO) => Promise<void>;
  eliminarMateria: (id: number) => Promise<void>;
  clearError: () => void;
}

export function useMaterias(): UseMateriasResult {
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarMaterias = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8080/api/inventario/materias-primas"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMaterias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar materias primas:", err);
      setError(
        "No se pudo conectar con el servidor. Verifique que el microservicio esté ejecutándose."
      );
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  };

  const crearMateria = async (materia: MateriaPrimaDTO) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8080/api/inventario/materias-primas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(materia),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Error al crear materia prima: ${response.status} - ${errorData}`
        );
      }

      await cargarMaterias(); // Recargar la lista después de crear
    } catch (err) {
      console.error("Error al crear materia prima:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear la materia prima"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarMateria = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/inventario/materias-primas/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar materia prima: ${response.status}`);
      }

      await cargarMaterias(); // Recargar la lista después de eliminar
    } catch (err) {
      console.error("Error al eliminar materia prima:", err);
      setError("Error al eliminar la materia prima");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Cargar datos al montar el hook
  useEffect(() => {
    cargarMaterias();
  }, []);

  return {
    materias,
    loading,
    error,
    cargarMaterias,
    crearMateria,
    eliminarMateria,
    clearError,
  };
}
