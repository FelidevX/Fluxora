"use client";

import { useState, useEffect } from "react";
import { LoteProducto, Producto } from "@/types/inventario";
import { RecetaMaestra } from "@/types/produccion";
import { useProductos } from "@/hooks/useProductos";
import { useRecetas } from "@/hooks/useRecetas";
import { useCurrentDate } from "@/hooks/useDate";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import MaterialIcon from "@/components/ui/MaterialIcon";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModalText";

interface LoteProductoModalProps {
  producto: Producto;
  isOpen: boolean;
  onClose: () => void;
}

export default function LoteProductoModal({
  producto,
  isOpen,
  onClose,
}: LoteProductoModalProps) {
  const {
    cargarLotes,
    crearLote,
    actualizarLote,
    eliminarLote,
    error,
    clearError,
  } = useProductos();
  const { recetas, loading: loadingRecetas } = useRecetas();
  const { currentDate } = useCurrentDate();

  const [lotes, setLotes] = useState<LoteProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<RecetaMaestra | null>(null);
  const [multiplicador, setMultiplicador] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loteAEliminar, setLoteAEliminar] = useState<LoteProducto | null>(null);

  // Hook para notificaciones
  const { toasts, removeToast, success, error: showError, warning } = useToast();

  // Formulario para nuevo lote
  const [formulario, setFormulario] = useState({
    cantidadProducida: 0,
    stockActual: 0,
    costoProduccionTotal: 0,
    costoUnitario: 0,
    fechaProduccion: currentDate || new Date().toISOString().split("T")[0],
    fechaVencimiento: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadLotes();

      // Intentar encontrar la receta de 3 formas:
      // 1. Por recetaMaestraId (si existe)
      // 2. Por nombre exacto del producto
      // 3. Por nombre similar (case-insensitive)

      let recetaEncontrada: RecetaMaestra | undefined;

      if (producto.recetaMaestraId && recetas.length > 0) {
        recetaEncontrada = recetas.find(
          (r) => r.id === producto.recetaMaestraId
        );
      }

      if (!recetaEncontrada && recetas.length > 0) {
        // Buscar por nombre exacto
        recetaEncontrada = recetas.find((r) => r.nombre === producto.nombre);
      }

      if (!recetaEncontrada && recetas.length > 0) {
        // Buscar por nombre similar (case-insensitive)
        recetaEncontrada = recetas.find(
          (r) => r.nombre.toLowerCase() === producto.nombre.toLowerCase()
        );
      }

      if (recetaEncontrada) {
        setRecetaSeleccionada(recetaEncontrada);
        setMultiplicador(1);
      }
    }
  }, [
    isOpen,
    producto.id,
    producto.nombre,
    producto.recetaMaestraId,
    recetas,
    loadingRecetas,
  ]);

  // Calcular costo de producción cuando cambia la receta o el multiplicador
  useEffect(() => {
    if (recetaSeleccionada && multiplicador > 0) {
      calcularCostoProduccion();
    }
  }, [recetaSeleccionada, multiplicador]);

  const loadLotes = async () => {
    setLoading(true);
    try {
      const lotesData = await cargarLotes(producto.id);
      setLotes(lotesData);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCostoProduccion = () => {
    if (!recetaSeleccionada) return;

    // Calcular el costo total basado en PPP de ingredientes y multiplicador
    const costoTotal = recetaSeleccionada.ingredientes.reduce(
      (total, ingrediente) => {
        const ppp = ingrediente.ppp || 0;
        const cantidadNecesaria = ingrediente.cantidadNecesaria * multiplicador;
        return total + cantidadNecesaria * ppp;
      },
      0
    );

    // Calcular cantidad producida
    const cantidadProducida = Math.round(
      recetaSeleccionada.cantidadBase * multiplicador
    );

    // Calcular costo unitario
    const costoUnitario =
      cantidadProducida > 0 ? costoTotal / cantidadProducida : 0;

    setFormulario((prev) => ({
      ...prev,
      cantidadProducida,
      stockActual: cantidadProducida,
      costoProduccionTotal: costoTotal,
      costoUnitario: costoUnitario,
    }));
  };

  const handleMultiplicadorChange = (valor: number) => {
    if (valor > 0) {
      setMultiplicador(valor);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recetaSeleccionada) {
      warning("Debe seleccionar una receta", "Receta Requerida");
      return;
    }

    if (formulario.cantidadProducida <= 0) {
      warning("La cantidad producida debe ser mayor a 0", "Cantidad Inválida");
      return;
    }

    if (formulario.costoProduccionTotal <= 0) {
      warning("El costo de producción debe ser mayor a 0", "Costo Inválido");
      return;
    }

    try {
      setLoading(true);

      const nuevoLote: Omit<LoteProducto, "id"> = {
        productoId: producto.id,
        cantidadProducida: formulario.cantidadProducida,
        stockActual: formulario.stockActual,
        costoProduccionTotal: formulario.costoProduccionTotal,
        costoUnitario: formulario.costoUnitario,
        fechaProduccion: formulario.fechaProduccion,
        fechaVencimiento: formulario.fechaVencimiento || null,
        estado: "disponible",
      };

      await crearLote(producto.id, nuevoLote);
      await loadLotes();

      success("Producción registrada exitosamente", "¡Lote Creado!");

      // Reset formulario
      setFormulario({
        cantidadProducida: 0,
        stockActual: 0,
        costoProduccionTotal: 0,
        costoUnitario: 0,
        fechaProduccion: currentDate || new Date().toISOString().split("T")[0],
        fechaVencimiento: "",
      });
      setRecetaSeleccionada(null);
      setMultiplicador(1);
      setShowForm(false);
    } catch (err) {
      console.error("Error al crear lote:", err);
      
      // Determinar el título y mensaje según el error
      let errorTitle = "Error al Crear Lote";
      let errorMessage = "Error al crear el lote. Por favor, inténtelo de nuevo.";
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Determinar el título según el contenido del mensaje
        if (errorMessage.toLowerCase().includes("stock insuficiente")) {
          errorTitle = "Stock Insuficiente";
        } else if (errorMessage.toLowerCase().includes("receta")) {
          errorTitle = "Receta No Encontrada";
        } else if (errorMessage.toLowerCase().includes("no encontrado")) {
          errorTitle = "Recurso No Encontrado";
        }
      }
      
      showError(errorMessage, errorTitle);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (lote: LoteProducto) => {
    setLoteAEliminar(lote);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!loteAEliminar || !loteAEliminar.id) return;

    try {
      setLoading(true);
      await eliminarLote(producto.id, loteAEliminar.id);
      setShowDeleteModal(false);
      setLoteAEliminar(null);
      await loadLotes();
      success("Lote eliminado exitosamente", "¡Lote Eliminado!");
    } catch (err) {
      console.error("Error al eliminar lote:", err);
      showError(
        error || "Error al eliminar el lote. Por favor, inténtelo de nuevo.",
        "Error al Eliminar"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setLoteAEliminar(null);
    clearError();
  };

  if (!isOpen) return null;

  const stockTotal = lotes.reduce((sum, lote) => sum + lote.stockActual, 0);

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Registrar Producción
            </h2>
            <p className="text-gray-600">{producto.nombre}</p>
            <p className="text-sm text-gray-500">
              Stock actual: <span className="font-semibold">{stockTotal}</span>{" "}
              unidades
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        <div className="p-6">
          {/* Lotes existentes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Lotes existentes
            </h3>
            {loading && lotes.length === 0 ? (
              <p className="text-gray-500">Cargando lotes...</p>
            ) : lotes.length === 0 ? (
              <p className="text-gray-500">
                No hay lotes registrados para este producto
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600">
                        Fecha producción
                      </th>
                      <th className="px-4 py-2 text-right text-gray-600">
                        Cantidad prod.
                      </th>
                      <th className="px-4 py-2 text-right text-gray-600">
                        Stock actual
                      </th>
                      <th className="px-4 py-2 text-right text-gray-600">
                        Costo Total
                      </th>
                      <th className="px-4 py-2 text-right text-gray-600">
                        Costo unit.
                      </th>
                      <th className="px-4 py-2 text-left text-gray-600">
                        Vencimiento
                      </th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotes.map((lote) => (
                      <tr
                        key={lote.id}
                        className="border-b hover:bg-gray-50 text-gray-600"
                      >
                        <td className="px-4 py-2">
                          {new Date(lote.fechaProduccion).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {lote.cantidadProducida}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {lote.stockActual}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-green-700">
                          $
                          {(lote.costoProduccionTotal || 0).toLocaleString(
                            "es-CL",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          $
                          {(lote.costoUnitario || 0).toLocaleString("es-CL", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-2">
                          {lote.fechaVencimiento
                            ? new Date(
                                lote.fechaVencimiento
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleDelete(lote)}
                            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                            title="Eliminar lote"
                          >
                            <MaterialIcon name="delete" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botón para mostrar formulario */}
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              variant="primary"
              className="mb-4"
            >
              <MaterialIcon name="add" className="mr-2" />
              Registrar Nueva Producción
            </Button>
          )}

          {/* Formulario para nuevo lote */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <h4 className="font-semibold mb-4 text-gray-700">
                Nueva producción
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Receta del Producto (automática, no editable) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Receta del Producto
                  </label>
                  {recetaSeleccionada ? (
                    <div className="w-full px-3 py-2 border border-green-300 rounded-md bg-green-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-green-800">
                            {recetaSeleccionada.nombre}
                          </p>
                          <p className="text-xs text-green-600">
                            {recetaSeleccionada.categoria} - Base:{" "}
                            {recetaSeleccionada.cantidadBase}{" "}
                            {recetaSeleccionada.unidadBase}
                          </p>
                        </div>
                        <MaterialIcon
                          name="check_circle"
                          className="text-green-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50">
                      <div className="flex items-start gap-2">
                        <MaterialIcon
                          name="warning"
                          className="text-red-600 mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-semibold text-red-700">
                            Este producto no tiene una receta asociada
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Producto: <strong>{producto.nombre}</strong>
                          </p>
                          <p className="text-xs text-red-600">
                            ID de receta:{" "}
                            {producto.recetaMaestraId || "No asignado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1"></p>
                </div>

                {/* Multiplicador */}
                {recetaSeleccionada && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      ¿Cuántas veces desea preparar la receta?
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={multiplicador}
                        onChange={(e) =>
                          handleMultiplicadorChange(Number(e.target.value))
                        }
                        min="1"
                        step="1"
                        required
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600">veces</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Base de receta: {recetaSeleccionada.cantidadBase}{" "}
                      {recetaSeleccionada.unidadBase}
                    </p>
                  </div>
                )}

                {/* Resumen de Costos de Producción */}
                {recetaSeleccionada && (
                  <div className="md:col-span-2">
                    {/* Tarjeta de Resumen Principal */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-bold text-gray-700 flex items-center">
                          <MaterialIcon
                            name="calculate"
                            className="mr-2 text-green-600"
                          />
                          Resumen de Costos de Producción
                        </h5>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          Calculado automáticamente
                        </span>
                      </div>

                      {/* Métricas principales */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-white rounded-md p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">
                            Cantidad a Producir
                          </p>
                          <p className="text-lg font-bold text-blue-700">
                            {formulario.cantidadProducida}
                          </p>
                          <p className="text-xs text-gray-500">
                            {recetaSeleccionada.unidadBase}
                          </p>
                        </div>
                        <div className="bg-white rounded-md p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">
                            Costo Total
                          </p>
                          <p className="text-lg font-bold text-green-700">
                            $
                            {formulario.costoProduccionTotal.toLocaleString(
                              "es-CL",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                          <p className="text-xs text-gray-500">CLP</p>
                        </div>
                        <div className="bg-white rounded-md p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">
                            Costo Unitario
                          </p>
                          <p className="text-lg font-bold text-orange-700">
                            $
                            {formulario.costoUnitario.toLocaleString("es-CL", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-gray-500">por unidad</p>
                        </div>
                      </div>

                      {/* Desglose de ingredientes */}
                      <div className="bg-white rounded-md p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                          <MaterialIcon
                            name="inventory_2"
                            className="mr-1 text-sm"
                          />
                          Desglose por Ingrediente:
                        </p>
                        <div className="space-y-1">
                          {recetaSeleccionada.ingredientes.map((ing, idx) => {
                            const cantidadTotal =
                              ing.cantidadNecesaria * multiplicador;
                            const costoIngrediente =
                              (ing.ppp || 0) * cantidadTotal;
                            const porcentaje =
                              formulario.costoProduccionTotal > 0
                                ? (costoIngrediente /
                                    formulario.costoProduccionTotal) *
                                  100
                                : 0;

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0"
                              >
                                <div className="flex-1">
                                  <span className="font-medium text-gray-700">
                                    {ing.materiaPrimaNombre}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    {cantidadTotal.toFixed(2)} {ing.unidad}
                                  </span>
                                  <span className="text-gray-400 ml-2">
                                    (PPP: $
                                    {(ing.ppp || 0).toLocaleString("es-CL")})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-gray-800">
                                    $
                                    {costoIngrediente.toLocaleString("es-CL", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                  <span className="text-gray-400 ml-2 text-[10px]">
                                    ({porcentaje.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 pt-2 border-t-2 border-green-200 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700">
                            COSTO TOTAL:
                          </span>
                          <span className="text-base font-bold text-green-700">
                            $
                            {formulario.costoProduccionTotal.toLocaleString(
                              "es-CL",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fecha de producción */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Fecha de producción:
                  </label>
                  <Input
                    type="date"
                    value={formulario.fechaProduccion}
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        fechaProduccion: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {/* Fecha de vencimiento */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Fecha de vencimiento *
                  </label>
                  <Input
                    type="date"
                    value={formulario.fechaVencimiento}
                    onChange={(e) =>
                      setFormulario((prev) => ({
                        ...prev,
                        fechaVencimiento: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !recetaSeleccionada}
                >
                  {loading
                    ? "Registrando..."
                    : !recetaSeleccionada
                    ? "Requiere receta asociada"
                    : "Registrar Producción"}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Mensaje de error (mantenerlo para errores del hook) */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={clearError}
              >
                <MaterialIcon name="close" className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar lote */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Lote de Producción"
        message={
          loteAEliminar &&
          loteAEliminar.stockActual !== loteAEliminar.cantidadProducida
            ? "Este lote ya ha sido utilizado parcialmente. ¿Está seguro de que desea eliminarlo? Esta acción no se puede deshacer."
            : "¿Está seguro de que desea eliminar este lote? Esta acción no se puede deshacer."
        }
        itemName={
          loteAEliminar
            ? `Lote del ${new Date(
                loteAEliminar.fechaProduccion
              ).toLocaleDateString("es-CL")} - Stock: ${
                loteAEliminar.stockActual
              }/${loteAEliminar.cantidadProducida}`
            : undefined
        }
        requireConfirmation={
          loteAEliminar
            ? loteAEliminar.stockActual !== loteAEliminar.cantidadProducida
            : false
        }
        isLoading={loading}
      />

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
