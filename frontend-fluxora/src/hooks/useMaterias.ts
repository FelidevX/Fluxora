import { useState, useCallback, useEffect } from "react";

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

  const cargarMaterias = useCallback(async () => {
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
  }, []);

  // Cargar materias automáticamente al montar el componente
  useEffect(() => {
    cargarMaterias();
  }, [cargarMaterias]);

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

      // Disparar callback si está configurado (para verificación de recetas)
      if (onMateriaCreated) {
        await onMateriaCreated();
      }
    } catch (err) {
      console.error("Error al crear materia prima:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear la materia prima"
      );
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

      const response = await fetch(
        `http://localhost:8080/api/inventario/materias-primas/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(materia),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error al actualizar materia prima: ${response.status}`
        );
      }

      await cargarMaterias(); // Recargar la lista después de actualizar
    } catch (err) {
      console.error("Error al actualizar materia prima:", err);
      setError("Error al actualizar la materia prima");
    } finally {
      setLoading(false);
    }
  };

  const actualizarStock = async (id: number, nuevaCantidad: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/inventario/materias-primas/${id}/stock?cantidad=${nuevaCantidad}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error al actualizar stock: ${response.status}`);
      }

      await cargarMaterias(); // Recargar la lista después de actualizar
    } catch (err) {
      console.error("Error al actualizar stock:", err);
      setError("Error al actualizar el stock");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

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
