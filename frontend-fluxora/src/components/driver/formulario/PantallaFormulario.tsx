"use client";

import { useState } from "react";
import { Entrega, FormularioEntrega } from "@/interfaces/driver";

interface PantallaFormularioProps {
  entrega: Entrega;
  onComplete: () => void;
  onCancel: () => void;
}

export default function PantallaFormulario({
  entrega,
  onComplete,
  onCancel,
}: PantallaFormularioProps) {
  const [formData, setFormData] = useState<FormularioEntrega>({
    corriente: "12.5",
    especial: "5",
    observaciones: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí enviarías los datos al backend
    console.log("Entrega completada:", { entrega, formData });
    onComplete();
  };

  const calcularTotal = () => {
    const corriente = parseFloat(formData.corriente) * 7500;
    const especial = parseFloat(formData.especial) * 8000;
    return (corriente + especial).toLocaleString();
  };

  return (
    <div className="p-4">
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-1">Cliente 1</h3>
        <p className="text-gray-600">{entrega.cliente}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4">
          <span className="text-gray-700 font-medium">Corriente =</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={formData.corriente}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, corriente: e.target.value }))
              }
              className="w-20 px-3 py-1 border rounded text-center"
            />
            <span className="text-gray-600 font-medium">KG</span>
            <button type="button" className="text-blue-600 hover:text-blue-800">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4">
          <span className="text-gray-700 font-medium">Especial =</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={formData.especial}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, especial: e.target.value }))
              }
              className="w-20 px-3 py-1 border rounded text-center"
            />
            <span className="text-gray-600 font-medium">KG</span>
            <button type="button" className="text-blue-600 hover:text-blue-800">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Observaciones:
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                observaciones: e.target.value,
              }))
            }
            placeholder="Ingrese sus observaciones..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
          />
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>Corriente = $ 7500</p>
          <p>Especial = $ 8000</p>
          <p className="font-medium">Monto total: $ {calcularTotal()}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium"
          >
            FINALIZAR
          </button>
        </div>
      </form>
    </div>
  );
}
