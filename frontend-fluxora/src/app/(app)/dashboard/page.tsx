"use client";
import { Line } from "react-chartjs-2";
import MaterialIcon from "@/components/ui/MaterialIcon";
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

export default function DashboardHome() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [materiaPrima, setMateriaPrima] = useState<MateriaPrima[]>([]);
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasDashboard | null>(null);

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
      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

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
      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

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

  const getAuthToken = () => {
    let token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("No se encontró el token de autenticación");
    }
    if (token.startsWith("Bearer ")) {
      token = token.substring(7);
    }
    return token;
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
  useEffect(() => {
    fetchClients();
    fetchMateriasPrimas();
    fetchEstadisticas();
  }, []);

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Inicio</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <span>Resumen general</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm">{formattedDate}</span>
        </div>
      </div>
      {/* KPIs y estadísticas */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Entregas del día */}
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500">Entregas del día</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">
              {estadisticas
                ? `${estadisticas.entregasDelDia.completadas}/${estadisticas.entregasDelDia.total}`
                : "0/0"}
            </span>
            {estadisticas && estadisticas.entregasDelDia.total > 0 && (
              <span className="text-xs text-emerald-600">
                {Math.round(
                  (estadisticas.entregasDelDia.completadas /
                    estadisticas.entregasDelDia.total) *
                    100
                )}
                % completado
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500">Productos vendidos</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">
              {estadisticas
                ? `${Math.round(estadisticas.productosVendidosHoy || 0)} kg`
                : "0 kg"}
            </span>
            <span className="text-xs text-emerald-600">
              {estadisticas ? "" : ""}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500">Inventario bajo</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">5</span>{" "}
            {/* //cambiar */}
            <span className="text-xs text-rose-600">-8% vs ayer</span>{" "}
            {/* //cambiar */}
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500">Discrepancia</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold text-gray-900">3.2 %</span>{" "}
            {/* //cambiar */}
            <span className="text-xs text-rose-600">-1.5% vs ayer</span>{" "}
            {/* //cambiar */}
          </div>
        </div>
      </div>
      {/* Paneles: entregas de la semana y alertas */}
      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
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
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Alerta de inventario bajo
            </h2>
            <span className="text-xs rounded-full bg-rose-50 px-2 py-1 text-rose-700">
              5 productos
            </span>{" "}
            {/* //cambiar */}
          </div>
          <p className="text-sm text-gray-500">
            Productos que requieren reabastecimiento
          </p>
          <div className="mt-3 divide-y divide-gray-100">
            {/* //cambiar: estos datos deben venir de la API */}
            {[
              { p: "Harina de trigo", a: "15 Kg", m: "50 Kg", e: "30%" },
              { p: "Azúcar", a: "8 Kg", m: "25 Kg", e: "32%" },
              { p: "Levadura", a: "2 Kg", m: "10 Kg", e: "20%" },
              { p: "Mantequilla", a: "5 Kg", m: "20 Kg", e: "25%" },
              { p: "Huevos", a: "24 U", m: "100 U", e: "24%" },
            ].map((row) => (
              <div
                key={row.p}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-gray-700">{row.p}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">A: {row.a}</span>
                  <span className="text-gray-500">M: {row.m}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                    {row.e}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Clientes recientes */}
        <div className=" bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
                    .map((cliente) => (
                      <tr
                        key={cliente.email || cliente.id}
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
                      </tr>
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
        </div>
        {/* Materias Primas por vencer */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Materias primas registradas
            </h2>
            <MaterialIcon name="auto_delete" className="text-amber-400" />
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Materias primas próximas a vencer
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de vencimiento
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
                      Cargando productos...
                    </td>
                  </tr>
                ) : materiaPrima.length > 0 ? (
                  materiaPrima
                    .filter((mp) => mp.fechaVencimiento)
                    .sort((a, b) => {
                      const dateA = new Date(a.fechaVencimiento);
                      const dateB = new Date(b.fechaVencimiento);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .slice(0, 5)
                    .map((mp) => {
                      const fechaVencimiento = new Date(mp.fechaVencimiento);
                      const hoy = new Date();
                      const diasRestantes = Math.ceil(
                        (fechaVencimiento.getTime() - hoy.getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      return (
                        <tr key={mp.id} className="hover:bg-gray-50">
                          <td className="px-4 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                            {mp.nombre}
                          </td>
                          <td className="px-4 py-1 whitespace-nowrap text-sm text-gray-600 text-center">
                            {mp.cantidad} {mp.unidad}
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
                                {fechaVencimiento.toLocaleDateString("es-ES")}
                              </span>
                              <span
                                className={`text-xs ${
                                  diasRestantes <= 3
                                    ? "text-red-500"
                                    : diasRestantes <= 7
                                    ? "text-amber-500"
                                    : "text-gray-400"
                                }`}
                              >
                                {diasRestantes > 0
                                  ? `${diasRestantes} días`
                                  : "vencido"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      No hay productos con fecha de vencimiento registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
