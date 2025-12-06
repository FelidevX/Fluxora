"use client";

import { useState, useEffect } from "react";
import { RecetaMaestra, RecetaMaestraDTO } from "@/types/produccion";
import { useToast } from "@/hooks/useToast";

// Helper para obtener el token normalizado
const getAuthToken = (): string => {
  let token = localStorage.getItem("auth_token");
  if (token?.startsWith("Bearer ")) {
    token = token.substring(7);
  }
  return token || "";
};

export function useRecetas() {
  const [recetas, setRecetas] = useState<RecetaMaestra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Cargar recetas de la API al inicializar
  useEffect(() => {
    fetchRecetas();
  }, []);

  const fetchRecetas = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/recetas-maestras`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      const recetasData = JSON.parse(responseText);
      setRecetas(recetasData);
    } catch (err) {
      console.error("Error cargando recetas:", err);
      const errorMsg = "Error cargando recetas de la base de datos";
      setError(errorMsg);
      toast.error(errorMsg, "Error al cargar recetas");
    } finally {
      setLoading(false);
    }
  };

  const crearReceta = async (nuevaReceta: RecetaMaestraDTO) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/recetas-maestras`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(nuevaReceta),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const recetaCreada = await response.json();
      console.log("Receta creada:", recetaCreada);

      // Recargar toda la lista para asegurar consistencia
      await fetchRecetas();
      toast.success("Receta creada exitosamente", "Éxito");

      return recetaCreada;
    } catch (err) {
      console.error("Error creando receta:", err);
      const errorMsg = "Error guardando la receta en la base de datos";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarReceta = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/recetas-maestras/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar la lista local
      setRecetas((prev) => prev.filter((r) => r.id !== id));
      toast.success("Receta eliminada exitosamente", "Éxito");
    } catch (err) {
      console.error("Error eliminando receta:", err);
      const errorMsg = "Error eliminando receta de la base de datos";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const actualizarReceta = async (
    id: number,
    recetaActualizada: RecetaMaestraDTO
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/recetas-maestras/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(recetaActualizada),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const recetaActualizadaResponse = await response.json();

      // Recargar toda la lista para asegurar consistencia
      await fetchRecetas();
      toast.success("Receta actualizada exitosamente", "Éxito");
      
      return recetaActualizadaResponse;
    } catch (err) {
      console.error("Error actualizando receta:", err);
      const errorMsg = "Error actualizando receta en la base de datos";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleRecetaActiva = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/recetas-maestras/${id}/toggle-activa`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar la lista local
      setRecetas((prev) =>
        prev.map((receta) =>
          receta.id === id ? { ...receta, activa: !receta.activa } : receta
        )
      );
      toast.success("Estado de receta actualizado exitosamente", "Éxito");
    } catch (err) {
      console.error("Error cambiando estado de receta:", err);
      const errorMsg = "Error cambiando estado de receta";
      setError(errorMsg);
      toast.error(errorMsg, "Error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const cargarRecetas = () => {
    fetchRecetas();
  };

  return {
    recetas,
    loading,
    error,
    crearReceta,
    eliminarReceta,
    actualizarReceta,
    toggleRecetaActiva,
    clearError,
    cargarRecetas,
  };
}
