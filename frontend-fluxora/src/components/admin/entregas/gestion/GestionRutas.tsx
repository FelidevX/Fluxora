"use client";

import { useState, useEffect } from "react";
import { RutaActiva } from "@/interfaces/entregas";

interface Driver {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface GestionRutasProps {
  rutas: RutaActiva[];
  loading: boolean;
  onRefresh: () => void;
  onVerDetalle: (ruta: RutaActiva) => void;
}

export function GestionRutas({
  rutas,
  loading,
  onRefresh,
  onVerDetalle,
}: GestionRutasProps) {
  // Estados para el modal de creación
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [nuevaRuta, setNuevaRuta] = useState({
    nombre: "",
    descripcion: "",
    origen_coordenada: "-36.612523, -72.082921",
    id_driver: "",
  });

  // Estados para asignar driver
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaActiva | null>(
    null
  );
  const [driverId, setDriverId] = useState("");

  // Estados para programación de entregas por fecha
  const [showProgramacionModal, setShowProgramacionModal] = useState(false);
  const [fechaProgramacion, setFechaProgramacion] = useState("");
  const [rutasProgramadas, setRutasProgramadas] = useState<any[]>([]);
  const [loadingProgramacion, setLoadingProgramacion] = useState(false);
  const [rutaParaProgramar, setRutaParaProgramar] = useState<RutaActiva | null>(
    null
  );

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

  // Cargar drivers al montar el componente
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Función para crear nueva ruta
  const crearNuevaRuta = async () => {
    if (!nuevaRuta.nombre.trim()) {
      alert("El nombre de la ruta es obligatorio");
      return;
    }

    setLoadingCreate(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/crear-ruta`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: nuevaRuta.nombre,
            descripcion: nuevaRuta.descripcion,
            origen_coordenada: nuevaRuta.origen_coordenada,
            id_driver: nuevaRuta.id_driver
              ? parseInt(nuevaRuta.id_driver)
              : null,
          }),
        }
      );

      if (response.ok) {
        alert("Ruta creada exitosamente");
        setShowCrearModal(false);
        setNuevaRuta({
          nombre: "",
          descripcion: "",
          origen_coordenada: "-36.612523, -72.082921",
          id_driver: "",
        });
        onRefresh();
      } else {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error("Error al crear ruta:", error);
      alert(
        "Error al crear ruta: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  // Función para abrir modal de asignar driver
  const abrirModalAsignar = (ruta: RutaActiva) => {
    setRutaSeleccionada(ruta);
    setDriverId(ruta.id_driver?.toString() || "");
    setShowAsignarModal(true);
  };

  // Función para asignar driver
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

  // Función para abrir modal de programación
  const handleProgramarEntregas = (ruta: RutaActiva) => {
    setRutaParaProgramar(ruta);
    const today = new Date().toISOString().split("T")[0];
    setFechaProgramacion(today);
    setShowProgramacionModal(true);
  };

  // Función para obtener rutas programadas por fecha
  const fetchRutasProgramadas = async (fecha: string) => {
    if (!fecha) return;

    setLoadingProgramacion(true);
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
        setRutasProgramadas(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener rutas programadas:", error);
      alert(
        "Error al obtener rutas programadas: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      setLoadingProgramacion(false);
    }
  };

  // Función para actualizar kg de un cliente específico
  const handleActualizarKg = async (
    idRuta: number,
    idCliente: number,
    kgCorriente: number,
    kgEspecial: number
  ) => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/actualizar-programacion-cliente`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idRuta,
            idCliente,
            fecha: fechaProgramacion,
            kgCorriente,
            kgEspecial,
          }),
        }
      );

      if (response.ok) {
        // Refrescar los datos
        await fetchRutasProgramadas(fechaProgramacion);
        alert("Programación actualizada exitosamente");
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al actualizar programación:", error);
      alert(
        "Error al actualizar programación: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  // Efecto para cargar datos cuando cambie la fecha
  useEffect(() => {
    if (fechaProgramacion && showProgramacionModal) {
      fetchRutasProgramadas(fechaProgramacion);
    }
  }, [fechaProgramacion, showProgramacionModal]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Gestión de Rutas
          </h2>
          <p className="text-sm text-gray-500">
            Administra las rutas existentes, crea nuevas rutas y asigna drivers
          </p>
        </div>
        <button
          onClick={() => setShowCrearModal(true)}
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Crear Nueva Ruta
        </button>
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
            Comienza creando tu primera ruta usando el botón "Crear Nueva Ruta".
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

              <div className="mt-4 space-y-2">
                <div className="flex space-x-2">
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

                <button
                  onClick={() => handleProgramarEntregas(ruta)}
                  className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Programar Entregas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear Ruta */}
      {showCrearModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="relative  mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Crear Nueva Ruta
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Ruta *
                  </label>
                  <input
                    type="text"
                    value={nuevaRuta.nombre}
                    onChange={(e) =>
                      setNuevaRuta({ ...nuevaRuta, nombre: e.target.value })
                    }
                    placeholder="Ej: Ruta Centro, Ruta Norte, Ruta Las Condes"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={nuevaRuta.descripcion}
                    onChange={(e) =>
                      setNuevaRuta({
                        ...nuevaRuta,
                        descripcion: e.target.value,
                      })
                    }
                    placeholder="Descripción detallada de la ruta, zonas que cubre, etc."
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coordenadas de Origen (Panadería)
                  </label>
                  <input
                    type="text"
                    value={nuevaRuta.origen_coordenada}
                    onChange={(e) =>
                      setNuevaRuta({
                        ...nuevaRuta,
                        origen_coordenada: e.target.value,
                      })
                    }
                    placeholder="-36.612523, -72.082921"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                    readOnly
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    📍 Coordenadas fijas de la panadería (punto de inicio de
                    todas las rutas)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Asignado
                  </label>
                  {loadingDrivers ? (
                    <div className="flex items-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-gray-500">
                        Cargando drivers...
                      </span>
                    </div>
                  ) : (
                    <select
                      value={nuevaRuta.id_driver}
                      onChange={(e) =>
                        setNuevaRuta({
                          ...nuevaRuta,
                          id_driver: e.target.value,
                        })
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Seleccionar driver (opcional)</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id.toString()}>
                          {driver.nombre} - {driver.email}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {drivers.length > 0
                      ? `${drivers.length} driver(s) disponible(s). Puedes asignar después si prefieres.`
                      : "No se encontraron drivers disponibles. Puedes asignar después."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCrearModal(false);
                    setNuevaRuta({
                      nombre: "",
                      descripcion: "",
                      origen_coordenada: "-36.612523, -72.082921",
                      id_driver: "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={loadingCreate}
                >
                  Cancelar
                </button>
                <button
                  onClick={crearNuevaRuta}
                  disabled={!nuevaRuta.nombre.trim() || loadingCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {loadingCreate && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {loadingCreate ? "Creando..." : "Crear Ruta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asignar Driver */}
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

      {/* Modal de Programación de Entregas */}
      {showProgramacionModal && rutaParaProgramar && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 border shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto w-[90vw] max-w-6xl">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Programar Entregas - {rutaParaProgramar.nombre}
              </h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Programación
                  </label>
                  <input
                    type="date"
                    value={fechaProgramacion}
                    onChange={(e) => setFechaProgramacion(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
                  />
                </div>
                <div className="text-sm text-gray-500 mt-6">
                  Selecciona una fecha para ver y modificar las programaciones
                </div>
              </div>
            </div>

            {loadingProgramacion ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {rutasProgramadas.length > 0 ? (
                  rutasProgramadas.map((rutaProg) => (
                    <div
                      key={rutaProg.ruta.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          {rutaProg.ruta.nombre}
                        </h4>
                        <div className="text-sm text-gray-500">
                          {rutaProg.totalClientes} clientes • Total:{" "}
                          {rutaProg.totalKgCorriente}kg corriente,{" "}
                          {rutaProg.totalKgEspecial}kg especial
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rutaProg.clientes.map((clienteData: any) => (
                          <ClienteProgramacionCard
                            key={clienteData.cliente.id}
                            clienteData={clienteData}
                            onActualizarKg={handleActualizarKg}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay datos de programación para la fecha seleccionada
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowProgramacionModal(false);
                  setRutaParaProgramar(null);
                  setRutasProgramadas([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar cada cliente en la programación
interface ClienteProgramacionCardProps {
  clienteData: any;
  onActualizarKg: (
    idRuta: number,
    idCliente: number,
    kgCorriente: number,
    kgEspecial: number
  ) => void;
}

function ClienteProgramacionCard({
  clienteData,
  onActualizarKg,
}: ClienteProgramacionCardProps) {
  const [kgCorriente, setKgCorriente] = useState(
    clienteData.rutaCliente.kg_corriente_programado || 0
  );
  const [kgEspecial, setKgEspecial] = useState(
    clienteData.rutaCliente.kg_especial_programado || 0
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleGuardar = () => {
    onActualizarKg(
      clienteData.rutaCliente.id_ruta,
      clienteData.rutaCliente.id_cliente,
      parseFloat(kgCorriente.toString()) || 0,
      parseFloat(kgEspecial.toString()) || 0
    );
    setIsEditing(false);
  };

  const handleCancelar = () => {
    setKgCorriente(clienteData.rutaCliente.kg_corriente_programado || 0);
    setKgEspecial(clienteData.rutaCliente.kg_especial_programado || 0);
    setIsEditing(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-3">
        <h5 className="font-medium text-gray-900">
          {clienteData.cliente.nombre}
        </h5>
        <p className="text-sm text-gray-500">
          {clienteData.cliente.nombreNegocio}
        </p>
        <p className="text-xs text-gray-400">{clienteData.cliente.direccion}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kg Corriente
          </label>
          {isEditing ? (
            <input
              type="number"
              step="0.5"
              min="0"
              value={kgCorriente}
              onChange={(e) => setKgCorriente(parseFloat(e.target.value) || 0)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
            />
          ) : (
            <div className="text-sm font-medium text-gray-900">
              {kgCorriente} kg
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kg Especial
          </label>
          {isEditing ? (
            <input
              type="number"
              step="0.5"
              min="0"
              value={kgEspecial}
              onChange={(e) => setKgEspecial(parseFloat(e.target.value) || 0)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
            />
          ) : (
            <div className="text-sm font-medium text-gray-900">
              {kgEspecial} kg
            </div>
          )}
        </div>

        <div className="pt-2">
          {isEditing ? (
            <div className="flex space-x-2">
              <button
                onClick={handleGuardar}
                className="flex-1 px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelar}
                className="flex-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
            >
              Editar Kg
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 pt-1">
          Estado: {clienteData.rutaCliente.estado || "Sin programar"}
        </div>
      </div>
    </div>
  );
}
