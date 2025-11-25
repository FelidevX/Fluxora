"use client";

interface Ruta {
  id: number;
  id_driver: number;
  fecha: string;
  kg_corriente: number;
  kg_especial: number;
  corriente_devuelto: number;
  especial_devuelto: number;
  hora_retorno: string | null;
}

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
}

interface DetalleEntrega {
  id: number;
  id_pedido: number;
  id_cliente: number;
  hora_entregada: string;
  corriente_entregado: number;
  especial_entregado: number;
  comentario: string;
}

interface DetallesRutaModalProps {
  ruta: Ruta | null;
  detallesEntrega: DetalleEntrega[];
  clientes: Cliente[];
  loading: boolean;
  onClose: () => void;
  getNombreDriver: (idDriver: number) => string;
}

export function DetallesRutaModal({
  ruta,
  detallesEntrega,
  clientes,
  loading,
  onClose,
  getNombreDriver,
}: DetallesRutaModalProps) {
  if (!ruta) return null;

  const getNombreCliente = (idCliente: number): string => {
    const cliente = clientes.find((c) => c.id === idCliente);
    return cliente ? cliente.nombre : `Cliente #${idCliente}`;
  };

  const getDireccionCliente = (idCliente: number): string => {
    const cliente = clientes.find((c) => c.id === idCliente);
    return cliente ? cliente.direccion : "N/A";
  };

  const totalCorriente = detallesEntrega.reduce(
    (sum, d) => sum + (d.corriente_entregado || 0),
    0
  );

  const totalEspecial = detallesEntrega.reduce(
    (sum, d) => sum + (d.especial_entregado || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-[2px] overflow-y-auto h-full w-full z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Detalles de Ruta #{ruta.id}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Conductor: {getNombreDriver(ruta.id_driver)} | Fecha:{" "}
              {new Date(ruta.fecha).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-4">
          {/* Resumen de la Ruta */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Resumen de la Ruta
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600">Pan Corriente</p>
                <p className="text-lg font-bold text-gray-900">
                  {ruta.kg_corriente} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Pan Especial</p>
                <p className="text-lg font-bold text-gray-900">
                  {ruta.kg_especial} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Devuelto Corriente</p>
                <p className="text-lg font-bold text-red-600">
                  {ruta.corriente_devuelto} kg
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Devuelto Especial</p>
                <p className="text-lg font-bold text-red-600">
                  {ruta.especial_devuelto} kg
                </p>
              </div>
            </div>
          </div>

          {/* Entregas Realizadas */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Entregas Realizadas ({detallesEntrega.length})
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando detalles...</span>
              </div>
            ) : detallesEntrega.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron entregas para esta ruta
              </div>
            ) : (
              <div className="space-y-4">
                {detallesEntrega.map((detalle) => (
                  <div
                    key={detalle.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {getNombreCliente(detalle.id_cliente)}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {getDireccionCliente(detalle.id_cliente)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(detalle.hora_entregada).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-green-50 rounded p-2">
                        <p className="text-xs text-gray-600">Pan Corriente</p>
                        <p className="text-lg font-semibold text-green-700">
                          {detalle.corriente_entregado} kg
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded p-2">
                        <p className="text-xs text-gray-600">Pan Especial</p>
                        <p className="text-lg font-semibold text-purple-700">
                          {detalle.especial_entregado} kg
                        </p>
                      </div>
                    </div>

                    {detalle.comentario && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">
                          Comentario:
                        </p>
                        <p className="text-sm text-yellow-700">
                          {detalle.comentario}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          {detallesEntrega.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                Totales Entregados
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Pan Corriente</p>
                  <p className="text-2xl font-bold text-green-700">
                    {totalCorriente.toFixed(1)} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pan Especial</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {totalEspecial.toFixed(1)} kg
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}