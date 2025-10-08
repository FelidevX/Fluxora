"use client";

import { useEffect, useState } from "react";
import { Entrega, FormularioEntrega } from "@/interfaces/entregas/driver";

interface PantallaFormularioProps {
  entrega: Entrega;
  onContinue: (formData: FormularioEntrega) => void;
  onCancel: () => void;
}

export default function PantallaFormulario({
  entrega,
  onContinue,
  onCancel,
}: PantallaFormularioProps) {
  const [formData, setFormData] = useState<FormularioEntrega>({
    corriente: "",
    especial: "",
    comentario: "",
  });

  const [datosFormulario, setDatosFormulario] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.corriente && !formData.especial) {
      alert("Por favor, ingrese al menos una cantidad (corriente o especial).");
      return;
    }

    console.log("Datos del formulario:", formData);
    // Solo pasar los datos, no hacer POST request aquí
    onContinue(formData);
  };

  const obtenerDatosFormulario = async () => {
    try {
      let today = new Date();
      
      // Formatear la fecha como dd-mm-yyyy
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const fechaFormateada = `${day}-${month}-${year}`;

      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-por-fecha/${fechaFormateada}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Error al obtener las entregas del día.");
      }

      const data = await response.json();
      setDatosFormulario(data);
      console.log("Datos del formulario obtenidos:", data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    obtenerDatosFormulario();
  }, []);

  const clienteActual = datosFormulario
    .flatMap(ruta => ruta.clientes)
    .find(clienteData => clienteData.cliente.id === entrega.id_cliente);

  useEffect(() => {
    if (clienteActual) {
      setFormData({
        corriente: clienteActual.rutaCliente.kg_corriente_programado?.toString() || "",
        especial: clienteActual.rutaCliente.kg_especial_programado?.toString() || "",
        comentario: "",
      });
    }
  }, [clienteActual]);

  const calcularTotal = () => {
    const corriente = parseFloat(formData.corriente) * 7500;
    const especial = parseFloat(formData.especial) * 8000;

    if (isNaN(corriente) && isNaN(especial)) return "0";
    return (corriente + especial).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-1">
          {clienteActual?.cliente.nombreNegocio || entrega.cliente}
        </h3>
        <p className="text-gray-600">{clienteActual?.cliente.direccion || entrega.direccion}</p>
        {clienteActual && (
          <div className="text-sm text-gray-500 mt-2">
            <p>Estado: {clienteActual.rutaCliente.estado}</p>
            <p>Programado - Corriente: {clienteActual.rutaCliente.kg_corriente_programado} KG</p>
            <p>Programado - Especial: {clienteActual.rutaCliente.kg_especial_programado} KG</p>
          </div>
        )}
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
              placeholder={clienteActual?.rutaCliente.kg_corriente_programado?.toString() || "0"}
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
              placeholder={clienteActual?.rutaCliente.kg_especial_programado?.toString() || "0"}
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
            CONTINUAR
          </button>
        </div>
      </form>
    </div>
  );
}
