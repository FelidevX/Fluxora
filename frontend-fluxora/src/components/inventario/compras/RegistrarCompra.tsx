"use client";

import { useState, useEffect } from "react";
import {
  CompraMateriaPrimaDTO,
  LoteCompraDTO,
  TipoDocumento,
} from "@/types/inventario";
import { useCompras } from "@/hooks/useCompras";
import { useMaterias } from "@/hooks/useMaterias";
import { useCurrentDate } from "@/hooks/useDate";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegistrarCompra() {
  const { crearCompra, loading, error, clearError } = useCompras();
  const { materias, cargarMaterias } = useMaterias();
  const { currentDate } = useCurrentDate();

  const [formulario, setFormulario] = useState<CompraMateriaPrimaDTO>({
    numDoc: "",
    tipoDoc: "FACTURA",
    proveedor: "",
    fechaCompra: currentDate || new Date().toISOString().split("T")[0],
    fechaPago: null,
    lotes: [],
  });

  const [loteActual, setLoteActual] = useState<LoteCompraDTO>({
    materiaPrimaId: 0,
    cantidad: 0,
    costoUnitario: 0,
    numeroLote: "",
    fechaVencimiento: null,
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Hook para notificaciones
  const { toasts, removeToast, success, warning } = useToast();

  useEffect(() => {
    cargarMaterias();
  }, [cargarMaterias]);

  const handleAgregarLote = () => {
    if (loteActual.materiaPrimaId === 0) {
      warning("Debe seleccionar una materia prima", "Materia Prima Requerida");
      return;
    }
    if (loteActual.cantidad <= 0) {
      warning("La cantidad debe ser mayor a 0", "Cantidad Inválida");
      return;
    }
    if (loteActual.costoUnitario <= 0) {
      warning("El costo unitario debe ser mayor a 0", "Costo Inválido");
      return;
    }

    // Obtener nombre de la materia prima
    const materia = materias.find((m) => m.id === loteActual.materiaPrimaId);
    const nombreMateria = materia?.nombre || "Desconocido";

    const nuevoLote: LoteCompraDTO = {
      ...loteActual,
      materiaPrimaNombre: nombreMateria,
    };

    setFormulario({
      ...formulario,
      lotes: [...formulario.lotes, nuevoLote],
    });

    // Resetear lote actual
    setLoteActual({
      materiaPrimaId: 0,
      cantidad: 0,
      costoUnitario: 0,
      numeroLote: "",
      fechaVencimiento: null,
    });
  };

  const handleEliminarLote = (index: number) => {
    const nuevosLotes = formulario.lotes.filter((_, i) => i !== index);
    setFormulario({ ...formulario, lotes: nuevosLotes });
  };

  const calcularMontoTotal = () => {
    return formulario.lotes.reduce(
      (total, lote) => total + lote.cantidad * lote.costoUnitario,
      0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formulario.lotes.length === 0) {
      warning("Debe agregar al menos un lote", "Lotes Requeridos");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmar = async () => {
    try {
      await crearCompra(formulario);
      setShowConfirmModal(false);
      setShowSuccessMessage(true);
      success("¡Compra registrada exitosamente!", "Compra Registrada");

      // Resetear formulario
      setFormulario({
        numDoc: "",
        tipoDoc: "FACTURA",
        proveedor: "",
        fechaCompra: currentDate || new Date().toISOString().split("T")[0],
        fechaPago: null,
        lotes: [],
      });

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setShowConfirmModal(false);
    }
  };

  const handleLimpiarFormulario = () => {
    setFormulario({
      numDoc: "",
      tipoDoc: "FACTURA",
      proveedor: "",
      fechaCompra: currentDate || new Date().toISOString().split("T")[0],
      fechaPago: null,
      lotes: [],
    });
    setLoteActual({
      materiaPrimaId: 0,
      cantidad: 0,
      costoUnitario: 0,
      numeroLote: "",
      fechaVencimiento: null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Registrar Nueva Compra
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Complete los datos de la compra y agregue los lotes de materias primas
        </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la Compra */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Datos de la Compra
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de Documento:"
              type="text"
              value={formulario.numDoc}
              onChange={(e) =>
                setFormulario({ ...formulario, numDoc: e.target.value })
              }
              placeholder="Ej: F-001234"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento:
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formulario.tipoDoc}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    tipoDoc: e.target.value as TipoDocumento,
                  })
                }
                required
              >
                <option value="FACTURA">Factura</option>
                <option value="BOLETA">Boleta</option>
              </select>
            </div>

            <Input
              label="Proveedor:"
              type="text"
              value={formulario.proveedor}
              onChange={(e) =>
                setFormulario({ ...formulario, proveedor: e.target.value })
              }
              placeholder="Ej: Distribuidora ABC"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Compra:
              </label>
              <input
                type="date"
                value={formulario.fechaCompra}
                onChange={(e) =>
                  setFormulario({ ...formulario, fechaCompra: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Pago (Opcional):
              </label>
              <input
                type="date"
                value={formulario.fechaPago || ""}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    fechaPago: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Agregar Lotes */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Agregar Lotes de Materias Primas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materia Prima:
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={loteActual.materiaPrimaId}
                onChange={(e) =>
                  setLoteActual({
                    ...loteActual,
                    materiaPrimaId: Number(e.target.value),
                  })
                }
              >
                <option value={0}>Seleccione...</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre} ({materia.unidad})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Cantidad:"
              type="number"
              value={loteActual.cantidad}
              onChange={(e) =>
                setLoteActual({
                  ...loteActual,
                  cantidad: parseFloat(e.target.value) || 0,
                })
              }
              min="0"
              step="0.01"
              placeholder="0"
            />

            <Input
              label="Costo Unitario (CLP):"
              type="number"
              value={loteActual.costoUnitario}
              onChange={(e) =>
                setLoteActual({
                  ...loteActual,
                  costoUnitario: parseFloat(e.target.value) || 0,
                })
              }
              min="0"
              step="0.01"
              placeholder="0"
            />

            <Input
              label="Número de Lote (opcional):"
              type="text"
              value={loteActual.numeroLote || ""}
              onChange={(e) =>
                setLoteActual({ ...loteActual, numeroLote: e.target.value })
              }
              placeholder="Ej: L-2025-001"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento (opcional):
              </label>
              <input
                type="date"
                value={loteActual.fechaVencimiento || ""}
                onChange={(e) =>
                  setLoteActual({
                    ...loteActual,
                    fechaVencimiento: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="primary"
                icon="add"
                onClick={handleAgregarLote}
                className="w-full"
              >
                Agregar Lote
              </Button>
            </div>
          </div>

          {/* Tabla de Lotes Agregados */}
          {formulario.lotes.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3 text-gray-900">
                Lotes en esta Compra ({formulario.lotes.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-gray-700">Materia Prima</th>
                      <th className="px-4 py-2 text-gray-700">Cantidad</th>
                      <th className="px-4 py-2 text-gray-700">Costo Unit.</th>
                      <th className="px-4 py-2 text-gray-700">Subtotal</th>
                      <th className="px-4 py-2 text-gray-700">N° Lote</th>
                      <th className="px-4 py-2 text-gray-700">Vencimiento</th>
                      <th className="px-4 py-2 text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulario.lotes.map((lote, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2 text-gray-900">
                          {lote.materiaPrimaNombre}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {lote.cantidad}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {lote.costoUnitario.toLocaleString("es-CL", {
                            style: "currency",
                            currency: "CLP",
                          })}
                        </td>
                        <td className="px-4 py-2 text-gray-900 font-semibold">
                          {(lote.cantidad * lote.costoUnitario).toLocaleString(
                            "es-CL",
                            {
                              style: "currency",
                              currency: "CLP",
                            }
                          )}
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
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => handleEliminarLote(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <MaterialIcon name="delete" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right text-gray-900"
                      >
                        TOTAL:
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-lg">
                        {calcularMontoTotal().toLocaleString("es-CL", {
                          style: "currency",
                          currency: "CLP",
                        })}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleLimpiarFormulario}
          >
            Limpiar
          </Button>
          <Button
            type="submit"
            variant="success"
            icon="save"
            disabled={loading || formulario.lotes.length === 0}
          >
            {loading ? "Guardando..." : "Registrar Compra"}
          </Button>
        </div>
      </form>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <MaterialIcon
                  name="shopping_cart"
                  className="h-6 w-6 text-green-600"
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirmar Registro de Compra
              </h3>
              <div className="text-sm text-gray-600 space-y-2 mb-6">
                <p>
                  <strong>Proveedor:</strong> {formulario.proveedor}
                </p>
                <p>
                  <strong>Documento:</strong> {formulario.tipoDoc}{" "}
                  {formulario.numDoc}
                </p>
                <p>
                  <strong>Total de lotes:</strong> {formulario.lotes.length}
                </p>
                <p>
                  <strong>Monto total:</strong>{" "}
                  {calcularMontoTotal().toLocaleString("es-CL", {
                    style: "currency",
                    currency: "CLP",
                  })}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleConfirmar}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Guardando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
