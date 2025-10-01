import { useState } from "react";
import { RutaActiva } from "@/interfaces/entregas/entregas";

interface ProgramacionEntregasModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruta: RutaActiva | null;
  fechaProgramacion: string;
  setFechaProgramacion: (fecha: string) => void;
  rutasProgramadas: any[];
  loadingProgramacion: boolean;
  onActualizarKg: (
    idRuta: number,
    idCliente: number,
    kgCorriente: number,
    kgEspecial: number
  ) => void;
}

export function ProgramacionEntregasModal({
  isOpen,
  onClose,
  ruta,
  fechaProgramacion,
  setFechaProgramacion,
  rutasProgramadas,
  loadingProgramacion,
  onActualizarKg,
}: ProgramacionEntregasModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="relative mx-auto p-5 border shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto w-[90vw] max-w-6xl">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {ruta
              ? `Programar Entregas - ${ruta.nombre}`
              : "Programar Entregas"}
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
                        onActualizarKg={onActualizarKg}
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
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
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
