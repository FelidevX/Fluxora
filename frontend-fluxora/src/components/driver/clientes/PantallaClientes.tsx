"use client";

import { Entrega } from "@/interfaces/entregas/driver";

interface PantallaClientesProps {
  entregas: Entrega[];
  onEntregarClick: (entrega: Entrega) => void;
}

export default function PantallaClientes({
  entregas,
  onEntregarClick,
}: PantallaClientesProps) {
  const entregasPendientes = entregas.filter(
    (e) => e.estado === "pendiente"
  ).length;

  return (
    <div className="p-4">
      <p className="text-gray-600 mb-4 text-center">
        {entregasPendientes} entregas pendientes
      </p>
      <div className="space-y-3">
        {entregas.map((entrega, index) => (
          <div
            key={entrega.id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {index + 1}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{entrega.direccion}</p>
                <p className="text-sm text-gray-500">{entrega.cliente}</p>
              </div>
            </div>
            <button
              onClick={() => onEntregarClick(entrega)}
              disabled={entrega.estado === "entregado"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                entrega.estado === "entregado"
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {entrega.estado === "entregado" ? "check_circle" : "inventory"}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
