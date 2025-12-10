"use client";
import { Line } from "react-chartjs-2";
import MaterialIcon from "@/components/ui/MaterialIcon";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";
import { useMaterias } from "@/hooks/useMaterias";
import { useProductos } from "@/hooks/useProductos";
import { useCompras } from "@/hooks/useCompras";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { usePermisos } from "@/hooks/usePermisos";
import { useRouter } from "next/navigation";
import { usePlanProduccion } from "@/components/inventario/productos/plan-produccion/usePlanProduccion";
import { obtenerPlanProduccion } from "@/services/api/entregas";

// Helper para obtener el token normalizado
const getAuthToken = (): string => {
  let token = localStorage.getItem("auth_token");
  if (token?.startsWith("Bearer ")) {
    token = token.substring(7);
  }
  return token || "";
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Cliente {
  id: number;
  nombreNegocio: string;
  nombre: string;
  direccion: string;
  contacto: string;
  email: string;
  latitud: number;
  longitud: number;
  coordenadas: number[];
}

interface MateriaPrima {
  id: number;
  nombre: string;
  tipo: string;
  cantidad: number;
  proveedor: string;
  estado: string;
  unidad: string;
  fecha: string;
  fechaVencimiento: string;
}

interface EstadisticasDia {
  fecha: string;
  dia: string;
  entregas: number;
}

interface EstadisticasDashboard {
  entregasDelDia: {
    completadas: number;
    total: number;
  };
  entregasSemana: EstadisticasDia[];
  productosVendidosHoy?: number;
}

interface AlertaInventario {
  id: number;
  nombre: string;
  cantidadActual: number;
  stockMinimo: number;
  unidad: string;
  tipo: "materia" | "producto";
}

interface PlanProduccionDashboard {
  totalKg: number;
  totalProductos: number;
}

function DashboardHome() {
  const router = useRouter();
  const { user, loading } = usePermisos();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [materiaPrima, setMateriaPrima] = useState<MateriaPrima[]>([]);
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasDashboard | null>(null);
  const [alertasInventario, setAlertasInventario] = useState<
    AlertaInventario[]
  >([]);
  const [productosProximosVencer, setProductosProximosVencer] = useState(0);
  const [planProduccion, setPlanProduccion] = useState<PlanProduccionDashboard>({
    totalKg: 0,
    totalProductos: 0,
  });

  // Hooks para obtener datos reales
  const { materias } = useMaterias();
  const { productos } = useProductos();
  const { compras, cargarCompras } = useCompras();

  // pt-14: deja espacio para el botón flotante del menú en móviles
  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const response = await res.json();
      setClients(response);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setIsLoading(false);
    }
  };

  const fetchMateriasPrimas = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();

      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const response = await res.json();
      setMateriaPrima(response);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching materias primas:", error);
      setIsLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/estadisticas-dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      } else {
        throw new Error("Error al obtener las estadísticas del dashboard");
      }
    } catch (error) {
      console.error("Error fetching estadísticas:", error);
      setEstadisticas(null);
    }
  };

  const fetchPlanProduccion = async () => {
    try {
      // Calcular fecha de mañana
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const fechaManana = tomorrow.toISOString().split("T")[0];

      const data = await obtenerPlanProduccion(fechaManana);
      
      setPlanProduccion({
        totalKg: data.cantidadTotal || 0,
        totalProductos: data.totalProductos || 0,
      });
    } catch (error) {
      console.error("Error fetching plan de producción:", error);
      setPlanProduccion({ totalKg: 0, totalProductos: 0 });
    }
  };

  useEffect(() => {
    fetchClients();
    fetchMateriasPrimas();
    fetchEstadisticas();
    cargarCompras();
    fetchPlanProduccion();
  }, []);

  // Generar alertas de inventario bajo
  useEffect(() => {
    const nuevasAlertas: AlertaInventario[] = [];

    // Alertas de materias primas con stock bajo
    materias.forEach((materia) => {
      if (materia.cantidad !== undefined && materia.cantidad < 10) {
        nuevasAlertas.push({
          id: materia.id,
          nombre: materia.nombre,
          cantidadActual: materia.cantidad,
          stockMinimo: 10,
          unidad: materia.unidad,
          tipo: "materia",
        });
      }
    });

    // Alertas de productos con stock bajo
    productos.forEach((producto) => {
      if (producto.stockTotal !== undefined && producto.stockTotal < 10) {
        nuevasAlertas.push({
          id: producto.id,
          nombre: producto.nombre,
          cantidadActual: producto.stockTotal,
          stockMinimo: 10,
          unidad: "kg",
          tipo: "producto",
        });
      }
    });

    // Ordenar por cantidad actual (menor a mayor)
    nuevasAlertas.sort((a, b) => a.cantidadActual - b.cantidadActual);

    setAlertasInventario(nuevasAlertas);
  }, [materias, productos]);

  // Calcular productos próximos a vencer (próximos 10 días)
  useEffect(() => {
    const hoy = new Date();
    const proximosDias = 10;

    // Extraer todos los lotes de todas las compras
    const todosLosLotes = compras.flatMap((compra) => compra.lotes || []);

    // Filtrar lotes que tienen fecha de vencimiento y están próximos a vencer
    const lotesProximosVencer = todosLosLotes.filter((lote) => {
      if (!lote.fechaVencimiento) return false;

      const fechaVencimiento = new Date(lote.fechaVencimiento);
      const diasRestantes = Math.ceil(
        (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      return diasRestantes >= 0 && diasRestantes < proximosDias;
    });

    setProductosProximosVencer(lotesProximosVencer.length);
  }, [compras]);

  // Datos para el gráfico de entregas de la semana
  const chartData = {
    labels: estadisticas?.entregasSemana.map((d) => d.dia) || [],
    datasets: [
      {
        label: "Entregas completadas",
        data: estadisticas?.entregasSemana.map((d) => d.entregas) || [],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#2563eb",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#64748b",
          stepSize: 1,
        },
        grid: { color: "#e5e7eb" },
      },
      x: {
        ticks: { color: "#64748b" },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="p-4 md:p-6 mt-12 md:mt-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Panel de Inicio</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Resumen general</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm">{formattedDate}</span>
        </div>
      </motion.div>
      {/* KPIs y estadísticas */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Entregas del día */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-gray-500">Entregas del día</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">
              {estadisticas ? (
                <>
                  <AnimatedNumber
                    value={estadisticas.entregasDelDia.completadas}
                    duration={0.8}
                    delay={0.1}
                  />
                  /
                  <AnimatedNumber
                    value={estadisticas.entregasDelDia.total}
                    duration={0.8}
                    delay={0.1}
                  />
                </>
              ) : (
                "0/0"
              )}
            </span>
            {estadisticas && estadisticas.entregasDelDia.total > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-xs text-emerald-600"
              >
                <AnimatedNumber
                  value={Math.round(
                    (estadisticas.entregasDelDia.completadas /
                      estadisticas.entregasDelDia.total) *
                      100
                  )}
                  duration={0.8}
                  delay={0.1}
                  suffix="% completado"
                />
              </motion.span>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-gray-500">Productos vendidos</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">
              {estadisticas ? (
                <AnimatedNumber
                  value={Math.round(estadisticas.productosVendidosHoy || 0)}
                  duration={0.8}
                  delay={0.15}
                  suffix=" kg"
                />
              ) : (
                "0 kg"
              )}
            </span>
            <span className="text-xs text-emerald-600">
              {estadisticas ? "" : ""}
            </span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-gray-500">Plan de Producción</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">
              <AnimatedNumber
                value={planProduccion.totalKg}
                duration={0.8}
                delay={0.2}
                suffix=" kg"
              />
            </span>
            {planProduccion.totalKg > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="text-xs text-blue-600"
              >
                Para mañana
              </motion.span>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-gray-500">
            Productos próximos a vencer
          </p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">
              <AnimatedNumber
                value={productosProximosVencer}
                duration={0.8}
                delay={0.25}
              />
            </span>
            {productosProximosVencer > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.05 }}
                className="text-xs text-amber-600"
              >
                Próximos 10 días
              </motion.span>
            )}
          </div>
        </motion.div>
      </div>
      {/* Paneles: entregas de la semana y alertas */}
      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Entregas de la semana
            </h2>
            <MaterialIcon name="analytics" className="text-green-400" />
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Entregas completadas en los últimos 7 días
          </p>
          {/* Gráfico de entregas de la semana */}
          <div
            className="mt-4 flex justify-center items-center w-full"
            style={{ minHeight: "220px" }}
          >
            {estadisticas ? (
              <div style={{ width: "100%", maxWidth: 600 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-400">No se encontraron estadisticas</p>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Alerta de inventario bajo
            </h2>
            <span className="text-xs rounded-full bg-rose-50 px-2 py-1 text-rose-700">
              <AnimatedNumber
                value={alertasInventario.length}
                duration={0.8}
                delay={0.35}
                suffix={` producto${alertasInventario.length !== 1 ? "s" : ""}`}
              />
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Productos que requieren reabastecimiento
          </p>
          <div className="mt-3 divide-y divide-gray-100">
            {alertasInventario.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No hay productos con inventario bajo
              </div>
            ) : (
              alertasInventario.slice(0, 5).map((alerta, index) => {
                const porcentaje = Math.round(
                  (alerta.cantidadActual / alerta.stockMinimo) * 100
                );
                return (
                  <motion.div
                    key={`${alerta.tipo}-${alerta.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-gray-700">{alerta.nombre}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">
                        A: {alerta.cantidadActual.toFixed(1)} {alerta.unidad}
                      </span>
                      <span className="text-gray-500">
                        M: {alerta.stockMinimo} {alerta.unidad}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                        {porcentaje}%
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Clientes recientes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className=" bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Clientes recientes
            </h2>
            <MaterialIcon name="person_add" className="text-green-400" />
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Últimos clientes registrados en el sistema
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      Cargando clientes...
                    </td>
                  </tr>
                ) : clients.length > 0 ? (
                  clients
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 5)
                    .map((cliente, index) => (
                      <motion.tr
                        key={cliente.email || cliente.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {cliente.nombre}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {cliente.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {cliente.contacto}
                        </td>
                      </motion.tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No hay clientes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        {/* Próximas facturas a pagar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Próximas facturas a pagar
            </h2>
            <MaterialIcon name="receipt_long" className="text-amber-400" />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Facturas pendientes de pago próximas a vencer
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Documento
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de pago
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      Cargando facturas...
                    </td>
                  </tr>
                ) : compras.length > 0 ? (
                  compras
                    .filter(
                      (compra) =>
                        compra.fechaPago && compra.estadoPago === "PENDIENTE"
                    ) // Solo pendientes con fecha de pago
                    .sort((a, b) => {
                      const dateA = new Date(a.fechaPago!);
                      const dateB = new Date(b.fechaPago!);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .slice(0, 5)
                    .map((compra, index) => {
                      const fechaPago = new Date(compra.fechaPago!);
                      const hoy = new Date();
                      const diasRestantes = Math.ceil(
                        (fechaPago.getTime() - hoy.getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      return (
                        <motion.tr
                          key={compra.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                            {compra.numDoc}
                          </td>
                          <td className="px-4 py-1 whitespace-nowrap text-sm text-gray-600 text-center">
                            {compra.proveedor}
                          </td>
                          <td className="px-4 py-1 whitespace-nowrap text-sm text-gray-600 text-center">
                            ${compra.montoTotal.toLocaleString("es-CL")}
                          </td>
                          <td className="px-4 py-1 whitespace-nowrap text-sm text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-sm ${
                                  diasRestantes <= 3
                                    ? "text-red-600 font-semibold"
                                    : diasRestantes <= 7
                                    ? "text-amber-600 font-medium"
                                    : "text-gray-500"
                                }`}
                              >
                                {fechaPago.toLocaleDateString("es-ES")}
                              </span>
                              <span
                                className={`text-xs ${
                                  diasRestantes <= 0
                                    ? "text-red-500 font-semibold"
                                    : diasRestantes <= 3
                                    ? "text-red-500"
                                    : diasRestantes <= 7
                                    ? "text-amber-500"
                                    : "text-gray-400"
                                }`}
                              >
                                {diasRestantes < 0
                                  ? `Vencida (${Math.abs(diasRestantes)} días)`
                                  : diasRestantes === 0
                                  ? "Vence hoy"
                                  : `${diasRestantes} días`}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No hay facturas pendientes de pago
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DashboardWrapper() {
  return (
    <ProtectedRoute requiredModule="dashboard">
      <DashboardHome />
    </ProtectedRoute>
  );
}

export default DashboardWrapper;
