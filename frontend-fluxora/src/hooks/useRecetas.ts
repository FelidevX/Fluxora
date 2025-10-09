"use client";

import { useState, useEffect } from "react";
import { RecetaMaestra, RecetaMaestraDTO } from "@/types/produccion";

export function useRecetas() {
  const [recetas, setRecetas] = useState<RecetaMaestra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar recetas de la API al inicializar
  useEffect(() => {
    fetchRecetas();
  }, []);

  const fetchRecetas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8080/api/inventario/recetas-maestras"
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
      setError("Error cargando recetas de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const crearReceta = async (nuevaReceta: RecetaMaestraDTO) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8080/api/inventario/recetas-maestras",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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

      return recetaCreada;
    } catch (err) {
      console.error("Error creando receta:", err);
      setError("Error guardando la receta en la base de datos");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarReceta = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/inventario/recetas-maestras/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar la lista local
      setRecetas((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error eliminando receta:", err);
      setError("Error eliminando receta de la base de datos");
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

      const response = await fetch(
        `http://localhost:8080/api/inventario/recetas-maestras/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recetaActualizada),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const recetaActualizadaResponse = await response.json();

      // Actualizar la lista local
      setRecetas((prev) =>
        prev.map((receta) =>
          receta.id === id ? recetaActualizadaResponse : receta
        )
      );

      return recetaActualizadaResponse;
    } catch (err) {
      console.error("Error actualizando receta:", err);
      setError("Error actualizando receta en la base de datos");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleRecetaActiva = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/inventario/recetas-maestras/${id}/toggle-activa`,
        {
          method: "PATCH",
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
    } catch (err) {
      console.error("Error cambiando estado de receta:", err);
      setError("Error cambiando estado de receta");
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
