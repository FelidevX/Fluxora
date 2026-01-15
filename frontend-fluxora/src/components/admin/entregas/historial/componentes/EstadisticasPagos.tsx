"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

interface Ruta {
  id: number;
  id_driver: number;
  fecha: string;
  kg_corriente: number;
  kg_especial: number;
  corriente_devuelto: number;
  especial_devuelto: number;
  hora_retorno: string | null;
  pagado: boolean;
  fecha_pago: string | null;
  monto_total: number;
}

interface EstadisticasPagosProps {
  rutas: Ruta[];
  getNombreDriver: (id: number) => string;
}

export function EstadisticasPagos({
  rutas,
  getNombreDriver,
}: EstadisticasPagosProps) {
  const [fechaInicio, setFechaInicio] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0]
  );
  const [fechaFin, setFechaFin] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [totalDineroPagado, setTotalDineroPagado] = useState<number>(0);
  const [calculando, setCalculando] = useState(false);

  const rutasFiltradas = useMemo(() => {
    return rutas.filter((ruta) => {
      const fechaRuta = new Date(ruta.fecha);
      const inicio = new Date(fechaInicio + "T00:00:00");
      const fin = new Date(fechaFin + "T23:59:59");
      return fechaRuta >= inicio && fechaRuta <= fin;
    });
  }, [rutas, fechaInicio, fechaFin]);

  // Calcular total de dinero pagado desde los detalles de entrega
  useEffect(() => {
    const calcularTotalPagado = async () => {
      setCalculando(true);
      try {
        const rutasPagadas = rutasFiltradas.filter((r) => r.pagado);
        let total = 0;

        const token = localStorage
          .getItem("auth_token")
          ?.replace("Bearer ", "");
        if (!token) return;

        for (const ruta of rutasPagadas) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/pedido/${ruta.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const detalles = await response.json();
              const totalRuta = detalles.reduce(
                (acc: number, detalle: any) => acc + (detalle.monto_total || 0),
                0
              );
              total += totalRuta;
            }
          } catch (error) {
            console.error(
              `Error obteniendo detalles de ruta ${ruta.id}:`,
              error
            );
          }
        }

        setTotalDineroPagado(total);
      } catch (error) {
        console.error("Error calculando total pagado:", error);
      } finally {
        setCalculando(false);
      }
    };

    calcularTotalPagado();
  }, [rutasFiltradas]);

  const estadisticas = useMemo(() => {
    const totalRutas = rutasFiltradas.length;
    const rutasPagadas = rutasFiltradas.filter((r) => r.pagado).length;
    const rutasPendientes = totalRutas - rutasPagadas;
    const porcentajePagado =
      totalRutas > 0 ? (rutasPagadas / totalRutas) * 100 : 0;

    // Agrupar por conductor
    const porConductor = rutasFiltradas.reduce((acc, ruta) => {
      const nombre = getNombreDriver(ruta.id_driver);
      if (!acc[nombre]) {
        acc[nombre] = { total: 0, pagadas: 0, pendientes: 0 };
      }
      acc[nombre].total++;
      if (ruta.pagado) {
        acc[nombre].pagadas++;
      } else {
        acc[nombre].pendientes++;
      }
      return acc;
    }, {} as Record<string, { total: number; pagadas: number; pendientes: number }>);

    // Pagos por mes
    const porMes = rutasFiltradas.reduce((acc, ruta) => {
      if (ruta.pagado && ruta.fecha_pago) {
        const mes = new Date(ruta.fecha_pago).toLocaleDateString("es-CL", {
          year: "numeric",
          month: "long",
        });
        acc[mes] = (acc[mes] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRutas,
      rutasPagadas,
      rutasPendientes,
      porcentajePagado,
      porConductor,
      porMes,
    };
  }, [rutasFiltradas, getNombreDriver]);

  const rutasPagadasOrdenadas = useMemo(() => {
    return rutasFiltradas
      .filter((r) => r.pagado)
      .sort(
        (a, b) =>
          new Date(b.fecha_pago!).getTime() - new Date(a.fecha_pago!).getTime()
      );
  }, [rutasFiltradas]);

  return (
    <div className="space-y-6">
      {/* Selector de rango de fechas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <MaterialIcon name="date_range" className="text-blue-600 text-xl" />
            <span className="text-sm font-semibold text-gray-700">
              Rango de fechas:
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">
                Desde:
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">
                Hasta:
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Total Rutas
              </p>
              <p className="text-3xl font-bold text-blue-600">
                <AnimatedNumber value={estadisticas.totalRutas} />
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <MaterialIcon name="route" className="text-blue-600 text-2xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium mb-1">Pagadas</p>
              <p className="text-3xl font-bold text-blue-600">
                <AnimatedNumber value={estadisticas.rutasPagadas} />
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <MaterialIcon
                name="check_circle"
                className="text-blue-600 text-2xl"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Pendientes
              </p>
              <p className="text-3xl font-bold text-blue-600">
                <AnimatedNumber value={estadisticas.rutasPendientes} />
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <MaterialIcon name="pending" className="text-blue-600 text-2xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium mb-1">% Pagado</p>
              <p className="text-3xl font-bold text-blue-600">
                <AnimatedNumber
                  value={estadisticas.porcentajePagado}
                  decimals={0}
                />
                %
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <MaterialIcon
                name="pie_chart"
                className="text-blue-600 text-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Total recaudado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-lg">
              <MaterialIcon name="payments" className="text-4xl" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                Total Pagado en el Rango
              </p>
              {calculando ? (
                <p className="text-2xl font-bold">Calculando...</p>
              ) : (
                <p className="text-4xl font-bold">
                  ${totalDineroPagado.toLocaleString("es-CL")}
                </p>
              )}
              <p className="text-blue-200 text-xs mt-1">
                Basado en {estadisticas.rutasPagadas} ruta
                {estadisticas.rutasPagadas !== 1 ? "s" : ""} pagada
                {estadisticas.rutasPagadas !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico por conductor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <MaterialIcon name="person" className="text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">
              Estado por Conductor
            </h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(estadisticas.porConductor).map(
              ([nombre, stats]) => (
                <div
                  key={nombre}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {nombre}
                    </span>
                    <span className="text-xs text-gray-500">
                      {stats.total} rutas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1 text-green-600">
                      <MaterialIcon name="check_circle" className="text-base" />
                      <span>{stats.pagadas} pagadas</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-600">
                      <MaterialIcon name="pending" className="text-base" />
                      <span>{stats.pendientes} pendientes</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(stats.pagadas / stats.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )
            )}
            {Object.keys(estadisticas.porConductor).length === 0 && (
              <p className="text-gray-500 text-center py-8 text-sm">
                No hay datos disponibles
              </p>
            )}
          </div>
        </motion.div>

        {/* Pagos recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <MaterialIcon name="history" className="text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">
              Pagos Recientes
            </h3>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {rutasPagadasOrdenadas.slice(0, 10).map((ruta) => (
              <div
                key={ruta.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {getNombreDriver(ruta.id_driver)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Ruta del{" "}
                      {new Date(ruta.fecha).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <MaterialIcon name="check_circle" className="text-base" />
                      <span className="text-xs font-medium">Pagado</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {ruta.fecha_pago &&
                        new Date(ruta.fecha_pago).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {rutasPagadasOrdenadas.length === 0 && (
              <p className="text-gray-500 text-center py-8 text-sm">
                No hay pagos registrados
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Gráfico de tendencia mensual */}
      {Object.keys(estadisticas.porMes).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <MaterialIcon name="trending_up" className="text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">
              Pagos por Mes
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(estadisticas.porMes)
              .sort((a, b) => b[1] - a[1])
              .map(([mes, cantidad]) => {
                const maxCantidad = Math.max(
                  ...Object.values(estadisticas.porMes)
                );
                const porcentaje = (cantidad / maxCantidad) * 100;
                return (
                  <div key={mes}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {mes}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {cantidad} pago{cantidad !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
