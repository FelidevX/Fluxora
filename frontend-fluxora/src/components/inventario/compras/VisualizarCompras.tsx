"use client";

import { useState, useEffect } from "react";
import { useCompras } from "@/hooks/useCompras";
import { CompraMateriaPrimaResponse } from "@/types/inventario";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

export default function VisualizarCompras() {
  const {
    compras,
    loading,
    error,
    cargarCompras,
    obtenerComprasRecientes,
    eliminarCompra,
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
      setShowDeleteModal(false);
      setCompraAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar la compra:", err);
    } finally {
      setShowDeleteModal(false);
      setCompraAEliminar(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCompraAEliminar(null);
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
          {compra.montoTotal.toLocaleString("es-CL", {
            style: "currency",
            currency: "CLP",
          })}
        </span>
      ),
    },
  ];

  // Definir acciones de la tabla
  const actions = [
    {
      label: "Ver Detalle",
      icon: "visibility",
      variant: "primary" as const,
      onClick: (compra: CompraMateriaPrimaResponse) => handleVerDetalle(compra),
    },
    {
      label: "Eliminar",
      icon: "delete",
      variant: "danger" as const,
      onClick: (compra: CompraMateriaPrimaResponse) => handleDelete(compra),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Historial de Compras
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Consulta todas las compras de materias primas registradas
          </p>
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2">
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

      {/* Modal de Detalle */}
      {showDetalleModal && compraSeleccionada && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Detalle de Compra
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
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

            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-base text-gray-900">
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
                    {compraSeleccionada.montoTotal.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    })}
                  </p>
                </div>
              </div>

              {/* Lotes */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Lotes ({compraSeleccionada.lotes.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Materia Prima
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Stock Actual
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Costo Unit.
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Subtotal
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          N° Lote
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Vencimiento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {compraSeleccionada.lotes.map((lote, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">
                            {lote.materiaPrimaNombre}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {lote.cantidad}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-medium ${
                                (lote.stockActual ?? lote.cantidad) <
                                lote.cantidad
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {lote.stockActual ?? lote.cantidad}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {lote.costoUnitario.toLocaleString("es-CL", {
                              style: "currency",
                              currency: "CLP",
                            })}
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-semibold">
                            {(
                              lote.cantidad * lote.costoUnitario
                            ).toLocaleString("es-CL", {
                              style: "currency",
                              currency: "CLP",
                            })}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {lote.numeroLote || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
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

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetalleModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/** Modal de confirmación para eliminar compra */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Compra"
        message="¿Está seguro de que desea eliminar esta compra? Esta acción no se puede deshacer y se eliminarán también todos los lotes asociados."
        itemName={compraAEliminar?.numDoc}
      />
    </div>
  );
}
