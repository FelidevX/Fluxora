"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompras } from "@/hooks/useCompras";
import { CompraMateriaPrimaResponse } from "@/types/inventario";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import ModalPagoCompra from "@/components/ui/ModalPagoCompra";

export default function VisualizarCompras() {
  const {
    compras,
    loading,
    error,
    cargarCompras,
    obtenerComprasRecientes,
    eliminarCompra,
    marcarComoPagado,
    clearError,
  } = useCompras();

  const [busqueda, setBusqueda] = useState("");
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] =
    useState<CompraMateriaPrimaResponse | null>(null);
  const [filtroReciente, setFiltroReciente] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [compraAEliminar, setCompraAEliminar] =
    useState<CompraMateriaPrimaResponse | null>(null);
  const [showModalPago, setShowModalPago] = useState(false);
  const [compraAPagar, setCompraAPagar] =
    useState<CompraMateriaPrimaResponse | null>(null);
  const [pagado, setPagado] = useState(false);

  // Hook para notificaciones toast
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras]);

  const handleVerDetalle = (compra: CompraMateriaPrimaResponse) => {
    setCompraSeleccionada(compra);
    setShowDetalleModal(true);
  };

  const handleDelete = (compra: CompraMateriaPrimaResponse) => {
    setCompraAEliminar(compra);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!compraAEliminar) return;

    try {
      await eliminarCompra(compraAEliminar.id);
      success("Compra eliminada exitosamente", "¡Éxito!");
      setShowDeleteModal(false);
      setCompraAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar la compra:", err);
      showError(
        "No se puede eliminar esta compra ya que los lotes ya han sido utilizados.",
        "Error"
      );
    } finally {
      setShowDeleteModal(false);
      setCompraAEliminar(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCompraAEliminar(null);
  };

  const handleMarcarPago = (compra: CompraMateriaPrimaResponse) => {
    setCompraAPagar(compra);
    setShowModalPago(true);
  };

  const deshabilitarBotonPago = (compra: CompraMateriaPrimaResponse) => {
    return compra.estadoPago === "PAGADO";
  };

  const handleConfirmarPago = async () => {
    if (!compraAPagar) return;

    try {
      await marcarComoPagado(compraAPagar.id);
      success("Compra marcada como pagada exitosamente", "¡Éxito!");
      setShowModalPago(false);
      setCompraAPagar(null);
    } catch (error) {
      console.error("Error al marcar como pagado:", error);
      showError("Error al actualizar el estado de pago", "Error");
    }
  };

  const handleCancelPago = () => {
    setShowModalPago(false);
    setCompraAPagar(null);
  };

  const handleFiltrarRecientes = async (dias: number | null) => {
    setFiltroReciente(dias);
    if (dias === null) {
      await cargarCompras();
    } else {
      await obtenerComprasRecientes(dias);
    }
  };

  // Filtrar compras por búsqueda
  const comprasFiltradas = compras.filter(
    (compra) =>
      compra.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
      compra.numDoc.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Definir columnas de la tabla
  const columns = [
    {
      key: "numDoc",
      label: "N° Documento",
      render: (compra: CompraMateriaPrimaResponse) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{compra.numDoc}</div>
          <div className="text-gray-500 text-xs">{compra.tipoDoc}</div>
        </div>
      ),
    },
    {
      key: "proveedor",
      label: "Proveedor",
      render: (compra: CompraMateriaPrimaResponse) => (
        <span className="text-sm text-gray-900">{compra.proveedor}</span>
      ),
    },
    {
      key: "fechaCompra",
      label: "Fecha Compra",
      render: (compra: CompraMateriaPrimaResponse) => (
        <span className="text-sm text-gray-900">
          {new Date(compra.fechaCompra).toLocaleDateString("es-CL")}
        </span>
      ),
    },
    {
      key: "fechaPago",
      label: "Fecha Pago",
      render: (compra: CompraMateriaPrimaResponse) => (
        <span className="text-sm">
          {compra.fechaPago ? (
            <span className="text-green-600 font-medium">
              {new Date(compra.fechaPago).toLocaleDateString("es-CL")}
            </span>
          ) : (
            <span className="text-orange-500">Pendiente</span>
          )}
        </span>
      ),
    },
    {
      key: "totalLotes",
      label: "Lotes",
      render: (compra: CompraMateriaPrimaResponse) => (
        <span className="text-sm text-gray-900 font-medium">
          {compra.totalLotes}
        </span>
      ),
    },
    {
      key: "montoTotal",
      label: "Monto Total",
      render: (compra: CompraMateriaPrimaResponse) => (
        <span className="text-sm text-gray-900 font-semibold">
          ${compra.montoTotal.toLocaleString("es-CL")}
        </span>
      ),
    },
    {
      key: "estadoPago",
      label: "Estado Pago",
      render: (compra: CompraMateriaPrimaResponse) => (
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${compra.estadoPago === "PAGADO"
            ? "bg-green-100 text-green-700"
            : "bg-orange-100 text-orange-700"
            }`}
        >
          {compra.estadoPago}
        </span>
      ),
    },
  ];

  // Exportar compra a PDF
  const handleExportarPDF = async (compra: CompraMateriaPrimaResponse) => {
    try {
      const { CompraPDFService } = await import(
        "@/services/exportacion/compraPdfService"
      );
      await CompraPDFService.exportarCompra(compra);
      success("PDF generado exitosamente", "¡Éxito!");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showError("Error al generar el PDF de la compra", "Error");
    }
  };

  // Exportar múltiples compras
  const handleExportarTodasPDF = async () => {
    try {
      if (comprasFiltradas.length === 0) {
        showError("No hay compras para exportar", "Sin datos");
        return;
      }
      const { CompraPDFService } = await import(
        "@/services/exportacion/compraPdfService"
      );
      await CompraPDFService.exportarVariasCompras(comprasFiltradas);
      success("PDF generado exitosamente", "¡Éxito!");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showError("Error al generar el PDF del reporte", "Error");
    }
  };

  // Definir acciones de la tabla
  const actions = [
    {
      label: "Ver Detalle",
      icon: "visibility",
      variant: "primary" as const,
      onClick: (compra: CompraMateriaPrimaResponse) => handleVerDetalle(compra),
    },
    {
      label: "Exportar PDF",
      icon: "picture_as_pdf",
      variant: "secondary" as const,
      onClick: (compra: CompraMateriaPrimaResponse) =>
        handleExportarPDF(compra),
    },
    {
      label: "Marcar como Pagado",
      icon: "payments",
      variant: "success" as const,
      onClick: (compra: CompraMateriaPrimaResponse) => {
        if (compra.estadoPago !== "PAGADO") {
          handleMarcarPago(compra);
        }
      },
      disabled: (compra: CompraMateriaPrimaResponse) =>
        compra.estadoPago === "PAGADO",
    },
    {
      label: "Eliminar",
      icon: "delete",
      variant: "danger" as const,
      onClick: (compra: CompraMateriaPrimaResponse) => handleDelete(compra),
    },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header con filtros */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Historial de Compras
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Consulta todas las compras de materias primas registradas
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Botón exportar todas */}
          <Button
            variant="secondary"
            onClick={handleExportarTodasPDF}
            disabled={comprasFiltradas.length === 0}
            className="text-sm cursor-pointer whitespace-nowrap"
          >
            <MaterialIcon name="picture_as_pdf" className="mr-2" />
            Exportar a PDF ({comprasFiltradas.length})
          </Button>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filtroReciente === null ? "primary" : "secondary"}
              onClick={() => handleFiltrarRecientes(null)}
              className="text-sm"
            >
              Todas
            </Button>
            <Button
              variant={filtroReciente === 7 ? "primary" : "secondary"}
              onClick={() => handleFiltrarRecientes(7)}
              className="text-sm"
            >
              7 días
            </Button>
            <Button
              variant={filtroReciente === 30 ? "primary" : "secondary"}
              onClick={() => handleFiltrarRecientes(30)}
              className="text-sm"
            >
              30 días
            </Button>
            <Button
              variant={filtroReciente === 90 ? "primary" : "secondary"}
              onClick={() => handleFiltrarRecientes(90)}
              className="text-sm"
            >
              90 días
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={clearError}
          >
            <MaterialIcon name="close" className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabla de compras */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <DataTable
          data={comprasFiltradas}
          columns={columns}
          actions={actions}
          loading={loading}
          searchValue={busqueda}
          onSearch={setBusqueda}
          searchPlaceholder="Buscar por proveedor o N° documento..."
          emptyMessage="No hay compras registradas"
          pagination={{
            enabled: true,
            serverSide: false,
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 25, 50],
          }}
        />
      </motion.div>

      {/* Modal de Detalle */}
      <AnimatePresence>
        {showDetalleModal && compraSeleccionada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetalleModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-full md:max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Detalle de Compra
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    {compraSeleccionada.tipoDoc} {compraSeleccionada.numDoc}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MaterialIcon name="close" className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Proveedor
                  </label>
                  <p className="text-base text-gray-900 font-medium">
                    {compraSeleccionada.proveedor}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Fecha de Compra
                  </label>
                  <p className="text-sm md:text-base text-gray-900">
                    {new Date(
                      compraSeleccionada.fechaCompra
                    ).toLocaleDateString("es-CL", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Fecha de Pago
                  </label>
                  <p className="text-base text-gray-900">
                    {compraSeleccionada.fechaPago ? (
                      <span className="text-green-600 font-medium">
                        {new Date(
                          compraSeleccionada.fechaPago
                        ).toLocaleDateString("es-CL")}
                      </span>
                    ) : (
                      <span className="text-orange-500 font-medium">
                        Pendiente
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Monto Total
                  </label>
                  <p className="text-lg text-gray-900 font-bold">
                    ${compraSeleccionada.montoTotal.toLocaleString("es-CL")}
                  </p>
                </div>
              </div>

              {/* Lotes */}
              <div>
                <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3">
                  Lotes ({compraSeleccionada.lotes.length})
                </h4>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full text-left text-xs md:text-sm min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 md:px-4 py-3 text-gray-700 font-medium">
                          Materia Prima
                        </th>
                        <th className="px-2 md:px-4 py-3 text-gray-700 font-medium">
                          Cantidad
                        </th>
                        <th className="px-2 md:px-4 py-3 text-gray-700 font-medium">
                          Stock Actual
                        </th>
                        <th className="px-2 md:px-4 py-3 text-gray-700 font-medium">
                          Costo Unit.
                        </th>
                        <th className="px-2 md:px-4 py-3 text-gray-700 font-medium">
                          Subtotal
                        </th>
                        <th className="px-2 md:px-4 py-3 text-gray-700 font-medium">
                          N° Lote
                        </th>
                        <th className="px-2 md:px-4 py-3 text-gray-700 font-medium">
                          Vencimiento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {compraSeleccionada.lotes.map((lote, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-2 md:px-4 py-3 text-gray-900">
                            {lote.materiaPrimaNombre}
                          </td>
                          <td className="px-2 md:px-4 py-3 text-gray-900">
                            {lote.cantidad}
                          </td>
                          <td className="px-2 md:px-4 py-3">
                            <span
                              className={`font-medium ${(lote.stockActual ?? lote.cantidad) <
                                lote.cantidad
                                ? "text-orange-600"
                                : "text-green-600"
                                }`}
                            >
                              {lote.stockActual ?? lote.cantidad}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-3 text-gray-900">
                            ${lote.costoUnitario.toLocaleString("es-CL")}
                          </td>
                          <td className="px-2 md:px-4 py-3 text-gray-900 font-semibold">
                            $
                            {(
                              lote.cantidad * lote.costoUnitario
                            ).toLocaleString("es-CL")}
                          </td>
                          <td className="px-2 md:px-4 py-3 text-gray-900">
                            {lote.numeroLote || "-"}
                          </td>
                          <td className="px-2 md:px-4 py-3 text-gray-900">
                            {lote.fechaVencimiento
                              ? new Date(
                                lote.fechaVencimiento
                              ).toLocaleDateString("es-CL")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => handleExportarPDF(compraSeleccionada)}
                  className="w-full sm:w-auto"
                >
                  <MaterialIcon name="picture_as_pdf" className="mr-2" />
                  Exportar PDF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDetalleModal(false)}
                  className="w-full sm:w-auto"
                >
                  Cerrar
                </Button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/** Modal de confirmación para eliminar compra */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Compra"
        message="¿Está seguro de que desea eliminar esta compra? Solo podrás eliminarlo si es que no has utilizado los lotes asociados."
        itemName={compraAEliminar?.numDoc}
      />

      {/** Modal de confirmación para marcar como pagado */}
      <ModalPagoCompra
        isOpen={showModalPago}
        onClose={handleCancelPago}
        onConfirm={handleConfirmarPago}
        compra={compraAPagar}
        loading={loading}
      />

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
