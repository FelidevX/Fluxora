"use client";

import { useState, useEffect } from "react";
import { useProductos } from "@/hooks/useProductos";
import { useMaterias } from "@/hooks/useMaterias";
import { useRecetas } from "@/hooks/useRecetas";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Badge from "@/components/ui/Badge";

interface Alerta {
  id: string;
  tipo: "stock_bajo" | "sin_receta" | "materia_agotada" | "producto_vencido";
  titulo: string;
  mensaje: string;
  prioridad: "alta" | "media" | "baja";
  timestamp: Date;
}

export default function AlertasNotificaciones() {
  const { productos } = useProductos();
  const { materias, cargarMaterias } = useMaterias();
  const { recetas } = useRecetas();

  const [alertas, setAlertas] = useState<Alerta[]>([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarMaterias();
  }, []); // Sin dependencias para evitar loops
  useEffect(() => {
    // Solo generar alertas si tenemos datos completos
    if (materias.length === 0) {
      return;
    }

    const nuevasAlertas: Alerta[] = [];

    // Alertas de stock bajo en materias primas
    materias.forEach((materia) => {
      if (materia.cantidad < 5) {
        nuevasAlertas.push({
          id: `stock-materia-${materia.id}`,
          tipo: "stock_bajo",
          titulo: "Stock Bajo - Materia Prima",
          mensaje: `${materia.nombre}: solo quedan ${materia.cantidad} ${materia.unidad}`,
          prioridad: materia.cantidad < 2 ? "alta" : "media",
          timestamp: new Date(),
        });
      }
    });

    // Alertas de stock bajo en productos
    productos.forEach((producto) => {
      if (producto.cantidad < 5) {
        nuevasAlertas.push({
          id: `stock-producto-${producto.id}`,
          tipo: "stock_bajo",
          titulo: "Stock Bajo - Producto",
          mensaje: `${producto.nombre}: solo quedan ${producto.cantidad} unidades`,
          prioridad: producto.cantidad < 2 ? "alta" : "media",
          timestamp: new Date(),
        });
      }
    });

    // Alertas de materias primas agotadas (cantidad = 0)
    materias.forEach((materia) => {
      if (materia.cantidad === 0) {
        nuevasAlertas.push({
          id: `agotado-${materia.id}`,
          tipo: "materia_agotada",
          titulo: "Materia Prima Agotada",
          mensaje: `${materia.nombre} está completamente agotada`,
          prioridad: "alta",
          timestamp: new Date(),
        });
      }
    });

    // Verificar qué recetas no se pueden hacer por falta de ingredientes
    recetas.forEach((receta) => {
      const faltantes = receta.ingredientes.filter((ing) => {
        const materia = materias.find((m) => m.id === ing.materiaPrimaId);
        return !materia || materia.cantidad < ing.cantidadNecesaria;
      });

      if (faltantes.length > 0) {
        nuevasAlertas.push({
          id: `sin-receta-${receta.id}`,
          tipo: "sin_receta",
          titulo: "Receta No Disponible",
          mensaje: `${receta.nombre}: faltan ${faltantes.length} ingrediente(s)`,
          prioridad: "baja",
          timestamp: new Date(),
        });
      }
    });

    setAlertas(nuevasAlertas);
  }, [productos, materias, recetas]);

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "danger";
      case "media":
        return "warning";
      case "baja":
        return "info";
      default:
        return "info";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "stock_bajo":
        return "inventory_2";
      case "sin_receta":
        return "restaurant_menu";
      case "materia_agotada":
        return "error";
      case "producto_vencido":
        return "schedule";
      default:
        return "info";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MaterialIcon
            name="notifications"
            className="w-6 h-6 text-orange-600"
          />
          <h2 className="text-xl font-semibold text-gray-900">
            Alertas y Notificaciones
          </h2>
        </div>
        <Badge variant={alertas.length > 0 ? "danger" : "success"}>
          {alertas.length} alerta(s)
        </Badge>
      </div>

      {alertas.length === 0 ? (
        <div className="text-center py-8">
          <MaterialIcon
            name="check_circle"
            className="w-16 h-16 text-green-500 mx-auto mb-3"
          />
          <p className="text-gray-600">
            ¡Todo está en orden! No hay alertas pendientes.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alertas.map((alerta) => (
                <tr key={alerta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MaterialIcon
                        name={getTipoIcon(alerta.tipo)}
                        className={`w-5 h-5 ${
                          alerta.prioridad === "alta"
                            ? "text-red-500"
                            : alerta.prioridad === "media"
                            ? "text-yellow-500"
                            : "text-blue-500"
                        }`}
                      />
                      <span className="text-sm text-gray-900">
                        {alerta.tipo.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {alerta.titulo}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {alerta.mensaje}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getPrioridadColor(alerta.prioridad) as any}>
                      {alerta.prioridad.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Ahora
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
