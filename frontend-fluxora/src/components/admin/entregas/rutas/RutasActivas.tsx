"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RutaActiva } from "@/interfaces/entregas/entregas";
import MaterialIcon from "@/components/ui/MaterialIcon";

// Nuevas interfaces para el sistema de programación por fecha
interface RutaProgramadaPorFecha {
  fecha: string;
  ruta: {
    id: number;
    nombre: string;
    id_driver?: number;
    descripcion?: string;
  };
  totalClientes: number;
  totalKgCorriente?: number;
  totalKgEspecial?: number;
  clientes: ClienteConProgramacion[];
}

interface ClienteConProgramacion {
  cliente: {
    id: number;
    nombre: string;
    direccion: string;
    telefono?: string;
  };
  rutaCliente: {
    id: number;
    id_ruta: number;
    id_cliente: number;
    orden: number;
    kg_corriente_programado?: number;
    kg_especial_programado?: number;
    fecha_programada: string;
  };
}

interface ClienteParaProgramar {
  id: number;
  nombre: string;
  direccion: string;
  kg_corriente_programado: number;
  kg_especial_programado: number;
  orden: number;
}

interface RutasActivasProps {
  rutas: RutaActiva[];
  loading: boolean;
  onRefresh: () => void;
  onVerDetalle: (ruta: RutaActiva) => void;
}

