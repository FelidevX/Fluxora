"use client";

import { useState, useEffect } from "react";
import { RecetaMaestra, RecetaMaestraDTO } from "@/types/produccion";

const STORAGE_KEY = "fluxora_recetas";

export function useRecetas() {
  const [recetas, setRecetas] = useState<RecetaMaestra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar recetas del localStorage al inicializar
  useEffect(() => {
    try {
      const recetasGuardadas = localStorage.getItem(STORAGE_KEY);
      if (recetasGuardadas) {
        setRecetas(JSON.parse(recetasGuardadas));
      }
    } catch (err) {
      console.error("Error cargando recetas:", err);
      setError("Error cargando recetas guardadas");
    }
  }, []);

  // Guardar recetas en localStorage cuando cambien
  useEffect(() => {
    if (recetas.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recetas));
      } catch (err) {
        console.error("Error guardando recetas:", err);
        setError("Error guardando recetas");
      }
    }
  }, [recetas]);

  const crearReceta = async (nuevaReceta: RecetaMaestraDTO) => {
    try {
      setLoading(true);
      setError(null);

      const recetaCreada: RecetaMaestra = {
        id: Date.now(),
        ...nuevaReceta,
        fechaCreacion: new Date().toISOString().split("T")[0],
        activa: true,
        ingredientes: nuevaReceta.ingredientes.map((ing, index) => ({
          id: Date.now() + index,
          recetaId: Date.now(),
          materiaPrimaId: ing.materiaPrimaId,
          materiaPrimaNombre: ing.materiaPrimaNombre || "", // Usar el nombre que viene del formulario
          cantidadNecesaria: ing.cantidadNecesaria,
          unidad: ing.unidad,
          esOpcional: ing.esOpcional,
          notas: ing.notas,
        })),
      };

      setRecetas((prev) => [...prev, recetaCreada]);
      return recetaCreada;
    } catch (err) {
      setError("Error al crear receta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarReceta = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      setRecetas((prev) => prev.filter((r) => r.id !== id));

      // Si era la última receta, limpiar localStorage
      if (recetas.length === 1) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      setError("Error al eliminar receta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const cargarRecetas = () => {
    try {
      const recetasGuardadas = localStorage.getItem(STORAGE_KEY);
      if (recetasGuardadas) {
        setRecetas(JSON.parse(recetasGuardadas));
      }
    } catch (err) {
      console.error("Error cargando recetas:", err);
      setError("Error cargando recetas guardadas");
    }
  };

  return {
    recetas,
    loading,
    error,
    crearReceta,
    eliminarReceta,
    clearError,
    cargarRecetas,
  };
}
