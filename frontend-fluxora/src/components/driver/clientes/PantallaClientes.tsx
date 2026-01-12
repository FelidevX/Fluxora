"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

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
  pedidoId: number | null;
  onFinalizarRuta?: () => void;
}

export default function PantallaClientes({
  orderedClients,
  onEntregarClick,
  pedidoId,
  onFinalizarRuta,
}: PantallaClientesProps) {
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [resumenRuta, setResumenRuta] = useState<any>(null);
  const [clientesEntregados, setClientesEntregados] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  // Hook para notificaciones
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  // Cargar resumen guardado al iniciar
  useEffect(() => {
    if (pedidoId) {
      const resumenGuardado = localStorage.getItem(`resumen_ruta_${pedidoId}`);
      if (resumenGuardado) {
        setResumenRuta(JSON.parse(resumenGuardado));
      }
    }
  }, [pedidoId]);

  // Función para abrir cliente en Google Maps (sin origen)
  const abrirClienteEnMaps = (cliente: Cliente) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${cliente.latitud},${cliente.longitud}`;
    window.open(url, "_blank");
  };

  // Cargar entregas realizadas al montar el componente
  useEffect(() => {
    if (pedidoId) {
      setClientesEntregados(new Set()); // Limpiar estado anterior
      cargarEntregasRealizadas();
    }
  }, [pedidoId]);

  const cargarEntregasRealizadas = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/pedido/${pedidoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const entregas = await response.json();
        // Solo entregas del pedido actual
        const entregadosSet = new Set<number>(
          entregas
            .filter((e: any) => e.id_pedido === pedidoId)
            .map((e: any) => e.id_cliente)
        );
        setClientesEntregados(entregadosSet);
        console.log("Clientes entregados HOY:", Array.from(entregadosSet));
      }
    } catch (err) {
      console.error("Error al cargar entregas realizadas:", err);
      showError("Error al cargar las entregas realizadas", "Error de Carga");
    } finally {
      setLoading(false);
    }
  };

  // Marcar cliente como entregado localmente
  const marcarComoEntregado = (clienteId: number) => {
    setClientesEntregados((prev) => new Set([...prev, clienteId]));
  };

  // Exponer función para que el padre pueda actualizar el estado
  useEffect(() => {
    (window as any).marcarClienteEntregado = marcarComoEntregado;
  }, []);

  const handleFinalizarRuta = async () => {
    if (!pedidoId) {
      showError("No se encontró el ID del pedido", "Error");
      return;
    }

    if (clientesPendientes > 0) {
      const confirmacion = window.confirm(
        `Aún quedan ${clientesPendientes} entregas pendientes. ¿Está seguro de finalizar la ruta?`
      );
      if (!confirmacion) return;
    }

    const confirmacion = window.confirm(
      "¿Estás seguro de que deseas finalizar la ruta? Esta acción calculará los productos devueltos y cerrará el pedido."
    );

    if (!confirmacion) return;

    setIsFinalizando(true);
    try {
      let token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/finalizar/${pedidoId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al finalizar la ruta");
      }

      const data = await response.json();

      // Guardar resumen en localStorage y estado
      setResumenRuta(data);
      if (pedidoId) {
        localStorage.setItem(`resumen_ruta_${pedidoId}`, JSON.stringify(data));
      }

      success(
        data.message || "Ruta finalizada correctamente",
        "¡Ruta Finalizada!"
      );

      // Esto hará que se muestre la pantalla completa de resumen
      if (onFinalizarRuta) {
        onFinalizarRuta();
      }

      // Limpiar clientes entregados ya que ya finalizó
      setClientesEntregados(new Set());
    } catch (err) {
      console.error("Error al finalizar ruta:", err);
      showError(
        "Hubo un error al finalizar la ruta. Por favor, inténtelo de nuevo.",
        "Error al Finalizar"
      );
    } finally {
      setIsFinalizando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando entregas...</p>
      </div>
    );
  }

  const clientesPendientes = orderedClients.filter(
    (c) => !clientesEntregados.has(c.id)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      \n{" "}
      <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header con contador actualizado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg p-4 shadow-sm"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Entregas del Día
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base text-gray-600">
              {clientesPendientes} de {orderedClients.length}{" "}
              {orderedClients.length === 1
                ? "entrega pendiente"
                : "entregas pendientes"}
            </p>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {orderedClients.length - clientesPendientes} Entregadas
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-4"
        >
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
              {orderedClients.map((cliente, index) => {
                const estaEntregado = clientesEntregados.has(cliente.id);

                return (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                    className={`rounded-lg border transition-all duration-300 ${
                      estaEntregado
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 hover:bg-gray-100 active:bg-gray-200"
                    } p-3 sm:p-4`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Información del cliente */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Número de orden / Check */}
                        <div
                          className={`
                            flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold transition-all duration-300
                            ${
                              estaEntregado
                                ? "bg-green-500"
                                : index === 0
                                ? "bg-blue-500"
                                : index === orderedClients.length - 1
                                ? "bg-red-500"
                                : "bg-gray-400"
                            }
                          `}
                        >
                          {estaEntregado ? (
                            <MaterialIcon name="check" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium text-sm sm:text-base truncate ${
                              estaEntregado ? "text-green-900" : "text-gray-900"
                            }`}
                          >
                            {cliente.nombre}
                          </p>
                          <p
                            className={`text-xs sm:text-sm mt-1 line-clamp-2 ${
                              estaEntregado ? "text-green-600" : "text-gray-500"
                            }`}
                          >
                            {cliente.direccion}
                          </p>

                          {/* Badges de estado */}
                          <div className="flex gap-2 mt-2">
                            {estaEntregado && (
                              <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                <MaterialIcon
                                  name="check_circle"
                                  className="mr-1"
                                />
                                Entregado
                              </span>
                            )}
                            {!estaEntregado && index === 0 && (
                              <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                <MaterialIcon
                                  name="rocket_launch"
                                  className="mr-1"
                                />
                                Primera parada
                              </span>
                            )}
                            {!estaEntregado &&
                              index === orderedClients.length - 1 && (
                                <span className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                  <MaterialIcon
                                    name="sports_score"
                                    className="mr-1"
                                  />
                                  Última parada
                                </span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Botón de entrega */}
                      <div className="flex flex-col gap-2 ml-3">
                        <button
                          onClick={() =>
                            !estaEntregado && onEntregarClick?.(cliente)
                          }
                          disabled={estaEntregado}
                          className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 shadow-sm ${
                            estaEntregado
                              ? "bg-green-100 text-green-800 cursor-not-allowed opacity-75"
                              : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <MaterialIcon
                              name={
                                estaEntregado ? "check_circle" : "package_2"
                              }
                            />
                            <span>
                              {estaEntregado ? "Entregado" : "Entregar"}
                            </span>
                          </div>
                        </button>

                        {/* Botón para abrir en Maps */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirClienteEnMaps(cliente);
                          }}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
                          title="Abrir en Google Maps"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <MaterialIcon name="map" />
                            <span>Maps</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Posición: {index + 1} de {orderedClients.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <MaterialIcon name="route" />
                        {estaEntregado ? "Completado" : "Ruta optimizada"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
      {/* Botón flotante de finalizar ruta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg"
      >
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleFinalizarRuta}
            disabled={isFinalizando}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold text-base transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <MaterialIcon name="check_circle" />
            {isFinalizando ? "Finalizando ruta..." : "Finalizar Ruta"}
          </button>
          {clientesPendientes > 0 && (
            <p className="text-center text-xs text-gray-500 mt-2">
              {clientesPendientes}{" "}
              {clientesPendientes === 1
                ? "entrega pendiente"
                : "entregas pendientes"}
            </p>
          )}
        </div>
      </motion.div>
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
