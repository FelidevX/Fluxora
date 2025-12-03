// Utilitario para reparar recetas con ingredientes rotos
import { MateriaPrima } from "@/types/inventario";

export interface RecetaRota {
  recetaId: number;
  recetaNombre: string;
  ingredientesRotos: {
    materiaPrimaId: number;
    materiaPrimaNombre: string;
    cantidadNecesaria: number;
    unidad: string;
    esOpcional: boolean;
  }[];
}

export interface ReparacionSugerida {
  ingredienteRoto: {
    materiaPrimaId: number;
    materiaPrimaNombre: string;
  };
  materiaEncontrada: MateriaPrima | null;
  confianza: "exacta" | "similar" | "no_encontrada";
}

/**
 * Busca materias primas por nombre (exacto o similar)
 */
export async function buscarMateriaPorNombre(
  nombre: string
): Promise<MateriaPrima[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas/buscar/${encodeURIComponent(
        nombre
      )}`
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error buscando materia prima:", error);
    return [];
  }
}

/**
 * Encuentra similitudes entre nombres de materias primas
 */
export function encontrarSimilitud(nombre1: string, nombre2: string): number {
  const s1 = nombre1.toLowerCase().trim();
  const s2 = nombre2.toLowerCase().trim();

  if (s1 === s2) return 1.0; // Exacto

  // Buscar palabras comunes
  const palabras1 = s1.split(/\s+/);
  const palabras2 = s2.split(/\s+/);

  let coincidencias = 0;
  for (const palabra1 of palabras1) {
    for (const palabra2 of palabras2) {
      if (
        palabra1 === palabra2 ||
        palabra1.includes(palabra2) ||
        palabra2.includes(palabra1)
      ) {
        coincidencias++;
        break;
      }
    }
  }

  const similitud =
    coincidencias / Math.max(palabras1.length, palabras2.length);

  return similitud;
}

/**
 * Genera sugerencias de reparación para ingredientes rotos
 */
export async function generarSugerenciasReparacion(
  ingredientesRotos: any[],
  todasLasMaterias: MateriaPrima[]
): Promise<ReparacionSugerida[]> {
  const sugerencias: ReparacionSugerida[] = [];

  for (const ingrediente of ingredientesRotos) {
    const nombreBuscado = ingrediente.materiaPrimaNombre;

    // 1. Buscar exacto en la API
    const materiasEncontradas = await buscarMateriaPorNombre(nombreBuscado);

    if (materiasEncontradas.length > 0) {
      sugerencias.push({
        ingredienteRoto: {
          materiaPrimaId: ingrediente.materiaPrimaId,
          materiaPrimaNombre: ingrediente.materiaPrimaNombre,
        },
        materiaEncontrada: materiasEncontradas[0],
        confianza: "exacta",
      });
      continue;
    }

    // 2. Buscar similar en todas las materias
    let mejorCoincidencia: MateriaPrima | null = null;
    let mejorSimilitud = 0;

    for (const materia of todasLasMaterias) {
      const similitud = encontrarSimilitud(nombreBuscado, materia.nombre);
      if (similitud > mejorSimilitud && similitud > 0.6) {
        // 60% de similitud mínima
        mejorSimilitud = similitud;
        mejorCoincidencia = materia;
      }
    }

    sugerencias.push({
      ingredienteRoto: {
        materiaPrimaId: ingrediente.materiaPrimaId,
        materiaPrimaNombre: ingrediente.materiaPrimaNombre,
      },
      materiaEncontrada: mejorCoincidencia,
      confianza: mejorCoincidencia ? "similar" : "no_encontrada",
    });
  }

  return sugerencias;
}

/**
 * Aplica las reparaciones sugeridas a una receta
 */
export async function aplicarReparaciones(
  recetaId: number,
  reparaciones: { ingredienteOriginalId: number; nuevoMateriaPrimaId: number }[]
): Promise<boolean> {
  try {
    // Aquí iría la llamada a la API para actualizar la receta
    // Por ahora, solo simulamos el éxito
    // TODO: Implementar la llamada real a la API cuando esté disponible
    // const response = await fetch(`/api/recetas/${recetaId}/reparar-ingredientes`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ reparaciones })
    // });

    return true;
  } catch (error) {
    console.error("Error aplicando reparaciones:", error);
    return false;
  }
}

/**
 * Repara automáticamente una receta reemplazando ingredientes rotos con similares
 */
export async function repararRecetaAutomaticamente(
  receta: any,
  todasLasMaterias: MateriaPrima[],
  umbralSimilitud: number = 0.7
): Promise<{
  reparada: boolean;
  cambiosRealizados: Array<{
    ingredienteOriginal: string;
    ingredienteNuevo: string;
    similitud: number;
  }>;
  recetaActualizada: any;
}> {
  const cambiosRealizados: Array<{
    ingredienteOriginal: string;
    ingredienteNuevo: string;
    similitud: number;
  }> = [];

  const recetaActualizada = { ...receta };
  let reparada = false;

  // Verificar si la receta tiene ingredientes
  if (!receta.ingredientes || !Array.isArray(receta.ingredientes)) {
    return {
      reparada: false,
      cambiosRealizados: [],
      recetaActualizada: receta,
    };
  }

  // Verificar cada ingrediente
  for (let i = 0; i < recetaActualizada.ingredientes.length; i++) {
    const ingrediente = recetaActualizada.ingredientes[i];
    const nombreBuscado = ingrediente.materiaPrimaNombre;

    // 1. Verificar si el ingrediente existe en las materias primas actuales
    const materiaExistente = todasLasMaterias.find(
      (m) => m.id === ingrediente.materiaPrimaId
    );

    if (materiaExistente) {
      continue;
    }

    // 2. Buscar similitud automática
    let mejorCoincidencia: MateriaPrima | null = null;
    let mejorSimilitud = 0;

    for (const materia of todasLasMaterias) {
      const similitud = encontrarSimilitud(nombreBuscado, materia.nombre);

      if (similitud > mejorSimilitud && similitud >= umbralSimilitud) {
        mejorSimilitud = similitud;
        mejorCoincidencia = materia;
      }
    }

    // 3. Aplicar el reemplazo automático si se encuentra una buena coincidencia
    if (mejorCoincidencia && mejorSimilitud >= umbralSimilitud) {
      recetaActualizada.ingredientes[i] = {
        ...ingrediente,
        materiaPrimaId: mejorCoincidencia.id,
        materiaPrimaNombre: mejorCoincidencia.nombre,
      };

      cambiosRealizados.push({
        ingredienteOriginal: nombreBuscado,
        ingredienteNuevo: mejorCoincidencia.nombre,
        similitud: mejorSimilitud,
      });

      reparada = true;
    }
    // NOTA: Si no se encuentra reemplazo, dejamos el ingrediente como está
    // para que el usuario pueda decidir qué hacer manualmente
  }

  return {
    reparada,
    cambiosRealizados,
    recetaActualizada,
  };
}

/**
 * Repara automáticamente todas las recetas que tienen ingredientes rotos
 */
export async function repararTodasLasRecetasAutomaticamente(
  todasLasMaterias: MateriaPrima[],
  umbralSimilitud: number = 0.7
): Promise<{
  recetasReparadas: number;
  totalCambios: number;
  detalles: Array<{
    recetaId: number;
    recetaNombre: string;
    cambios: Array<{
      ingredienteOriginal: string;
      ingredienteNuevo: string;
      similitud: number;
    }>;
  }>;
}> {
  try {
    // Obtener todas las recetas de la API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/recetas-maestras`
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const recetas = await response.json();

    if (!recetas || recetas.length === 0) {
      return { recetasReparadas: 0, totalCambios: 0, detalles: [] };
    }

    const detalles: any[] = [];
    let recetasReparadas = 0;
    let totalCambios = 0;

    for (const receta of recetas) {
      const resultado = await repararRecetaAutomaticamente(
        receta,
        todasLasMaterias,
        umbralSimilitud
      );

      if (resultado.reparada) {
        recetasReparadas++;
        totalCambios += resultado.cambiosRealizados.length;

        detalles.push({
          recetaId: receta.id,
          recetaNombre: receta.nombre,
          cambios: resultado.cambiosRealizados,
        });

        // Actualizar la receta en la base de datos
        const updateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/recetas-maestras/${receta.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: resultado.recetaActualizada.nombre,
              descripcion: resultado.recetaActualizada.descripcion,
              categoria: resultado.recetaActualizada.categoria,
              unidadBase: resultado.recetaActualizada.unidadBase,
              cantidadBase: resultado.recetaActualizada.cantidadBase,
              precioUnidad: resultado.recetaActualizada.precioUnidad,
              tiempoPreparacion: resultado.recetaActualizada.tiempoPreparacion,
              ingredientes: resultado.recetaActualizada.ingredientes.map(
                (ing: any) => ({
                  materiaPrimaId: ing.materiaPrimaId,
                  materiaPrimaNombre: ing.materiaPrimaNombre,
                  cantidadNecesaria: ing.cantidadNecesaria,
                  unidad: ing.unidad,
                  esOpcional: ing.esOpcional,
                  notas: ing.notas,
                })
              ),
            }),
          }
        );

        if (!updateResponse.ok) {
          console.error(
            `Error actualizando receta ${receta.id}:`,
            updateResponse.statusText
          );
        }
      }
    }

    return {
      recetasReparadas,
      totalCambios,
      detalles,
    };
  } catch (error) {
    console.error("Error reparando recetas automáticamente:", error);
    return { recetasReparadas: 0, totalCambios: 0, detalles: [] };
  }
}
