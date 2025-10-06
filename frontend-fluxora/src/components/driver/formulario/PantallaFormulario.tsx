"use client";

import { useState } from "react";
import { Entrega, FormularioEntrega } from "@/interfaces/entregas/driver";

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
    corriente: "",
    especial: "",
    comentario: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
       let token = localStorage.getItem("auth_token");

       if (!token) {
        throw new Error("No se encontró el token de autenticación.");
       }

       if (token.startsWith("Bearer ")) {
        token = token.substring(7);
       }

       const payload = {
        id_cliente: entrega.id_cliente,
        corriente_entregado: parseFloat(formData.corriente) || 0,
        especial_entregado: parseFloat(formData.especial) || 0,
        comentario: formData.comentario || "",
        hora_entregada: new Date().toISOString(),
       }

       console.log("Payload a enviar:", payload);

       const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
       });

        if (!response.ok) {
          throw new Error("Error al crear la entrega.");
        }

        setFormData({
          corriente: "",
          especial: "",
          comentario: "",
        });
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Hubo un error al procesar la entrega. Por favor, inténtelo de nuevo.");
    } finally {
      setIsLoading(false);
    }

    console.log("Entrega completada:", { entrega, formData });
    onComplete();
  };

  const calcularTotal = () => {
    const corriente = parseFloat(formData.corriente) * 7500;
    const especial = parseFloat(formData.especial) * 8000;

    if (isNaN(corriente) && isNaN(especial)) return "0";
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
              className="w-32 px-3 py-1 border border-gray-300 rounded text-center text-gray-600"
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
              className="w-32 px-3 py-1 border border-gray-300 rounded text-center text-gray-600"
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
            value={formData.comentario}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                comentario: e.target.value,
              }))
            }
            placeholder="Ingrese sus observaciones..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-gray-600"
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
