import { useState } from "react";
import { Driver } from "@/interfaces/entregas/driver";

interface CrearRutaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrear: (rutaData: {
    nombre: string;
    descripcion: string;
    origen_coordenada: string;
    id_driver: string;
  }) => void;
  drivers: Driver[];
  loadingDrivers: boolean;
  loadingCreate: boolean;
}

export function CrearRutaModal({
  isOpen,
  onClose,
  onCrear,
  drivers,
  loadingDrivers,
  loadingCreate,
}: CrearRutaModalProps) {
  const [nuevaRuta, setNuevaRuta] = useState({
    nombre: "",
    descripcion: "",
    origen_coordenada: "-36.612523, -72.082921",
    id_driver: "",
  });

  const handleCrear = () => {
    // La validación y notificación se maneja en el componente padre
    onCrear(nuevaRuta);
  };

  const handleClose = () => {
    setNuevaRuta({
      nombre: "",
      descripcion: "",
      origen_coordenada: "-36.612523, -72.082921",
      id_driver: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
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
                  setNuevaRuta({
                    ...nuevaRuta,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Descripción detallada de la ruta, zonas que cubre, etc."
                rows={3}
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
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 text-gray-400"
                readOnly
              />
              <p className="mt-1 text-sm text-gray-500">
                📍 Coordenadas fijas de la panadería (punto de inicio de todas
                las rutas)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Asignado
              </label>
              {loadingDrivers ? (
                <div className="flex items-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2 text-gray-700"></div>
                  <span className="text-sm text-gray-700">
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
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-600"
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
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loadingCreate}
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
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
  );
}