export function RutasActivas({ rutas, loading, onRefresh }: RutasActivasProps) {
  const [showProgramarClientesModal, setShowProgramarClientesModal] =
    useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaActiva | null>(
    null
  );
  const [rutaProgramadaSeleccionada, setRutaProgramadaSeleccionada] =
    useState<RutaProgramadaPorFecha | null>(null);
  const [clientesParaProgramar, setClientesParaProgramar] = useState<
    ClienteParaProgramar[]
  >([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rutasPorFecha, setRutasPorFecha] = useState<RutaProgramadaPorFecha[]>(
    []
  );
  const [loadingFecha, setLoadingFecha] = useState(false);

  const fetchRutasPorFecha = async (fecha: string) => {
    setLoadingFecha(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-por-fecha/${fecha}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("=== DEBUG: Datos completos recibidos ===", data);
        // Validar que los datos sean un array válido
        if (Array.isArray(data)) {
          // Log detallado de cada ruta y sus clientes
          data.forEach((ruta: any, index: number) => {
            console.log(`=== DEBUG: Ruta ${index} ===`, ruta);
            if (ruta.clientes && ruta.clientes.length > 0) {
              ruta.clientes.forEach(
                (clienteData: any, clienteIndex: number) => {
                  console.log(`  Cliente ${clienteIndex}:`, clienteData);
                  console.log(`  - Cliente objeto:`, clienteData?.cliente);
                  console.log(
                    `  - Dirección del cliente:`,
                    clienteData?.cliente?.direccion
                  );
                }
              );
            }
          });
          setRutasPorFecha(data);
        } else {
          console.warn("Los datos recibidos no son un array válido:", data);
          setRutasPorFecha([]);
        }
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener rutas por fecha:", error);
      setRutasPorFecha([]);
    } finally {
      setLoadingFecha(false);
    }
  };

  const handleFechaChange = (nuevaFecha: string) => {
    setFechaSeleccionada(nuevaFecha);
    fetchRutasPorFecha(nuevaFecha);
  };

  // Cargar rutas por fecha inicial
  useEffect(() => {
    fetchRutasPorFecha(fechaSeleccionada);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando rutas activas...</span>
      </div>
    );
  }

  if (rutas.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <MaterialIcon name="route" className="text-5xl" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No hay rutas activas
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron rutas con entregas pendientes.
        </p>
        <div className="mt-6">
          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <MaterialIcon name="refresh" className="mr-2" />
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  const getProgresoColor = (progreso: number) => {
    if (progreso >= 100) return "bg-green-500";
    if (progreso >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getEstadoTexto = (progreso: number) => {
    if (progreso >= 100) return "Completada";
    if (progreso >= 50) return "En progreso";
    return "Pendiente";
  };

  const getEstadoColor = (progreso: number) => {
    if (progreso >= 100) return "text-green-800 bg-green-100";
    if (progreso >= 50) return "text-yellow-800 bg-yellow-100";
    return "text-red-800 bg-red-100";
  };

  return (
    <div className="max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6"
      >
        <h2 className="text-lg font-medium text-gray-900">
          Programación de Rutas por Fecha
        </h2>
        <p className="text-sm text-gray-500">
          Información correspondiente a cada ruta en la fecha seleccionada
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 whitespace-nowrap">
              Fecha:
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-500 w-full sm:w-auto"
            />
          </div>
          <button
            onClick={() => fetchRutasPorFecha(fechaSeleccionada)}
            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto whitespace-nowrap"
          >
            <MaterialIcon name="refresh" className="mr-2" />
            Actualizar
          </button>
        </div>
      </motion.div>

      {/* Mostrar loading de fecha */}
      {loadingFecha && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            Cargando rutas para{" "}
            {new Date(fechaSeleccionada).toLocaleDateString()}...
          </span>
        </div>
      )}

      {/* Mostrar rutas programadas por fecha */}
      {!loadingFecha && rutasPorFecha.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <MaterialIcon name="event_busy" className="text-5xl" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay rutas programadas
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron rutas programadas para el{" "}
            {new Date(fechaSeleccionada).toLocaleDateString()}.
          </p>
        </div>
      )}

      {/* Lista de rutas programadas */}
      {!loadingFecha && rutasPorFecha.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {rutasPorFecha.map((rutaProgramada, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              {/* Header de la ruta */}
              <div className="p-3 md:p-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MaterialIcon name="route" className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                        {rutaProgramada.ruta.nombre}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500">
                        {rutaProgramada.ruta.id_driver ? (
                          <span className="flex items-center gap-1">
                            <MaterialIcon name="person" className="text-sm" />
                            Driver #{rutaProgramada.ruta.id_driver}
                          </span>
                        ) : (
                          <span className="text-orange-600 flex items-center gap-1">
                            <MaterialIcon name="warning" className="text-sm" />
                            Sin asignar (Ver Gestión)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs md:text-sm text-gray-500">Total clientes</p>
                    <p className="font-semibold text-gray-800">
                      {rutaProgramada.totalClientes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de clientes */}
              <div className="p-3 md:p-4">
                <div className="space-y-3">
                  {rutaProgramada.clientes &&
                  rutaProgramada.clientes.length > 0 ? (
                    rutaProgramada.clientes.map(
                      (clienteData: any, clienteIndex: number) => (
                        <div
                          key={clienteIndex}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">
                                {clienteData?.rutaCliente?.orden || 1}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 text-sm md:text-base truncate">
                                {clienteData?.cliente?.nombre ||
                                  (clienteData?.cliente as any)
                                    ?.nombreNegocio ||
                                  `Cliente ${
                                    clienteData?.cliente?.id || "N/A"
                                  }`}
                              </p>
                              <p className="text-xs md:text-sm text-gray-500 truncate">
                                {clienteData?.cliente?.direccion ||
                                  "Dirección no disponible"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 pl-11 sm:pl-0">
                            <div className="text-left sm:text-right">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm">
                                <div>
                                  <span className="text-gray-600">
                                    Kg corriente:{" "}
                                  </span>
                                  <span className="font-semibold text-blue-600">
                                    {clienteData?.rutaCliente
                                      ?.kg_corriente_programado || 0}{" "}
                                    kg
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">
                                    Kg especial:{" "}
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    {clienteData?.rutaCliente
                                      ?.kg_especial_programado || 0}{" "}
                                    kg
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No hay clientes asignados a esta ruta
                    </div>
                  )}
                </div>

                {/* Totales de la ruta */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="font-medium text-gray-800 text-sm md:text-base">
                      Totales de la ruta:
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div className="text-xs md:text-sm">
                        <span className="text-gray-600">Total corriente: </span>
                        <span className="font-semibold text-blue-600">
                          {rutaProgramada.totalKgCorriente || 0} kg
                        </span>
                      </div>
                      <div className="text-xs md:text-sm">
                        <span className="text-gray-600">Total especial: </span>
                        <span className="font-semibold text-green-600">
                          {rutaProgramada.totalKgEspecial || 0} kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
