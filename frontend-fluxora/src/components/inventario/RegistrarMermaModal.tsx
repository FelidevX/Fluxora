"use client";

import { useState } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { registrarMerma } from "@/services/api/entregas";

interface RegistrarMermaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RegistrarMermaModal({
  isOpen,
  onClose,
  onSuccess,
}: RegistrarMermaModalProps) {
  const [loading, setLoading] = useState(false);
  const [formulario, setFormulario] = useState({
    corriente: 0,
    especial: 0,
    comentario: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formulario.corriente <= 0 && formulario.especial <= 0) {
      alert("Debe ingresar al menos una cantidad mayor a 0");
      return;
    }

    if (!formulario.comentario.trim()) {
      alert("Debe ingresar un comentario describiendo la merma");
      return;
    }

    setLoading(true);
    try {
      await registrarMerma({
        corriente_entregado: formulario.corriente,
        especial_entregado: formulario.especial,
        comentario: formulario.comentario,
      });

      alert("Merma registrada exitosamente");
      setFormulario({ corriente: 0, especial: 0, comentario: "" });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error al registrar merma:", error);
      alert(
        "Error al registrar la merma: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = formulario.corriente + formulario.especial;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center bg-red-50">
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
            {/* Información */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <MaterialIcon
                  name="info"
                  className="text-yellow-600 flex-shrink-0"
                />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">
                    Registre productos perdidos o dañados
                  </p>
                  <p className="text-xs mt-1">
                    Esta acción quedará registrada en el historial de
                    movimientos del inventario
                  </p>
                </div>
              </div>
            </div>

            {/* Pan Corriente */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Pan Corriente (Kg)
              </label>
              <Input
                type="number"
                value={formulario.corriente}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    corriente: Number(e.target.value),
                  })
                }
                min="0"
                step="0.1"
                placeholder="0.0"
              />
            </div>

            {/* Pan Especial */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Pan Especial (Kg)
              </label>
              <Input
                type="number"
                value={formulario.especial}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    especial: Number(e.target.value),
                  })
                }
                min="0"
                step="0.1"
                placeholder="0.0"
              />
            </div>

            {/* Comentario */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Motivo / Comentario *
              </label>
              <textarea
                value={formulario.comentario}
                onChange={(e) =>
                  setFormulario({ ...formulario, comentario: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                placeholder="Ej: Pan quemado horno 2, producto vencido, etc."
                required
              />
            </div>

            {/* Resumen */}
            {total > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm">
                  <div className="font-medium text-gray-700 mb-2">
                    Resumen de merma:
                  </div>
                  <div className="space-y-1 text-gray-600">
                    {formulario.corriente > 0 && (
                      <div className="flex justify-between">
                        <span>Pan Corriente:</span>
                        <span className="font-medium">
                          {formulario.corriente} Kg
                        </span>
                      </div>
                    )}
                    {formulario.especial > 0 && (
                      <div className="flex justify-between">
                        <span>Pan Especial:</span>
                        <span className="font-medium">
                          {formulario.especial} Kg
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="font-semibold text-gray-800">
                        Total:
                      </span>
                      <span className="font-semibold text-red-600">
                        {total} Kg
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
    </div>
  );
}
