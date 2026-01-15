"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHistorialEntregas } from "@/hooks/useHistorialEntregas";
import { TablaRutas } from "./componentes/TablaRutas";
import { DetallesRutaModal } from "./componentes/DetallesRutaModal";
import { EstadisticasPagos } from "./componentes/EstadisticasPagos";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface Ruta {
  id: number;
  id_driver: number;
  fecha: string;
  kg_corriente: number;
  kg_especial: number;
  corriente_devuelto: number;
  especial_devuelto: number;
  hora_retorno: string | null;
  pagado: boolean;
  fecha_pago: string | null;
  monto_total: number;
}

export function HistorialEntregas() {
  const {
    entregas,
    clientes,
    loading,
    detallesEntrega,
    loadingDetalles,
    fetchDetallesEntrega,
    getNombreDriver,
    marcarComoPagado,
  } = useHistorialEntregas();

  const { toasts, addToast, removeToast } = useToast();
  const [tabActiva, setTabActiva] = useState<"historial" | "pagos">(
    "historial"
  );
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroConductor, setFiltroConductor] = useState("");
  const [search, setSearch] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [procesandoPago, setProcesandoPago] = useState(false);

  const entregasFiltradas = entregas.filter((entrega) => {
    const cumpleFecha =
      !filtroFecha ||
      new Date(entrega.fecha).toDateString() ===
        new Date(filtroFecha).toDateString();

    const nombreDriver = getNombreDriver(entrega.id_driver).toLowerCase();
    const cumpleConductor =
      !filtroConductor ||
      nombreDriver.includes(filtroConductor.toLowerCase()) ||
      entrega.id_driver.toString().includes(filtroConductor);

    const cumpleBusqueda =
      !search ||
      nombreDriver.includes(search.toLowerCase()) ||
      new Date(entrega.fecha)
        .toLocaleDateString()
        .includes(search.toLowerCase());

    return cumpleFecha && cumpleConductor && cumpleBusqueda;
  });

  const abrirModal = async (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setModalAbierto(true);
    await fetchDetallesEntrega(ruta.id);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setRutaSeleccionada(null);
  };

  const abrirModalPago = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setModalPagoAbierto(true);
  };

  const cerrarModalPago = () => {
    setModalPagoAbierto(false);
    setRutaSeleccionada(null);
  };

  const confirmarPago = async () => {
    if (!rutaSeleccionada) return;

    setProcesandoPago(true);
    try {
      await marcarComoPagado(rutaSeleccionada.id);
      addToast({
        variant: "success",
        message: `Ruta de ${getNombreDriver(
          rutaSeleccionada.id_driver
        )} marcada como pagada`,
      });
      cerrarModalPago();
    } catch (error) {
      addToast({
        variant: "error",
        message: "Error al marcar como pagado. Intenta nuevamente.",
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroFecha("");
    setFiltroConductor("");
    setSearch("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Historial de Rutas
        </h2>

        {/* Pestañas */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setTabActiva("historial")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              tabActiva === "historial"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <MaterialIcon name="list_alt" className="text-lg" />
              <span>Historial</span>
            </div>
            {tabActiva === "historial" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
              />
            )}
          </button>

          <button
            onClick={() => setTabActiva("pagos")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              tabActiva === "pagos"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <MaterialIcon name="payments" className="text-lg" />
              <span>Pagos</span>
              {entregas.filter((r) => !r.pagado).length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {entregas.filter((r) => !r.pagado).length}
                </span>
              )}
            </div>
            {tabActiva === "pagos" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
              />
            )}
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {tabActiva === "historial" ? (
          <motion.div
            key="historial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TablaRutas
              rutas={entregasFiltradas}
              getNombreDriver={getNombreDriver}
              onVerDetalles={abrirModal}
              onMarcarPagado={abrirModalPago}
              loading={loading}
              searchValue={search}
              onSearch={setSearch}
            />
          </motion.div>
        ) : (
          <motion.div
            key="pagos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EstadisticasPagos
              rutas={entregas}
              getNombreDriver={getNombreDriver}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalAbierto && (
          <DetallesRutaModal
            ruta={rutaSeleccionada}
            detallesEntrega={detallesEntrega}
            clientes={clientes}
            loading={loadingDetalles}
            onClose={cerrarModal}
            getNombreDriver={getNombreDriver}
          />
        )}
      </AnimatePresence>

      <Modal
        isOpen={modalPagoAbierto}
        onClose={cerrarModalPago}
        onConfirm={confirmarPago}
        title="Confirmar Pago"
        confirmText={procesandoPago ? "Procesando..." : "Confirmar Pago"}
        confirmVariant="success"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de marcar como <strong>pagada</strong> la ruta de{" "}
            <strong>
              {rutaSeleccionada && getNombreDriver(rutaSeleccionada.id_driver)}
            </strong>{" "}
            del día{" "}
            <strong>
              {rutaSeleccionada &&
                new Date(rutaSeleccionada.fecha).toLocaleDateString()}
            </strong>
            ?
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Esta acción registrará que el conductor ya
              realizó el pago correspondiente a esta ruta.
            </p>
          </div>
        </div>
      </Modal>

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
