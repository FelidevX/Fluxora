"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useRecetas } from "@/hooks/useRecetas";
import { useMaterias } from "@/hooks/useMaterias";
import { 
  repararTodasLasRecetasAutomaticamente
} from "@/utils/reparacionRecetas";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export interface ReparadorRecetasRef {
  verificarYReparar: () => Promise<void>;
}

const ReparadorRecetas = forwardRef<ReparadorRecetasRef>((props, ref) => {
  const { recetas, cargarRecetas } = useRecetas();
  const { materias, cargarMaterias } = useMaterias();
  
  const [recetasRotas, setRecetasRotas] = useState<any[]>([]);
  const [reparacionAutomatica, setReparacionAutomatica] = useState({
    enProceso: false,
    resultado: null as any
  });
  const [yaVerificado, setYaVerificado] = useState(false);
  const [lastMaterialsCount, setLastMaterialsCount] = useState(0);
  const [lastRecipesCount, setLastRecipesCount] = useState(0);

  useEffect(() => {
    cargarRecetas();
    cargarMaterias();
  }, []); // Sin dependencias para evitar loops infinitos

  // Detectar recetas con ingredientes rotos y reparar automáticamente
  useEffect(() => {
    const materiasChanged = materias.length !== lastMaterialsCount;
    const recetasChanged = recetas.length !== lastRecipesCount;
    
    if (recetas.length > 0 && materias.length > 0 && 
        (!yaVerificado || materiasChanged || recetasChanged)) {
      
      const idsMateriasExistentes = new Set(materias.map(m => m.id));
      
      const rotasDetectadas = recetas.filter(receta => 
        receta.ingredientes.some(ing => !idsMateriasExistentes.has(ing.materiaPrimaId))
      ).map(receta => ({
        ...receta,
        ingredientesRotos: receta.ingredientes.filter(ing => 
          !idsMateriasExistentes.has(ing.materiaPrimaId)
        )
      }));
      
      // Usar setTimeout para evitar setState durante render
      setTimeout(() => {
        setRecetasRotas(rotasDetectadas);
        
        // Si hay recetas rotas, intentar repararlas automáticamente
        if (rotasDetectadas.length > 0) {
          repararAutomaticamente();
        }
        
        setYaVerificado(true);
        setLastMaterialsCount(materias.length);
        setLastRecipesCount(recetas.length);
      }, 0);
    }
  }, [recetas, materias]); // Removemos yaVerificado de las dependencias

  const repararAutomaticamente = async () => {
    setReparacionAutomatica({ enProceso: true, resultado: null });
    
    try {
      const resultado = await repararTodasLasRecetasAutomaticamente(materias, 0.7);
      
      // Solo mostrar resultado si se reparó algo
      if (resultado.recetasReparadas > 0) {
        setReparacionAutomatica({ 
          enProceso: false, 
          resultado 
        });
        
        // Recargar solo las recetas para reflejar los cambios
        await cargarRecetas();
        setYaVerificado(false); // Permitir nueva verificación después de reparar
      } else {
        setReparacionAutomatica({ enProceso: false, resultado: null });
      }
      
    } catch (error) {
      console.error('Error en reparación automática:', error);
      setReparacionAutomatica({ enProceso: false, resultado: null });
    }
  };

  // Función para navegar a crear materia prima con sugerencia
  const navegarACrearMateria = () => {
    // Obtener el primer ingrediente faltante como sugerencia
    const primerIngredienteFaltante = recetasRotas[0]?.ingredientesRotos[0]?.materiaPrimaNombre;
    
    // Crear la URL con los parámetros
    const params = new URLSearchParams({
      view: 'materias',
      action: 'create'
    });
    
    if (primerIngredienteFaltante) {
      params.set('suggestion', primerIngredienteFaltante);
    }
    
    const url = `/dashboard/inventario?${params.toString()}`;
    
    // Usar window.location para forzar navegación
    window.location.href = url;
  };

  // Función para disparar verificación manual (cuando se agrega materia prima)
  const verificarYReparar = async () => {
    // Usar setTimeout para evitar setState durante render
    setTimeout(() => {
      setYaVerificado(false);
    }, 0);
    // No recargar datos aquí, solo resetear para que el useEffect se ejecute nuevamente
  };

  // Exponer la función de verificación para uso externo
  useImperativeHandle(ref, () => ({
    verificarYReparar
  }));

  if (recetasRotas.length === 0 && !reparacionAutomatica.enProceso) {
    return null; // No mostrar nada si no hay problemas
  }

  return (
    <>
      {/* Indicador de proceso de reparación */}
      {reparacionAutomatica.enProceso && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">
              Verificando y reparando recetas automáticamente...
            </span>
          </div>
        </div>
      )}

      {/* Panel de ingredientes faltantes */}
      {recetasRotas.length > 0 && !reparacionAutomatica.enProceso && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MaterialIcon name="warning" className="text-amber-600" />
                <h3 className="text-amber-800 font-medium">
                  Ingredientes no disponibles en el inventario
                </h3>
              </div>
              <p className="text-amber-700 text-sm">
                {recetasRotas.length === 1 
                  ? `Añade "${recetasRotas[0].ingredientesRotos[0]?.materiaPrimaNombre}" para actualizar la receta automáticamente.`
                  : `Añade las materias primas faltantes para actualizar las ${recetasRotas.length} recetas automáticamente.`
                }
              </p>
            </div>
            <Button
              type="button"
              onClick={navegarACrearMateria}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MaterialIcon name="add" className="mr-2" />
              Añadir Materia Prima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de ingredientes faltantes */}
      {recetasRotas.length > 0 && !reparacionAutomatica.enProceso && (
        <div className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Ingredientes Faltantes Detectados
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Las siguientes recetas contienen ingredientes que no están disponibles en el inventario
              </p>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {recetasRotas.map(receta => (
                  <div key={receta.id} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <h4 className="font-medium text-amber-900 mb-3">
                      📝 {receta.nombre}
                    </h4>
                    <div className="space-y-2">
                      {receta.ingredientesRotos.map((ingrediente: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded p-2 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <MaterialIcon name="error" className="text-red-500 text-sm" />
                            <span className="text-sm font-medium text-gray-900">
                              {ingrediente.materiaPrimaNombre}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({ingrediente.cantidadNecesaria} {ingrediente.unidad})
                            </span>
                          </div>
                          {ingrediente.esOpcional && (
                            <Badge variant="warning">
                              Opcional
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de reparación */}
      {reparacionAutomatica.resultado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <MaterialIcon name="check" className="text-green-600 text-xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Reparación Completada!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Se repararon automáticamente <strong>{reparacionAutomatica.resultado.recetasReparadas}</strong> recetas 
                con <strong>{reparacionAutomatica.resultado.totalCambios}</strong> ingredientes actualizados.
              </p>
              <Button
                onClick={() => setReparacionAutomatica({ enProceso: false, resultado: null })}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ReparadorRecetas.displayName = 'ReparadorRecetas';

export default ReparadorRecetas;
