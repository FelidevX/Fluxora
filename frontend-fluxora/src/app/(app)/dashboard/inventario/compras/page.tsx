"use client";

import { useState, useEffect } from "react";
import { useCompras } from "@/hooks/useCompras";
import { CompraMateriaPrimaResponse } from "@/types/inventario";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Link from "next/link";

export default function ComprasPage() {
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

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras]);

  const handleVerDetalle = (compra: CompraMateriaPrimaResponse) => {
    setCompraSeleccionada(compra);
    setShowDetalleModal(true);
  };

  const handleEliminar = async (compra: CompraMateriaPrimaResponse) => {
    if (
      !confirm(
        `¿Está seguro de eliminar la compra ${compra.numDoc}? Solo se puede eliminar si los lotes no han sido consumidos.`
      )
    ) {
      return;
    }

    try {
      await eliminarCompra(compra.id);
    } catch (err) {
      // El error ya se maneja en el hook
    }
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
      onClick: (compra: CompraMateriaPrimaResponse) => handleEliminar(compra),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-4">
        <Link
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center font-bold cursor-pointer"
          href="/dashboard/inventario"
        >
          <MaterialIcon name="arrow_back" className="mr-1" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historial de Compras
          </h1>
          <p className="text-gray-600 mt-1">
            Consulte todas las compras registradas de materias primas
          </p>
        </div>
        <Link href="/dashboard/inventario/compras/registrar">
          <Button variant="primary" icon="add">
            Nueva Compra
          </Button>
        </Link>
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

      {/* Filtros rápidos */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 self-center">
            Filtrar por:
          </span>
          <Button
            variant={filtroReciente === null ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleFiltrarRecientes(null)}
          >
            Todas
          </Button>
          <Button
            variant={filtroReciente === 7 ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleFiltrarRecientes(7)}
          >
            Últimos 7 días
          </Button>
          <Button
            variant={filtroReciente === 30 ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleFiltrarRecientes(30)}
          >
            Últimos 30 días
          </Button>
          <Button
            variant={filtroReciente === 90 ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleFiltrarRecientes(90)}
          >
            Últimos 3 meses
          </Button>
        </div>
      </div>

      {/* Tabla de Compras */}
      <DataTable
        data={comprasFiltradas}
        columns={columns}
        actions={actions}
        loading={loading}
        searchValue={busqueda}
        onSearch={setBusqueda}
        searchPlaceholder="Buscar por proveedor o número de documento..."
        emptyMessage="No hay compras registradas"
        pagination={{
          enabled: true,
          serverSide: false,
          defaultPageSize: 10,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />

      {/* Modal de Detalle */}
      {showDetalleModal && compraSeleccionada && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Detalle de Compra
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {compraSeleccionada.numDoc} - {compraSeleccionada.tipoDoc}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MaterialIcon name="close" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Información de la Compra */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Proveedor</p>
                  <p className="text-base font-medium text-gray-900">
                    {compraSeleccionada.proveedor}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Compra</p>
                  <p className="text-base font-medium text-gray-900">
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
                  <p className="text-sm text-gray-600">Fecha de Pago</p>
                  <p className="text-base font-medium text-gray-900">
                    {compraSeleccionada.fechaPago ? (
                      new Date(compraSeleccionada.fechaPago).toLocaleDateString(
                        "es-CL",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    ) : (
                      <span className="text-orange-500 font-normal">
                        Pendiente
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Lotes</p>
                  <p className="text-base font-medium text-gray-900">
                    {compraSeleccionada.totalLotes}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="text-lg font-bold text-green-600">
                    {compraSeleccionada.montoTotal.toLocaleString("es-CL", {
                      style: "currency",
                      currency: "CLP",
                    })}
                  </p>
                </div>
              </div>

              {/* Tabla de Lotes */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Lotes de esta Compra
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-gray-700">ID Materia</th>
                        <th className="px-4 py-2 text-gray-700">Cantidad</th>
                        <th className="px-4 py-2 text-gray-700">
                          Stock Actual
                        </th>
                        <th className="px-4 py-2 text-gray-700">
                          Costo Unitario
                        </th>
                        <th className="px-4 py-2 text-gray-700">Subtotal</th>
                        <th className="px-4 py-2 text-gray-700">N° Lote</th>
                        <th className="px-4 py-2 text-gray-700">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compraSeleccionada.lotes.map((lote) => (
                        <tr key={lote.id} className="border-b">
                          <td className="px-4 py-2 text-gray-900">
                            #{lote.materiaPrimaId}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {lote.cantidad}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            <span
                              className={
                                lote.stockActual !== lote.cantidad
                                  ? "text-orange-600 font-medium"
                                  : ""
                              }
                            >
                              {lote.stockActual}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {lote.costoUnitario.toLocaleString("es-CL", {
                              style: "currency",
                              currency: "CLP",
                            })}
                          </td>
                          <td className="px-4 py-2 text-gray-900 font-semibold">
                            {(
                              lote.cantidad * lote.costoUnitario
                            ).toLocaleString("es-CL", {
                              style: "currency",
                              currency: "CLP",
                            })}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {lote.numeroLote || "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
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
              <Button
                variant="secondary"
                onClick={() => setShowDetalleModal(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
