"use client";

import MaterialIcon from "@/components/ui/MaterialIcon";

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

interface PantallaClientesProps {
  orderedClients: Cliente[];
  onEntregarClick?: (cliente: Cliente) => void;
}

export default function PantallaClientes({
  orderedClients,
  onEntregarClick,
}: PantallaClientesProps) {
  const clientesPendientes = orderedClients.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Entregas del Día
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base text-gray-600">
              {clientesPendientes}{" "}
              {clientesPendientes === 1 ? "entrega" : "entregas"} programadas
            </p>
            <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              En orden
            </div>
          </div>
        </div>

        {/* Lista de clientes ordenada */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
              Orden de Entregas
            </h3>
            <span className="text-xs sm:text-sm text-gray-500">
              Sigue el orden de la ruta
            </span>
          </div>

          {orderedClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm">No hay entregas programadas</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {orderedClients.map((cliente, index) => (
                <div
                  key={cliente.id}
                  className="bg-gray-50 hover:bg-gray-100 active:bg-gray-200 p-3 sm:p-4 rounded-lg border transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {/* Información del cliente */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Número de orden */}
                      <div
                        className={`
                        flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold
                        ${
                          index === 0
                            ? "bg-green-500"
                            : index === orderedClients.length - 1
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }
                      `}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {cliente.nombre}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                          {cliente.direccion}
                        </p>

                        {/* Badges de posición */}
                        <div className="flex gap-2 mt-2">
                          {index === 0 && (
                            <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                              <MaterialIcon name="rocket_launch" />
                              Primera parada
                            </span>
                          )}
                          {index === orderedClients.length - 1 && (
                            <span className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                              <MaterialIcon name="sports_score" />
                              Última parada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col gap-2 ml-3">
                      <button
                        onClick={() => onEntregarClick?.(cliente)}
                        className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <MaterialIcon name="package_2" />
                          <span>Entregar</span>                        
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Información adicional para móvil */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Posición: {index + 1} de {orderedClients.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <MaterialIcon name="route" />
                      Ruta optimizada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
