"use client";

import React from "react";
import { useState } from "react";
import { FormularioEntrega } from "@/interfaces/entregas/driver";

interface AgendarVisitaData {
  fecha: string;
  corriente_programado: string;
  especial_programado: string;
}

interface PantallaAgendarVisitaProps {
  formularioData: FormularioEntrega;
  clienteId: number;
  clienteNombre: string;
  rutaId: number;
  onComplete: (agendarData: AgendarVisitaData) => void;
  onBack: () => void;
}

export default function PantallaAgendarVisita({
  formularioData,
  clienteId,
  clienteNombre,
  rutaId,
  onComplete,
  onBack,
}: PantallaAgendarVisitaProps) {
  const [agendarData, setAgendarData] = useState<AgendarVisitaData>({
    fecha: "",
    corriente_programado: "",
    especial_programado: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Obtener fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agendarData.fecha) {
      alert("Por favor, complete la fecha para la próxima visita.");
      return;
    }

    if (!agendarData.corriente_programado && !agendarData.especial_programado) {
      alert("Por favor, ingrese al menos una cantidad programada para la próxima visita.");
      return;
    }

    setIsLoading(true);
    try {
      let token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      // Agregar console.log para debug
      console.log("rutaId recibido en PantallaAgendarVisita:", rutaId);
      console.log("Tipo de rutaId:", typeof rutaId);

      // 1. POST para registrar la entrega actual
      const entregaPayload = {
        id_cliente: clienteId,
        corriente_entregado: parseFloat(formularioData.corriente) || 0,
        especial_entregado: parseFloat(formularioData.especial) || 0,
        comentario: formularioData.comentario || "",
        hora_entregada: new Date().toISOString(),
      };

      console.log("Registrando entrega:", entregaPayload);

      const entregaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/registrar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(entregaPayload),
        }
      );

      if (!entregaResponse.ok) {
        throw new Error("Error al registrar la entrega.");
      }

      // POST para agendar la próxima visita con cantidades programadas
      const visitaPayload = {
        idRuta: rutaId,  
        idCliente: clienteId,
        fecha: agendarData.fecha,  // <-- Usa la fecha seleccionada
        kgCorriente: parseFloat(agendarData.corriente_programado) || 0,
        kgEspecial: parseFloat(agendarData.especial_programado) || 0,
      };

      console.log("Agendando visita:", visitaPayload);

      const visitaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/actualizar-programacion-cliente`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(visitaPayload),
        }
      );

      if (!visitaResponse.ok) {
        throw new Error("Error al agendar la visita.");
      }

      alert("Entrega registrada y próxima visita agendada correctamente.");
      onComplete(agendarData);
    } catch (error) {
      console.error("Error al procesar:", error);
      alert("Hubo un error al procesar la información. Por favor, inténtelo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotalEntrega = () => {
    const corriente = parseFloat(formularioData.corriente) * 7500;
    const especial = parseFloat(formularioData.especial) * 8000;

    if (isNaN(corriente) && isNaN(especial)) return "0";
    return (corriente + especial).toLocaleString();
  };

  const calcularTotalProgramado = () => {
    const corriente = parseFloat(agendarData.corriente_programado) * 7500;
    const especial = parseFloat(agendarData.especial_programado) * 8000;

    if (isNaN(corriente) && isNaN(especial)) return "0";
    return (corriente + especial).toLocaleString();
  };

  return (
    <div className="p-4">
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-1">Agendar Próxima Visita</h3>
        <p className="text-gray-600">{clienteNombre}</p>
      </div>

      {/* Resumen de la entrega actual */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-800 mb-2">Resumen de Entrega Actual</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>Corriente: {formularioData.corriente} KG</p>
          <p>Especial: {formularioData.especial} KG</p>
          <p className="font-medium">Total: $ {calcularTotalEntrega()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Fecha de próxima visita:
            </label>
            <input
              type="date"
              min={minDate}
              value={agendarData.fecha}
              onChange={(e) =>
                setAgendarData((prev) => ({ ...prev, fecha: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600"
              required
            />
          </div>

          {/* Cantidades programadas para la próxima visita */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-3">Cantidades Programadas para la Próxima Visita</h4>
            
            <div className="flex items-center justify-between bg-white rounded-lg p-3 mb-3">
              <span className="text-gray-700 font-medium">Corriente programado =</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={agendarData.corriente_programado}
                  onChange={(e) =>
                    setAgendarData((prev) => ({ ...prev, corriente_programado: e.target.value }))
                  }
                  className="w-32 px-3 py-1 border border-gray-300 rounded text-center text-gray-600"
                  placeholder="0"
                />
                <span className="text-gray-600 font-medium">KG</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white rounded-lg p-3 mb-3">
              <span className="text-gray-700 font-medium">Especial programado =</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={agendarData.especial_programado}
                  onChange={(e) =>
                    setAgendarData((prev) => ({ ...prev, especial_programado: e.target.value }))
                  }
                  className="w-32 px-3 py-1 border border-gray-300 rounded text-center text-gray-600"
                  placeholder="0"
                />
                <span className="text-gray-600 font-medium">KG</span>
              </div>
            </div>

            <div className="text-sm text-green-700">
              <p className="font-medium">Total programado: $ {calcularTotalProgramado()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            Atrás
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {isLoading ? "Procesando..." : "FINALIZAR"}
          </button>
        </div>
      </form>
    </div>
  );
}