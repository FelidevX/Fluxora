"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MateriaPrimaDTO, MateriaPrima } from "@/types/inventario";
import { useMaterias } from "@/hooks/useMaterias";
import { useCurrentDate } from "@/hooks/useDate";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";
import ConfirmDeleteModalText from "@/components/ui/ConfirmDeleteModalText";

export default function GestionMateriasPrimas() {
  const searchParams = useSearchParams();
  const {
    materias,
    loading,
    error,
    cargarMaterias,
    crearMateria,
    eliminarMateria,
    clearError,
  } = useMaterias();

  const { currentDate } = useCurrentDate();

  // Hook para notificaciones toast
  const { toasts, removeToast, success, error: showError } = useToast();

  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materiaAActualizar, setMateriaAActualizar] =
    useState<MateriaPrima | null>(null);
  const [materiaAEliminar, setMateriaAEliminar] = useState<MateriaPrima | null>(
    null
  );
  const [lotes, setLotes] = useState<
    Array<{
      id?: number;
      materiaPrimaId: number;
      cantidad: number;
      stockActual?: number;
      costoUnitario: number;
      fechaCompra: string;
      fechaVencimiento?: string | null;
    }>
  >([]);
  const [formulario, setFormulario] = useState<MateriaPrimaDTO>({
    nombre: "",
    unidad: "kg",
  });

  // Cargar materias al montar el componente
  useEffect(() => {
    cargarMaterias();
  }, []);

  // Detectar si se debe abrir el formulario automáticamente
  useEffect(() => {
    const action = searchParams?.get("action");
    const suggestion = searchParams?.get("suggestion");

    if (action === "create") {
      setShowForm(true);

      // Si hay una sugerencia de nombre, pre-llenar el formulario
      if (suggestion) {
        setFormulario((prev) => ({
          ...prev,
          nombre: suggestion,
        }));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulario.nombre) {
      return;
    }

    try {
      // Create catalog materia (stock will be added by creating lotes)
      await crearMateria({
        nombre: formulario.nombre,
        unidad: formulario.unidad,
      });

      success("Materia prima creada exitosamente", "¡Éxito!");
      // Reset del formulario (solo catálogo)
      setFormulario({ nombre: "", unidad: "kg" });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      showError("Error al crear la materia prima", "Error");
    }
  };

  const handleDelete = (materia: MateriaPrima) => {
    setMateriaAEliminar(materia);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!materiaAEliminar) return;

    try {
      await eliminarMateria(materiaAEliminar.id);
      success("Materia prima eliminada exitosamente", "¡Éxito!");
      setShowDeleteModal(false);
      setMateriaAEliminar(null);
    } catch (err) {
      console.error(err);
      showError("Error al eliminar la materia prima", "Error");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setMateriaAEliminar(null);
  };

  const handleAgregarStock = (materia: MateriaPrima) => {
    setMateriaAActualizar(materia);
    // Cargar lotes existentes
    fetchLotes(materia.id);
    setShowStockModal(true);
  };

  const fetchLotes = async (materiaId: number) => {
    try {
      let token = localStorage.getItem("auth_token");

      if (token?.startsWith("Bearer ")) {
        token = token.substring(7);
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/materias-primas/${materiaId}/lotes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Error al obtener lotes");
      const data = await res.json();
      // Filtrar solo lotes con stock_actual > 0
      const lotesConStock = Array.isArray(data)
        ? data.filter((lote: any) => {
            // Usar stockActual si existe, sino usar cantidad como fallback
            const stock =
              lote.stockActual !== undefined ? lote.stockActual : lote.cantidad;
            return stock > 0;
          })
        : [];
      setLotes(lotesConStock);
    } catch (err) {
      console.error("Error fetching lotes:", err);
      setLotes([]);
    }
  };

  const handleCancelStock = () => {
    setShowStockModal(false);
    setMateriaAActualizar(null);
  };

  // Filtrar materias primas por búsqueda (nombre o unidad)
  const materiasFiltradas = materias.filter(
    (materia) =>
      (materia.nombre?.toLowerCase() || "").includes(busqueda.toLowerCase()) ||
      (materia.unidad?.toLowerCase() || "").includes(busqueda.toLowerCase())
  );

  // Definir columnas de la tabla
  const columns = [
    {
      key: "nombre",
      label: "Producto",
      render: (materia: MateriaPrima) => (
        <span className="text-xs md:text-sm font-medium text-gray-900">
          {materia.nombre || "Sin nombre"}
        </span>
      ),
    },
    {
      key: "unidad",
      label: "Unidad",
      render: (materia: MateriaPrima) => (
        <span className="text-xs md:text-sm text-gray-900">
          {materia.unidad || ""}
        </span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (materia: MateriaPrima) => (
        <span className="text-xs md:text-sm text-gray-900">
          {materia.cantidad ?? 0} {materia.unidad || ""}
        </span>
      ),
    },
  ];

  // Definir acciones de la tabla
  const actions = [
    {
      label: "Ver Lotes",
      icon: "visibility",
      variant: "primary" as const,
      onClick: (materia: MateriaPrima) => handleAgregarStock(materia),
    },
    {
      label: "Eliminar",
      icon: "delete",
      variant: "danger" as const,
      onClick: (materia: MateriaPrima) => handleDelete(materia),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
      >
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Catálogo de Materias Primas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona las materias primas disponibles en el sistema
          </p>
        </div>
        <Button
          variant="primary"
          icon="add"
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto text-sm"
        >
          <span className="sm:inline">Nueva Materia Prima</span>
        </Button>
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

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900">
                Nueva Materia Prima
              </h3>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
            <Input
              label="Nombre de la materia prima:"
              type="text"
              value={formulario.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Unidad:
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                value={formulario.unidad}
                onChange={(e) =>
                  setFormulario({ ...formulario, unidad: e.target.value })
                }
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="L">Litros (L)</option>
                <option value="U">Unidades (U)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                variant="success"
                className="w-full sm:w-auto text-sm"
              >
                Guardar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                className="w-full sm:w-auto text-sm"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla usando DataTable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <DataTable
          data={materiasFiltradas}
          columns={columns}
          actions={actions}
          loading={loading}
          searchValue={busqueda}
          onSearch={setBusqueda}
          searchPlaceholder="Buscar materias primas..."
          emptyMessage="No hay materias primas registradas"
          pagination={{
            enabled: true,
            serverSide: false,
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 25, 50],
          }}
        />
      </motion.div>

      {/* Modal de Visualizar Lotes */}
      <AnimatePresence>
        {showStockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
            onClick={handleCancelStock}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                    Visualizar Lotes
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mt-1 truncate">
                    {materiaAActualizar?.nombre}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    Stock total disponible:{" "}
                    <span className="font-semibold text-green-600">
                      {materiaAActualizar?.cantidad ?? 0}
                    </span>{" "}
                    {materiaAActualizar?.unidad}
                  </p>
                </div>
                <button
                  onClick={handleCancelStock}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <MaterialIcon
                    name="close"
                    className="w-5 h-5 md:w-6 md:h-6"
                  />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <p className="text-xs md:text-sm text-gray-600 mb-4">
                Lotes con stock disponible (ordenados por fecha de vencimiento)
              </p>

              {lotes && lotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 md:py-3 px-2 md:px-4 text-gray-700 font-medium">
                          <span className="hidden sm:inline">Fecha Compra</span>
                          <span className="sm:hidden">Compra</span>
                        </th>
                        <th className="py-2 md:py-3 px-2 md:px-4 text-gray-700 font-medium">
                          <span className="hidden sm:inline">
                            Fecha Vencimiento
                          </span>
                          <span className="sm:hidden">Venc.</span>
                        </th>
                        <th className="py-2 md:py-3 px-2 md:px-4 text-gray-700 font-medium text-right">
                          <span className="hidden sm:inline">
                            Cantidad Original
                          </span>
                          <span className="sm:hidden">Original</span>
                        </th>
                        <th className="py-2 md:py-3 px-2 md:px-4 text-gray-700 font-medium text-right">
                          <span className="hidden sm:inline">Stock Actual</span>
                          <span className="sm:hidden">Stock</span>
                        </th>
                        <th className="py-2 md:py-3 px-2 md:px-4 text-gray-700 font-medium text-right">
                          <span className="hidden sm:inline">
                            Costo Unitario
                          </span>
                          <span className="sm:hidden">Costo</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lotes.map((lote) => {
                        const stockActual = lote.stockActual ?? lote.cantidad;
                        const porcentajeConsumido =
                          ((lote.cantidad - stockActual) / lote.cantidad) * 100;

                        return (
                          <tr
                            key={
                              lote.id ??
                              `${lote.materiaPrimaId}-${lote.fechaCompra}-${lote.cantidad}`
                            }
                            className="hover:bg-gray-50"
                          >
                            <td className="py-2 md:py-3 px-2 md:px-4 text-gray-900">
                              {lote.fechaCompra
                                ? new Date(lote.fechaCompra).toLocaleDateString(
                                    "es-CL"
                                  )
                                : "-"}
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4">
                              {lote.fechaVencimiento ? (
                                <span className="text-orange-600 font-medium">
                                  {new Date(
                                    lote.fechaVencimiento
                                  ).toLocaleDateString("es-CL")}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  <span className="hidden sm:inline">
                                    Sin vencimiento
                                  </span>
                                  <span className="sm:hidden">-</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-right text-gray-900">
                              {lote.cantidad} {materiaAActualizar?.unidad}
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-right">
                              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1">
                                <span
                                  className={`font-semibold ${
                                    porcentajeConsumido > 50
                                      ? "text-orange-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {stockActual} {materiaAActualizar?.unidad}
                                </span>
                                {porcentajeConsumido > 0 && (
                                  <span className="text-xs text-gray-500">
                                    ({porcentajeConsumido.toFixed(0)}% usado)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 md:py-3 px-2 md:px-4 text-right text-gray-900">
                              {typeof lote.costoUnitario === "number"
                                ? lote.costoUnitario.toLocaleString("es-CL", {
                                    style: "currency",
                                    currency: "CLP",
                                  })
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MaterialIcon
                    name="inventory_2"
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  />
                  <p className="text-sm md:text-base text-gray-500">
                    No hay lotes con stock disponible para esta materia prima.
                  </p>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">
                    Los lotes consumidos completamente no se muestran aquí.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={handleCancelStock}
                  className="w-full sm:w-auto text-sm"
                >
                  Cerrar
                </Button>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModalText
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Materia Prima"
        message="¿Está seguro de que desea eliminar esta materia prima? Esta acción no se puede deshacer y se eliminarán también todos los lotes asociados."
        itemName={materiaAEliminar?.nombre}
        requireConfirmation={true}
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
