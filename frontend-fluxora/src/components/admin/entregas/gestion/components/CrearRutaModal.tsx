import { useState } from "react";
import { Driver } from "@/interfaces/entregas/driver";
import MaterialIcon from "@/components/ui/MaterialIcon";

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
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MaterialIcon name="add_road" className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Crear Nueva Ruta
              </h2>
              <p className="text-sm text-gray-500">
                Configura una nueva ruta de reparto
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loadingCreate}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-5">
            {/* Nombre de la Ruta */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                required
                disabled={loadingCreate}
              />
            </div>

            {/* Descripción */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 resize-none"
                disabled={loadingCreate}
              />
            </div>

            {/* Driver Asignado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Asignado
              </label>
              {loadingDrivers ? (
                <div className="flex items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-sm text-gray-600">
                    Cargando drivers...
                  </span>
                </div>
              ) : (
                <>
                  <select
                    value={nuevaRuta.id_driver}
                    onChange={(e) =>
                      setNuevaRuta({
                        ...nuevaRuta,
                        id_driver: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                    disabled={loadingCreate}
                  >
                    <option value="">Seleccionar driver (opcional)</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id.toString()}>
                        {driver.nombre} - {driver.email}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <MaterialIcon name="person" className="text-xs" />
                    {drivers.length > 0
                      ? `${drivers.length} driver(s) disponible(s). Puedes asignar después si prefieres.`
                      : "No se encontraron drivers disponibles. Puedes asignar después."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingCreate}
          >
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={!nuevaRuta.nombre.trim() || loadingCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingCreate && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <MaterialIcon name={loadingCreate ? "hourglass_empty" : "add"} />
            {loadingCreate ? "Creando..." : "Crear Ruta"}
          </button>
        </div>
      </div>
    </div>
  );
}
