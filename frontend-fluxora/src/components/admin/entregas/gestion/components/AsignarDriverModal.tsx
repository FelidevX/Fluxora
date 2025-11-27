import { RutaActiva } from "@/interfaces/entregas/entregas";
import { Driver } from "@/interfaces/entregas/driver";

interface AsignarDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAsignar: (driverId: string) => void;
  ruta: RutaActiva | null;
  drivers: Driver[];
  loadingDrivers: boolean;
  driverId: string;
  setDriverId: (id: string) => void;
}

export function AsignarDriverModal({
  isOpen,
  onClose,
  onAsignar,
  ruta,
  drivers,
  loadingDrivers,
  driverId,
  setDriverId,
}: AsignarDriverModalProps) {
  if (!isOpen || !ruta) return null;

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Asignar Driver - {ruta.nombre}
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
                  className="mt-1 block w-full border-gray-400 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700"
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
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onAsignar(driverId)}
              disabled={!driverId}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Asignar Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
