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
    </div>
  );
}
