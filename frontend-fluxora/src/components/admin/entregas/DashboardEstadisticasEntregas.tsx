"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MaterialIcon from "@/components/ui/MaterialIcon";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { useHistorialEntregas } from "@/hooks/useHistorialEntregas";

interface RutaActiva {
  id: number;
  nombre: string;
  progreso: number;
  id_driver: number;
  entregasCompletadas: number;
}

interface DetalleEntregaExtendido {
  id: number;
  id_pedido: number;
  id_cliente: number;
  hora_entregada: string;
  corriente_entregado: number;
  especial_entregado: number;
  comentario: string;
  cliente_nombre?: string;
  driver_nombre?: string;
}

export default function DashboardEstadisticasEntregas() {
  const { entregas, drivers, clientes, loading, getNombreDriver } =
    useHistorialEntregas();
  const [rutasActivas, setRutasActivas] = useState<RutaActiva[]>([]);
  const [rutasPorFecha, setRutasPorFecha] = useState<any[]>([]);
  const [entregasDetalladas, setEntregasDetalladas] = useState<
    DetalleEntregaExtendido[]
  >([]);
  const [loadingRutas, setLoadingRutas] = useState(false);

  const getAuthToken = () => {
    let token = localStorage.getItem("auth_token");
    if (!token) return null;
    if (token.startsWith("Bearer ")) {
      token = token.substring(7);
    }
    return token;
  };

  const fetchRutasActivas = async () => {
    setLoadingRutas(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const hoy = new Date().toISOString().split("T")[0];

      // Obtener rutas activas
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-activas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRutasActivas(data || []);
      }

      // Obtener rutas programadas por fecha (tiene los totales de kg)
      const rutasPorFechaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-por-fecha/${hoy}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (rutasPorFechaResponse.ok) {
        const rutasFecha = await rutasPorFechaResponse.json();
        setRutasPorFecha(rutasFecha || []);
      }
    } catch (error) {
      console.error("Error al obtener rutas activas:", error);
      setRutasActivas([]);
      setRutasPorFecha([]);
    } finally {
      setLoadingRutas(false);
    }
  };

  const fetchTodasLasEntregas = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/entregas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const entregasConInfo = data.map((entrega: any) => {
          const cliente = clientes.find((c) => c.id === entrega.id_cliente);
          const driver = drivers.find((d) =>
            entregas.some(
              (e) => e.id === entrega.id_pedido && e.id_driver === d.id
            )
          );

          return {
            ...entrega,
            cliente_nombre: cliente?.nombre || "Cliente desconocido",
            driver_nombre: driver?.nombre || "Driver desconocido",
          };
        });
        setEntregasDetalladas(entregasConInfo);
      }
    } catch (error) {
      console.error("Error al obtener entregas:", error);
      setEntregasDetalladas([]);
    }
  };

  useEffect(() => {
    fetchRutasActivas();
    if (clientes.length > 0 && drivers.length > 0) {
      fetchTodasLasEntregas();
    }
  }, [clientes, drivers]);

  const hoy = new Date().toISOString().split("T")[0];

  // Entregas programadas hoy = total de clientes en todas las rutas del día
  const totalEntregasProgramadasHoy = rutasPorFecha.reduce((acc, ruta) => {
    return acc + (ruta.totalClientes || 0);
  }, 0);

  // Entregas completadas hoy = entregas detalladas del día
  const entregasCompletadasHoy = entregasDetalladas.filter((e) =>
    e.hora_entregada.startsWith(hoy)
  );

  // Para las estadísticas generales (mantener compatibilidad)
  const entregasHoy = entregas.filter((e) => e.fecha === hoy);

  // IMPORTANTE: rutasActivas NO tienen campo fecha, son las rutas activas en tiempo real
  // Solo contamos las que tienen progreso < 100 (no completadas)
  const rutasActivasReales = rutasActivas.filter((r) => r.progreso < 100);
  const rutasCompletadasReales = rutasActivas.filter((r) => r.progreso === 100);

  // Para saber qué rutas tienen kg, usamos rutasPorFecha (que tiene totalKgCorriente y totalKgEspecial)
  const rutasActivasConKg = rutasActivasReales.filter((rActiva) => {
    const rutaConKg = rutasPorFecha.find((rf) => rf.ruta.id === rActiva.id);
    const tieneKg =
      rutaConKg &&
      ((rutaConKg.totalKgCorriente || 0) > 0 ||
        (rutaConKg.totalKgEspecial || 0) > 0);
    return tieneKg;
  });

  const totalRutasActivas = rutasActivas.length; // Total de rutas (activas + completadas)

  const totalEntregas = entregas.length;
  const entregasConRetorno = entregas.filter((e) => e.hora_retorno !== null);
  const entregadosPercent =
    totalEntregas > 0
      ? Math.round((entregasConRetorno.length / totalEntregas) * 100)
      : 0;

  const recentDeliveries = entregasDetalladas
    .sort(
      (a, b) =>
        new Date(b.hora_entregada).getTime() -
        new Date(a.hora_entregada).getTime()
    )
    .slice(0, 5);

  // Cálculos mejorados
  // Total KG para entregar: suma de todos los totales de las rutas del día
  const totalKgParaEntregarHoy = rutasPorFecha.reduce((acc, ruta) => {
    return acc + (ruta.totalKgCorriente || 0) + (ruta.totalKgEspecial || 0);
  }, 0);

  // Total KG entregados (de las entregas completadas)
  const totalKgEntregadosHoy = entregasDetalladas
    .filter((e) => e.hora_entregada.startsWith(hoy))
    .reduce(
      (acc, e) =>
        acc + (e.corriente_entregado || 0) + (e.especial_entregado || 0),
      0
    );

  if (loading || loadingRutas) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <MaterialIcon
            name="hourglass_empty"
            className="w-8 h-8 text-gray-400 animate-spin"
          />
          <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MaterialIcon name="local_shipping" className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Entregas - Estadísticas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                Entregas Hoy
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                <AnimatedNumber
                  value={entregasCompletadasHoy.length}
                  duration={0.8}
                  delay={0.1}
                />
                <span className="text-lg text-blue-600">
                  /{totalEntregasProgramadasHoy}
                </span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                <AnimatedNumber
                  value={
                    totalEntregasProgramadasHoy - entregasCompletadasHoy.length
                  }
                  duration={0.8}
                  delay={0.15}
                  suffix=" pendientes"
                />
              </p>
            </div>
            <div className="text-blue-600 w-12 h-12 flex items-center justify-center rounded-full bg-white/50">
              <MaterialIcon name="local_shipping" className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                Total KG Hoy
              </p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">
                <AnimatedNumber
                  value={totalKgEntregadosHoy}
                  duration={0.8}
                  delay={0.15}
                />
                <span className="text-lg text-emerald-600">
                  /{totalKgParaEntregarHoy}
                </span>
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Entregados vs Programados
              </p>
            </div>
            <div className="text-emerald-600 w-12 h-12 flex items-center justify-center rounded-full bg-white/50">
              <MaterialIcon name="scale" className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                Rutas Activas
              </p>
              <p className="text-3xl font-bold text-orange-900 mt-1">
                <AnimatedNumber
                  value={rutasActivasConKg.length}
                  duration={0.8}
                  delay={0.2}
                />
                <span className="text-lg text-orange-600">
                  /{totalRutasActivas}
                </span>
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {rutasCompletadasReales.length} completadas
              </p>
            </div>
            <div className="text-orange-600 w-12 h-12 flex items-center justify-center rounded-full bg-white/50">
              <MaterialIcon name="alt_route" className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Últimas entregas registradas
        </h3>
        {recentDeliveries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="text-center py-8 bg-gray-50 rounded-lg"
          >
            <MaterialIcon
              name="inbox"
              className="w-12 h-12 text-gray-400 mx-auto mb-2"
            />
            <p className="text-gray-600">No hay entregas registradas aún</p>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora entrega
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Corriente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentDeliveries.map((d, index) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.cliente_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(d.hora_entregada).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.corriente_entregado} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.especial_entregado} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {d.driver_nombre}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
