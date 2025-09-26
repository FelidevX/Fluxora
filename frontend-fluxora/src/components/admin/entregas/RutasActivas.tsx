"use client";

import { useState, useEffect } from "react";
import { RutaActiva } from "@/interfaces/entregas";

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
  onCrearDatosPrueba?: () => void;
}

export function RutasActivas({
  rutas,
  loading,
  onRefresh,
  onVerDetalle,
  onCrearDatosPrueba,
}: RutasActivasProps) {
  const [showAsignarModal, setShowAsignarModal] = useState(false);
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
  const [driverId, setDriverId] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rutasPorFecha, setRutasPorFecha] = useState<RutaProgramadaPorFecha[]>(
    []
  );
  const [loadingFecha, setLoadingFecha] = useState(false);

  // Estados para drivers
  const [drivers, setDrivers] = useState<
    { id: number; nombre: string; email: string }[]
  >([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Función para obtener todos los drivers
  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios?rol=DRIVER`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener drivers:", error);
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const abrirModalAsignar = (ruta: RutaActiva) => {
    setRutaSeleccionada(ruta);
    setDriverId(ruta.id_driver?.toString() || "");
    setShowAsignarModal(true);
    // Cargar drivers si no están cargados
    if (drivers.length === 0 && !loadingDrivers) {
      fetchDrivers();
    }
  };

  const handleAsignarDriver = async () => {
    if (!rutaSeleccionada || !driverId) return;

    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/asignar-driver`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_ruta: rutaSeleccionada.id,
            id_driver: parseInt(driverId),
          }),
        }
      );

      if (response.ok) {
        setShowAsignarModal(false);
        setRutaSeleccionada(null);
        setDriverId("");
        onRefresh();
        alert("Driver asignado exitosamente");
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al asignar driver:", error);
      alert(
        "Error al asignar driver: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  // Función para editar un cliente específico
  const editarClienteEspecifico = (idRuta: number, clienteData: any) => {
    setRutaSeleccionada({ id: idRuta } as any);
    setClientesParaProgramar([
      {
        id: clienteData?.cliente?.id || 0,
        nombre:
          clienteData?.cliente?.nombre ||
          (clienteData?.cliente as any)?.nombreNegocio ||
          `Cliente ${clienteData?.cliente?.id || "N/A"}`,
        direccion: clienteData?.cliente?.direccion || "Dirección no disponible",
        kg_corriente_programado:
          clienteData?.rutaCliente?.kg_corriente_programado || 0,
        kg_especial_programado:
          clienteData?.rutaCliente?.kg_especial_programado || 0,
        orden: clienteData?.rutaCliente?.orden || 1,
      },
    ]);
    setShowProgramarClientesModal(true);
  };

  const crearDatosPrueba = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/setup-datos-prueba`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert("Datos de prueba creados exitosamente");
        // Recargar las rutas para la fecha actual
        const fechaFormateada = fechaSeleccionada
          .split("-")
          .reverse()
          .join("-");
        await fetchRutasPorFecha(fechaFormateada);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al crear datos de prueba:", error);
      alert(
        "Error al crear datos de prueba: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

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
        // Validar que los datos sean un array válido
        if (Array.isArray(data)) {
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

  const abrirModalProgramarClientes = async (
    idRutaOrRutaProgramada: number | RutaProgramadaPorFecha,
    clientes?: any[]
  ) => {
    // Si se pasa un número, significa que es idRuta con lista de clientes
    if (typeof idRutaOrRutaProgramada === "number" && clientes) {
      setRutaSeleccionada({ id: idRutaOrRutaProgramada } as any);

      const clientesFormateados = clientes.map((clienteData) => ({
        id: clienteData?.cliente?.id || 0,
        nombre:
          clienteData?.cliente?.nombre ||
          (clienteData?.cliente as any)?.nombreNegocio ||
          `Cliente ${clienteData?.cliente?.id || "N/A"}`,
        direccion: clienteData?.cliente?.direccion || "Dirección no disponible",
        kg_corriente_programado:
          clienteData?.rutaCliente?.kg_corriente_programado || 0,
        kg_especial_programado:
          clienteData?.rutaCliente?.kg_especial_programado || 0,
        orden: clienteData?.rutaCliente?.orden || 1,
      }));

      setClientesParaProgramar(clientesFormateados);
      setShowProgramarClientesModal(true);
    } else {
      // Caso original: se pasa un objeto RutaProgramadaPorFecha
      const rutaProgramada = idRutaOrRutaProgramada as RutaProgramadaPorFecha;
      setRutaProgramadaSeleccionada(rutaProgramada);

      // Si ya hay clientes programados, usarlos. Si no, obtener del día anterior
      if (rutaProgramada.clientes.length > 0) {
        const clientesParaEditar = rutaProgramada.clientes.map(
          (clienteData) => ({
            id: clienteData?.cliente?.id || 0,
            nombre:
              clienteData?.cliente?.nombre ||
              (clienteData?.cliente as any)?.nombreNegocio ||
              `Cliente ${clienteData?.cliente?.id || "N/A"}`,
            direccion:
              clienteData?.cliente?.direccion || "Dirección no disponible",
            kg_corriente_programado:
              clienteData?.rutaCliente?.kg_corriente_programado || 0,
            kg_especial_programado:
              clienteData?.rutaCliente?.kg_especial_programado || 0,
            orden: clienteData?.rutaCliente?.orden || 1,
          })
        );

        setClientesParaProgramar(clientesParaEditar);
        setShowProgramarClientesModal(true);
      } else {
        // TODO: Implementar obtención de clientes de la ruta y valores del día anterior
        alert(
          "Esta funcionalidad se implementará para obtener clientes de la ruta y valores del día anterior"
        );
      }
    }
  };

  const handleGuardarProgramacionClientes = async () => {
    if (!rutaProgramadaSeleccionada) return;

    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const programacionData = clientesParaProgramar.map((cliente) => ({
        id_cliente: cliente.id,
        kg_corriente_programado: cliente.kg_corriente_programado,
        kg_especial_programado: cliente.kg_especial_programado,
        orden: cliente.orden,
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/programar-entregas-individuales`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_ruta: rutaProgramadaSeleccionada.ruta.id,
            fecha: fechaSeleccionada,
            entregas: programacionData,
          }),
        }
      );

      if (response.ok) {
        setShowProgramarClientesModal(false);
        setRutaProgramadaSeleccionada(null);
        setClientesParaProgramar([]);
        fetchRutasPorFecha(fechaSeleccionada);
        alert("Entregas programadas exitosamente");
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al programar entregas:", error);
      alert(
        "Error al programar entregas: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  const actualizarClienteProgramacion = (
    clienteId: number,
    campo: "kg_corriente_programado" | "kg_especial_programado",
    valor: number
  ) => {
    setClientesParaProgramar((prev) =>
      prev.map((cliente) =>
        cliente.id === clienteId ? { ...cliente, [campo]: valor } : cliente
      )
    );
  };

  // Cargar rutas por fecha inicial y drivers
  useEffect(() => {
    fetchRutasPorFecha(fechaSeleccionada);
    fetchDrivers();
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
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0V7"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No hay rutas activas
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron rutas con entregas pendientes.
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualizar
          </button>
          {onCrearDatosPrueba && (
            <button
              onClick={onCrearDatosPrueba}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Crear Datos de Prueba
            </button>
          )}
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          Programación de Rutas por Fecha
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium text-gray-700">
              Fecha:
            </label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            />
          </div>
          <button
            onClick={() => fetchRutasPorFecha(fechaSeleccionada)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualizar
          </button>

          {onCrearDatosPrueba && (
            <button
              onClick={onCrearDatosPrueba}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Crear Datos
            </button>
          )}
        </div>
      </div>

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
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1l-10 10-4 4H3a2 2 0 01-2-2v-4l4-4 10-10v-1a2 2 0 012-2z"
              />
            </svg>
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
        <div className="space-y-6">
          {rutasPorFecha.map((rutaProgramada, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              {/* Header de la ruta */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0V7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {rutaProgramada.ruta.nombre}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {rutaProgramada.ruta.id_driver ? (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Driver #{rutaProgramada.ruta.id_driver}
                            <button
                              onClick={() =>
                                abrirModalAsignar({
                                  id: rutaProgramada.ruta.id,
                                  nombre: rutaProgramada.ruta.nombre,
                                  id_driver: rutaProgramada.ruta.id_driver || 0,
                                  clientes: [],
                                  totalClientes: rutaProgramada.totalClientes,
                                  entregasCompletadas: 0,
                                  progreso: 0,
                                })
                              }
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              abrirModalAsignar({
                                id: rutaProgramada.ruta.id,
                                nombre: rutaProgramada.ruta.nombre,
                                id_driver: 0,
                                clientes: [],
                                totalClientes: rutaProgramada.totalClientes,
                                entregasCompletadas: 0,
                                progreso: 0,
                              })
                            }
                            className="text-orange-600 hover:text-orange-800 flex items-center gap-1"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Sin asignar
                          </button>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total clientes</p>
                    <p className="font-semibold text-gray-800">
                      {rutaProgramada.totalClientes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de clientes */}
              <div className="p-4">
                <div className="space-y-3">
                  {rutaProgramada.clientes &&
                  rutaProgramada.clientes.length > 0 ? (
                    rutaProgramada.clientes.map(
                      (clienteData: any, clienteIndex: number) => (
                        <div
                          key={clienteIndex}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {clienteData?.rutaCliente?.orden || 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {clienteData?.cliente?.nombre ||
                                  (clienteData?.cliente as any)
                                    ?.nombreNegocio ||
                                  `Cliente ${
                                    clienteData?.cliente?.id || "N/A"
                                  }`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {clienteData?.cliente?.direccion ||
                                  "Dirección no disponible"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-4 text-sm">
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
                            <button
                              onClick={() =>
                                editarClienteEspecifico(
                                  rutaProgramada.ruta.id,
                                  clienteData
                                )
                              }
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Actualizar kg
                            </button>
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
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      Totales de la ruta:
                    </span>
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <span className="text-gray-600">Total corriente: </span>
                        <span className="font-semibold text-blue-600">
                          {rutaProgramada.totalKgCorriente || 0} kg
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Total especial: </span>
                        <span className="font-semibold text-green-600">
                          {rutaProgramada.totalKgEspecial || 0} kg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de programar entregas */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() =>
                      abrirModalProgramarClientes(
                        rutaProgramada.ruta.id,
                        rutaProgramada.clientes
                      )
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Programar Entregas
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sección de Gestión de Rutas */}
      <div className="mt-12 border-t pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            Gestión de Rutas
          </h2>
          <p className="text-sm text-gray-500">
            Administra las rutas existentes y asigna clientes
          </p>
        </div>

        {/* Lista de rutas existentes */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando rutas...</span>
          </div>
        )}

        {!loading && rutas.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay rutas creadas
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primera ruta usando el botón "Crear Ruta"
              arriba.
            </p>
          </div>
        )}

        {!loading && rutas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rutas.map((ruta) => (
              <div
                key={ruta.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {ruta.nombre}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {ruta.totalClientes} clientes
                      </div>

                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {ruta.id_driver
                          ? `Driver #${ruta.id_driver}`
                          : "Sin driver asignado"}
                      </div>

                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        {ruta.progreso.toFixed(1)}% completado
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => onVerDetalle(ruta)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Ver Detalle
                  </button>

                  <button
                    onClick={() => abrirModalAsignar(ruta)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Driver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Asignación de Driver */}
      {showAsignarModal && rutaSeleccionada && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Asignar Driver - {rutaSeleccionada.nombre}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seleccionar Driver
                  </label>
                  {loadingDrivers ? (
                    <div className="flex items-center py-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-500">
                        Cargando drivers...
                      </span>
                    </div>
                  ) : (
                    <select
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar un driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id.toString()}>
                          {driver.nombre} - {driver.email}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {drivers.length > 0
                      ? `${drivers.length} driver(s) disponible(s)`
                      : "No se encontraron drivers disponibles"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAsignarModal(false);
                    setRutaSeleccionada(null);
                    setDriverId("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAsignarDriver}
                  disabled={!driverId}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Asignar Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
