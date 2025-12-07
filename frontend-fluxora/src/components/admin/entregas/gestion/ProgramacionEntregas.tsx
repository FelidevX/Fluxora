"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RutaActiva } from "@/interfaces/entregas/entregas";
import { AsignarProductosModal } from "./components/AsignarProductosModal";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

// Interfaces para productos y lotes
interface Lote {
  id: number;
  productoId: number;
  cantidadProducida: number;
  stockActual: number;
  costoProduccionTotal: number;
  costoUnitario: number;
  fechaProduccion: string;
  fechaVencimiento: string;
  estado: string;
}

interface ProductoConLotes {
  id: number;
  nombre: string;
  categoria: string;
  tipoProducto: string;
  precio: number;
  lotes: Lote[];
  stockTotal: number;
}

interface ProductoProgramado {
  id_producto: number;
  id_lote: number;
  nombreProducto: string;
  categoria: string;
  tipoProducto: string;
  cantidad_kg: number;
}

interface ProgramacionEntregasProps {
  rutas: RutaActiva[];
  loading: boolean;
}

export function ProgramacionEntregas({
  rutas,
  loading,
}: ProgramacionEntregasProps) {
  const [fechaProgramacion, setFechaProgramacion] = useState("");
  const [rutaSeleccionada, setRutaSeleccionada] = useState<number | null>(null);
  const [rutasProgramadas, setRutasProgramadas] = useState<any[]>([]);
  const [loadingProgramacion, setLoadingProgramacion] = useState(false);
  const [productosConLotes, setProductosConLotes] = useState<
    ProductoConLotes[]
  >([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Hook para notificaciones toast
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
    info,
  } = useToast();

  // Estados para el modal de asignación
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [rutaIdSeleccionada, setRutaIdSeleccionada] = useState<number | null>(
    null
  );

  // Inicializar fecha con hoy
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFechaProgramacion(today);
  }, []);

  // Función para obtener productos con sus lotes
  const fetchProductosConLotes = async () => {
    setLoadingProductos(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      // Primero obtenemos todos los productos
      const productosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/productos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!productosResponse.ok) {
        throw new Error(
          `Error al obtener productos: ${productosResponse.status}`
        );
      }

      const productos = await productosResponse.json();

      // Ahora obtenemos los lotes de cada producto
      const productosConLotesData: ProductoConLotes[] = await Promise.all(
        productos.map(async (producto: any) => {
          try {
            const lotesResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/productos/${producto.id}/lotes`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            let lotes: Lote[] = [];
            if (lotesResponse.ok) {
              const lotesData = await lotesResponse.json();
              // Filtrar solo lotes disponibles con stock
              lotes = lotesData.filter(
                (lote: Lote) =>
                  lote.estado === "disponible" && lote.stockActual > 0
              );
            }

            const stockTotal = lotes.reduce(
              (sum, lote) => sum + lote.stockActual,
              0
            );

            return {
              id: producto.id,
              nombre: producto.nombre,
              categoria: producto.categoria,
              tipoProducto: producto.tipoProducto,
              precio: producto.precio,
              lotes: lotes,
              stockTotal: stockTotal,
            };
          } catch (error) {
            console.error(
              `Error al obtener lotes del producto ${producto.id}:`,
              error
            );
            return {
              id: producto.id,
              nombre: producto.nombre,
              categoria: producto.categoria,
              tipoProducto: producto.tipoProducto,
              precio: producto.precio,
              lotes: [],
              stockTotal: 0,
            };
          }
        })
      );

      // Filtrar productos que tengan stock disponible
      const productosDisponibles = productosConLotesData.filter(
        (p) => p.stockTotal > 0
      );

      setProductosConLotes(productosDisponibles);
    } catch (error) {
      console.error("Error al obtener productos con lotes:", error);
      setProductosConLotes([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  // Función para obtener rutas programadas por fecha
  const fetchRutasProgramadas = async (fecha: string) => {
    if (!fecha) return;

    setLoadingProgramacion(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-por-fecha/${fecha}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Rutas programadas recibidas:", data);
        setRutasProgramadas(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener rutas programadas:", error);
      showError(
        error instanceof Error ? error.message : "Error desconocido",
        "Error al Obtener Programación"
      );
    } finally {
      setLoadingProgramacion(false);
    }
  };

  // Cargar productos al montar
  useEffect(() => {
    fetchProductosConLotes();
  }, []);

  // Cargar datos cuando cambie la fecha
  useEffect(() => {
    if (fechaProgramacion) {
      fetchRutasProgramadas(fechaProgramacion);
    }
  }, [fechaProgramacion]);

  // Función para actualizar productos de un cliente específico
  const handleActualizarProductos = async (
    idRuta: number,
    idCliente: number,
    productos: ProductoProgramado[]
  ) => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/programar-entrega`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idRuta,
            idCliente,
            fechaProgramacion: fechaProgramacion,
            productos,
          }),
        }
      );

      if (response.ok) {
        // Refrescar los datos
        await fetchRutasProgramadas(fechaProgramacion);
        await fetchProductosConLotes();
        success(
          "Los productos han sido asignados correctamente al cliente",
          "¡Productos Asignados!"
        );
        setShowAsignarModal(false);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al actualizar productos:", error);
      showError(
        error instanceof Error ? error.message : "Error desconocido",
        "Error al Asignar Productos"
      );
    }
  };

  // Abrir modal para asignar productos a un cliente
  const handleAsignarCliente = (cliente: any, rutaId: number) => {
    setClienteSeleccionado(cliente);
    setRutaIdSeleccionada(rutaId);
    setShowAsignarModal(true);
  };

  const rutasProgramadasFiltradas = rutaSeleccionada
    ? rutasProgramadas.filter((rp) => rp.ruta.id === rutaSeleccionada)
    : rutasProgramadas;

  return (
    <div className="max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Programación de Entregas
        </h2>
        <p className="text-sm text-gray-500">
          Selecciona una ruta y fecha para programar entregas
        </p>
      </motion.div>

      {/* Selector de fecha y ruta */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Entrega
            </label>
            <input
              type="date"
              value={fechaProgramacion}
              onChange={(e) => setFechaProgramacion(e.target.value)}
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Ruta
            </label>
            <select
              value={rutaSeleccionada || ""}
              onChange={(e) =>
                setRutaSeleccionada(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las rutas</option>
              {rutas.map((ruta) => (
                <option key={ruta.id} value={ruta.id}>
                  {ruta.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Lista de rutas programadas */}
      {loadingProgramacion ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando programación...</span>
        </div>
      ) : rutasProgramadasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay programación para esta fecha
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona otra fecha o ruta para ver las entregas programadas.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {rutasProgramadasFiltradas.map((rutaProg, index) => (
            <motion.div
              key={rutaProg.ruta.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              {/* Header de la ruta */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 rounded-lg p-2">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {rutaProg.ruta.nombre}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {rutaProg.totalClientes} clientes en esta ruta
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de clientes */}
              <div className="divide-y divide-gray-200">
                {rutaProg.clientes && rutaProg.clientes.length > 0 ? (
                  rutaProg.clientes.map((clienteData: any) => {
                    const cliente = clienteData.cliente || {};
                    const productos = clienteData.productosProgramados || [];

                    return (
                      <div
                        key={cliente.id || clienteData.rutaCliente?.id_cliente}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-2">
                              {cliente.nombre ||
                                cliente.nombreNegocio ||
                                `Cliente #${cliente.id}`}
                            </h5>

                            {productos.length > 0 ? (
                              <div className="space-y-2">
                                {productos.map((prod: any) => (
                                  <div
                                    key={`${cliente.id}-${
                                      prod.id_producto || prod.id_lote
                                    }`}
                                    className="flex items-center text-sm text-gray-600"
                                  >
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    <span className="font-medium">
                                      {prod.nombreProducto}
                                    </span>
                                    <span className="mx-2">-</span>
                                    <span>{prod.cantidad_kg} kg</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">
                                Sin productos asignados
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              handleAsignarCliente(
                                {
                                  id_cliente: cliente.id,
                                  nombre_cliente:
                                    cliente.nombre || cliente.nombreNegocio,
                                  productos: productos,
                                },
                                rutaProg.ruta.id
                              )
                            }
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Asignar
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No hay clientes en esta ruta
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal para asignar productos */}
      <AnimatePresence>
        {showAsignarModal && clienteSeleccionado && rutaIdSeleccionada && (
          <AsignarProductosModal
            isOpen={showAsignarModal}
            onClose={() => {
              setShowAsignarModal(false);
              setClienteSeleccionado(null);
              setRutaIdSeleccionada(null);
            }}
            cliente={clienteSeleccionado}
            rutaId={rutaIdSeleccionada}
            productosConLotes={productosConLotes}
            loadingProductos={loadingProductos}
            onActualizar={handleActualizarProductos}
          />
        )}
      </AnimatePresence>

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
