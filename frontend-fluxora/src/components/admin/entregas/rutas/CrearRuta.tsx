"use client";

import { useState, useEffect } from "react";

interface Driver {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface CrearRutaProps {
  onRutaCreada: () => void;
  onBack: () => void;
}

export function CrearRuta({ onRutaCreada, onBack }: CrearRutaProps) {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [nuevaRuta, setNuevaRuta] = useState({
    nombre: "",
    descripcion: "",
    origen_coordenada: "-36.612523, -72.082921",
    id_driver: "",
  });

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

  const crearNuevaRuta = async () => {
    if (!nuevaRuta.nombre.trim()) {
      alert("El nombre de la ruta es obligatorio");
      return;
    }

    setLoading(true);
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
        setNuevaRuta({
          nombre: "",
          descripcion: "",
          origen_coordenada: "-36.612523, -72.082921",
          id_driver: "",
        });
        onRutaCreada();
        onBack();
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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="mr-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Crear Nueva Ruta
            </h2>
            <p className="text-gray-600">
              Complete la información para crear una nueva ruta de entregas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <div className="space-y-6">
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
                placeholder="Ej: Ruta Centro, Ruta Norte, Ruta Cato"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
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
                  setNuevaRuta({ ...nuevaRuta, descripcion: e.target.value })
                }
                placeholder="Descripción detallada de la ruta, zonas que cubre, etc. (opcional)"
                rows={4}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
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
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 text-gray-700"
                readOnly
              />
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
                    setNuevaRuta({ ...nuevaRuta, id_driver: e.target.value })
                  }
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
                >
                  <option value="">Seleccionar driver (opcional)</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id.toString()}>
                      {driver.nombre} - {driver.email}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-sm text-gray-400">
                {drivers.length > 0
                  ? `${drivers.length} driver(s) disponible(s). Puedes asignar después si prefieres.`
                  : "No se encontraron drivers disponibles. Puedes asignar después."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={crearNuevaRuta}
              disabled={!nuevaRuta.nombre.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {loading ? "Creando..." : "Crear Ruta"}
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Información importante
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Una vez creada la ruta, podrás asignar clientes desde la
                  sección "Rutas Activas"
                </li>
                <li>
                  El driver puede ser asignado durante la creación o
                  posteriormente
                </li>
                <li>
                  Todas las rutas inician desde la panadería (coordenadas fijas)
                </li>
                <li>
                  Puedes programar entregas específicas por fecha una vez que
                  tengas clientes asignados
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
