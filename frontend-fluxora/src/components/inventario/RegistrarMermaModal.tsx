"use client";

import { useState, useEffect } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useMermas } from "@/hooks/useMermas";
import { useProductos } from "@/hooks/useProductos";
import { MermaProductoDTO } from "@/types/inventario";

interface RegistrarMermaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProductoMerma {
  productoId: number;
  productoNombre: string;
  stockActual: number;
  cantidadAMermar: number;
}

export default function RegistrarMermaModal({
  isOpen,
  onClose,
  onSuccess,
}: RegistrarMermaModalProps) {
  const { registrarMermaManual, registrarMermaAutomatica, loading } =
    useMermas();
  const { productos, cargarProductos } = useProductos();

  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  const [tipoMerma, setTipoMerma] = useState<"MANUAL" | "AUTOMATICA">("MANUAL");
  const [motivo, setMotivo] = useState("");
  const [productosMerma, setProductosMerma] = useState<ProductoMerma[]>([]);

  useEffect(() => {
    if (isOpen) {
      cargarProductos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (productos.length > 0 && tipoMerma === "MANUAL") {
      // Inicializar productos con stock > 0 para merma manual
      const productosConStock = productos
        .filter((p) => (p.stockTotal ?? 0) > 0)
        .map((p) => ({
          productoId: p.id,
          productoNombre: p.nombre,
          stockActual: p.stockTotal ?? 0,
          cantidadAMermar: 0,
        }));
      setProductosMerma(productosConStock);
    }
  }, [productos, tipoMerma]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!motivo.trim()) {
      warning("Debe ingresar un motivo para la merma");
      return;
    }

    try {
      if (tipoMerma === "AUTOMATICA") {
        // Merma automática de todo el stock
        const mermasRegistradas = await registrarMermaAutomatica(motivo);

        if (mermasRegistradas.length === 0) {
          warning("No hay productos con stock para mermar automáticamente");
          return;
        }

        success(
          `Merma automática registrada: ${
            mermasRegistradas.length
          } producto(s), Total: ${mermasRegistradas
            .reduce((sum, m) => sum + m.cantidadMermada, 0)
            .toFixed(1)} kg`
        );
      } else {
        // Merma manual - registrar cada producto con cantidad > 0
        const mermasARegistrar = productosMerma.filter(
          (pm) => pm.cantidadAMermar > 0
        );

        if (mermasARegistrar.length === 0) {
          warning("Debe ingresar al menos una cantidad mayor a 0");
          return;
        }

        // Validar que las cantidades no excedan el stock
        for (const pm of mermasARegistrar) {
          if (pm.cantidadAMermar > pm.stockActual) {
            warning(
              `La cantidad a mermar de "${pm.productoNombre}" (${pm.cantidadAMermar} kg) excede el stock disponible (${pm.stockActual} kg)`
            );
            return;
          }
        }

        // Registrar cada merma
        for (const pm of mermasARegistrar) {
          const mermaDTO: MermaProductoDTO = {
            productoId: pm.productoId,
            cantidadMermada: pm.cantidadAMermar,
            motivo: motivo,
          };
          await registrarMermaManual(mermaDTO);
        }

        success(
          `Merma manual registrada: ${
            mermasARegistrar.length
          } producto(s), Total: ${mermasARegistrar
            .reduce((sum, pm) => sum + pm.cantidadAMermar, 0)
            .toFixed(1)} kg`
        );
      }

      // Resetear formulario
      setMotivo("");
      setProductosMerma([]);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error al registrar merma:", error);
      showError(
        error instanceof Error ? error.message : "Error desconocido",
        "Error al Registrar Merma"
      );
    }
  };

  const handleCantidadChange = (productoId: number, cantidad: number) => {
    setProductosMerma((prev) =>
      prev.map((pm) =>
        pm.productoId === productoId ? { ...pm, cantidadAMermar: cantidad } : pm
      )
    );
  };

  const totalAMermar = productosMerma.reduce(
    (sum, pm) => sum + pm.cantidadAMermar,
    0
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4 flex justify-between items-center bg-red-50 z-10">
          <div className="flex items-center gap-2">
            <MaterialIcon
              name="delete_sweep"
              className="text-2xl text-red-600"
            />
            <h2 className="text-xl font-bold text-gray-800">Registrar Merma</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <MaterialIcon name="close" className="text-2xl" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Tipo de Merma */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Tipo de Merma *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoMerma("MANUAL")}
                  className={`p-4 border-2 rounded-lg transition-all ${tipoMerma === "MANUAL"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <MaterialIcon
                      name="edit"
                      className={`text-3xl ${tipoMerma === "MANUAL"
                          ? "text-blue-600"
                          : "text-gray-400"
                        }`}
                    />
                    <span
                      className={`font-medium ${tipoMerma === "MANUAL"
                          ? "text-blue-900"
                          : "text-gray-600"
                        }`}
                    >
                      Manual
                    </span>
                    <span className="text-xs text-gray-500 text-center">
                      Seleccione productos y cantidades específicas
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoMerma("AUTOMATICA")}
                  className={`p-4 border-2 rounded-lg transition-all ${tipoMerma === "AUTOMATICA"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <MaterialIcon
                      name="auto_fix_high"
                      className={`text-3xl ${tipoMerma === "AUTOMATICA"
                          ? "text-purple-600"
                          : "text-gray-400"
                        }`}
                    />
                    <span
                      className={`font-medium ${tipoMerma === "AUTOMATICA"
                          ? "text-purple-900"
                          : "text-gray-600"
                        }`}
                    >
                      Automática
                    </span>
                    <span className="text-xs text-gray-500 text-center">
                      Mermar todo el stock disponible (fin de turno)
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Lista de productos (solo para manual) */}
            {tipoMerma === "MANUAL" && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Productos a Mermar
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {productosMerma.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No hay productos con stock disponible
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                            Stock Actual
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                            Cantidad a Mermar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {productosMerma.map((pm) => (
                          <tr key={pm.productoId} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {pm.productoNombre}
                            </td>
                            <td className="px-4 py-2 text-center text-sm text-gray-600">
                              {pm.stockActual.toFixed(1)} kg
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                value={pm.cantidadAMermar || ""}
                                onChange={(e) =>
                                  handleCantidadChange(
                                    pm.productoId,
                                    Number(e.target.value)
                                  )
                                }
                                min="0"
                                max={pm.stockActual}
                                step="0.1"
                                placeholder="0.0"
                                className="text-center"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Información automática */}
            {tipoMerma === "AUTOMATICA" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <MaterialIcon
                    name="info"
                    className="text-purple-600 flex-shrink-0"
                  />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium">
                      Se mermará automáticamente todo el stock disponible
                    </p>
                    <p className="text-xs mt-1">
                      {productos.filter((p) => (p.stockTotal ?? 0) > 0).length}{" "}
                      producto(s) con stock serán mermados completamente
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Motivo / Comentario *
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-gray-500"
                rows={3}
                placeholder={
                  tipoMerma === "AUTOMATICA"
                    ? "Ej: Merma automática de fin de turno - cierre del día"
                    : "Ej: Pan quemado, producto vencido, producto dañado, etc."
                }
                required
              />
            </div>

            {/* Resumen (solo para manual) */}
            {tipoMerma === "MANUAL" && totalAMermar > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm">
                  <div className="font-medium text-gray-700 mb-2">
                    Resumen de merma:
                  </div>
                  <div className="space-y-1">
                    {productosMerma
                      .filter((pm) => pm.cantidadAMermar > 0)
                      .map((pm) => (
                        <div
                          key={pm.productoId}
                          className="flex justify-between text-gray-600"
                        >
                          <span>{pm.productoNombre}:</span>
                          <span className="font-medium">
                            {pm.cantidadAMermar.toFixed(1)} Kg
                          </span>
                        </div>
                      ))}
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="font-semibold text-gray-800">
                        Total:
                      </span>
                      <span className="font-semibold text-red-600">
                        {totalAMermar.toFixed(1)} Kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2 mt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <MaterialIcon
                    name="hourglass_empty"
                    className="mr-2 animate-spin"
                  />
                  Registrando...
                </>
              ) : (
                <>
                  <MaterialIcon name="save" className="mr-2" />
                  Registrar Merma
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
