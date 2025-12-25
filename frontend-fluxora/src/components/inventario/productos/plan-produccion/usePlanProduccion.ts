import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { obtenerPlanProduccion } from "@/services/api/entregas";
import type { ProgramacionEntrega, ProductoAgrupado } from "./types";

export function usePlanProduccion() {
  const [programaciones, setProgramaciones] = useState<ProgramacionEntrega[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [clientesMap, setClientesMap] = useState<Map<number, string>>(
    new Map()
  );
  const [rutasMap, setRutasMap] = useState<Map<number, string>>(new Map());
  const [unidadesMap, setUnidadesMap] = useState<Map<string, string>>(
    new Map()
  );

  const { error: showError } = useToast();

  useEffect(() => {
    cargarPlanProduccion();
  }, []);

  const cargarPlanProduccion = async () => {
    try {
      setLoading(true);

      // Calcular fecha de mañana
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaManana = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

      // Usar fetch del servicio para obtener el plan de producción
      const data = await obtenerPlanProduccion(fechaManana);

      const productosData = data.productos || [];

      // Crear los maps para compatibilidad con el código existente
      const rutasTemp = new Map<number, string>();
      const clientesTemp = new Map<number, string>();
      const unidadesTemp = new Map<string, string>();

      // Procesar productos y extraer unidades
      productosData.forEach((producto: any) => {
        unidadesTemp.set(producto.nombreProducto, producto.unidadMedida);
      });

      const programacionesPlanas: ProgramacionEntrega[] = [];
      let idCounter = 0;

      productosData.forEach((producto: any) => {
        producto.clientes.forEach((cliente: any) => {
          const uniqueId = idCounter++;

          programacionesPlanas.push({
            id: uniqueId,
            id_ruta: uniqueId,
            id_cliente: uniqueId,
            fecha_programada: fechaManana,
            nombreProducto: producto.nombreProducto,
            unidadMedida: producto.unidadMedida,
            cantidadProducto: cliente.cantidad,
            estado: "PENDIENTE",
          });

          clientesTemp.set(uniqueId, cliente.nombreCliente);
          rutasTemp.set(uniqueId, cliente.ruta);
        });
      });

      setProgramaciones(programacionesPlanas);
      setClientesMap(clientesTemp);
      setRutasMap(rutasTemp);
      setUnidadesMap(unidadesTemp);
    } catch (err) {
      console.error("Error al cargar plan de producción:", err);
      showError(
        err instanceof Error ? err.message : "Error al cargar datos",
        "Error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Agrupar productos por nombre y sumar cantidades
  const productosAgrupados: ProductoAgrupado[] = programaciones.reduce(
    (acc: ProductoAgrupado[], prog) => {
      if (!prog.nombreProducto || !prog.cantidadProducto) return acc;

      const existente = acc.find(
        (p) => p.nombreProducto === prog.nombreProducto
      );

      const nombreCliente = clientesMap.get(prog.id_cliente) || "Sin nombre";
      const nombreRuta = rutasMap.get(prog.id_ruta) || "Sin ruta";
      const unidadMedida = unidadesMap.get(prog.nombreProducto) || "Kg";

      if (existente) {
        existente.cantidadTotal += prog.cantidadProducto;
        existente.clientes.push({
          nombreCliente,
          cantidad: prog.cantidadProducto,
          ruta: nombreRuta,
        });
      } else {
        acc.push({
          nombreProducto: prog.nombreProducto,
          unidadMedida: unidadMedida,
          cantidadTotal: prog.cantidadProducto,
          clientes: [
            {
              nombreCliente,
              cantidad: prog.cantidadProducto,
              ruta: nombreRuta,
            },
          ],
        });
      }

      return acc;
    },
    []
  );

  // Ordenar por cantidad total descendente
  productosAgrupados.sort((a, b) => b.cantidadTotal - a.cantidadTotal);

  // Calcular totales
  const totalKg = productosAgrupados.reduce(
    (sum, p) => sum + p.cantidadTotal,
    0
  );

  return {
    loading,
    programaciones,
    productosAgrupados,
    totalKg,
  };
}
