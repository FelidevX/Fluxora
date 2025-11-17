"use client";

import { useState, useEffect } from "react";
import {
  RutaActiva,
  ClienteConEntrega,
  RegistroEntrega,
} from "@/interfaces/entregas/entregas";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

interface DetalleRutaProps {
  ruta: RutaActiva;
  onBack: () => void;
  onRefresh: () => void;
}

export function DetalleRuta({ ruta, onBack, onRefresh }: DetalleRutaProps) {
  const [clientesConEntregas, setClientesConEntregas] = useState<
    ClienteConEntrega[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteConEntrega | null>(null);
  const [formData, setFormData] = useState({
    corriente_entregado: 0,
    especial_entregado: 0,
  });

  // Hook para notificaciones toast
  const { toasts, removeToast, success, error: showError } = useToast();

  const fetchClientesRuta = async () => {
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
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/ruta/${ruta.id}/clientes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setClientesConEntregas(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener clientes de la ruta:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientesRuta();
  }, [ruta.id]);

  const handleRegistrarEntrega = async () => {
    if (!clienteSeleccionado) return;

    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const registroEntrega: RegistroEntrega = {
        id_cliente: clienteSeleccionado.cliente.id,
        corriente_entregado: formData.corriente_entregado,
        especial_entregado: formData.especial_entregado,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/registrar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registroEntrega),
        }
      );

      if (response.ok) {
        setShowRegistroModal(false);
        setClienteSeleccionado(null);
        setFormData({ corriente_entregado: 0, especial_entregado: 0 });
        fetchClientesRuta();
        onRefresh();
        success("La entrega ha sido registrada exitosamente", "¡Entrega Registrada!");
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error al registrar entrega:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido al registrar la entrega",
        "Error al Registrar Entrega"
      );
    }
  };

  const abrirModalRegistro = (cliente: ClienteConEntrega) => {
    setClienteSeleccionado(cliente);
    setShowRegistroModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          Cargando detalles de la ruta...
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
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
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{ruta.nombre}</h2>
            <p className="text-gray-600">
              {ruta.entregasCompletadas} de {ruta.totalClientes} entregas
              completadas ({ruta.progreso}%)
            </p>
          </div>
        </div>
        <button
          onClick={fetchClientesRuta}
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Barra de Progreso */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-900">
            Progreso de Entregas
          </span>
          <span className="text-gray-600">{ruta.progreso}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${ruta.progreso}%` }}
          ></div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {clientesConEntregas.map((item, index) => (
            <li key={item.cliente.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                        item.entregaRealizada ? "bg-green-500" : "bg-gray-400"
                      }`}
                    >
                      {item.orden}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-gray-900">
                        {item.cliente.nombreNegocio}
                      </p>
                      {item.entregaRealizada && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg
                            className="h-3 w-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Entregado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.cliente.nombre}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.cliente.direccion}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.cliente.contacto}
                    </p>

                    {item.ultimaEntrega && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          Última entrega:{" "}
                          {new Date(
                            item.ultimaEntrega.hora_entregada || ""
                          ).toLocaleString()}
                        </p>
                        <p>
                          Pan corriente:{" "}
                          {item.ultimaEntrega.corriente_entregado} kg
                        </p>
                        <p>
                          Pan especial: {item.ultimaEntrega.especial_entregado}{" "}
                          kg
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!item.entregaRealizada ? (
                    <button
                      onClick={() => abrirModalRegistro(item)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg
                        className="h-4 w-4 mr-1"
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
                      Registrar Entrega
                    </button>
                  ) : (
                    <span className="text-green-600 font-medium">
                      ✓ Completado
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de Registro de Entrega */}
      {showRegistroModal && clienteSeleccionado && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Registrar Entrega - {clienteSeleccionado.cliente.nombreNegocio}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pan Corriente (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.corriente_entregado}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        corriente_entregado: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pan Especial (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.especial_entregado}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        especial_entregado: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRegistroModal(false);
                    setClienteSeleccionado(null);
                    setFormData({
                      corriente_entregado: 0,
                      especial_entregado: 0,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegistrarEntrega}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Registrar Entrega
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
