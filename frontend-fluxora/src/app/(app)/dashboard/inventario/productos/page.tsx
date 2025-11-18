"use client";

import { useState } from "react";
import GestionProductos from "@/components/inventario/productos/GestionProductos";
import HistorialMermas from "@/components/inventario/mermas/HistorialMermas";
import RegistrarMermaModal from "@/components/inventario/RegistrarMermaModal";

export default function ProductosPage() {
  const [activeTab, setActiveTab] = useState<"gestion" | "mermas">("gestion");
  const [showMermaModal, setShowMermaModal] = useState(false);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Productos y Mermas
          </h1>
          <p className="text-gray-600">
            Administre el catálogo de productos, lotes de producción y registro
            de mermas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="inline-flex rounded-md shadow-sm" role="tablist">
          <button
            className={`px-4 py-2 rounded-l-md border text-sm font-medium focus:outline-none transition-colors ${
              activeTab === "gestion"
                ? "bg-white border-blue-500 text-blue-600 z-10"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "gestion"}
            onClick={() => setActiveTab("gestion")}
          >
            Gestión de Productos
          </button>

          <button
            className={`px-4 py-2 rounded-r-md border text-sm font-medium focus:outline-none transition-colors ${
              activeTab === "mermas"
                ? "bg-white border-blue-500 text-blue-600 z-10"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "mermas"}
            onClick={() => setActiveTab("mermas")}
          >
            Merma de Productos
          </button>
        </nav>
      </div>

      {/* Contenido según tab activa */}
      {activeTab === "gestion" && (
        <GestionProductos onOpenMerma={() => setShowMermaModal(true)} />
      )}

      {activeTab === "mermas" && <HistorialMermas />}

      {/* Modal de registro de merma */}
      <RegistrarMermaModal
        isOpen={showMermaModal}
        onClose={() => setShowMermaModal(false)}
        onSuccess={() => {
          console.log("Merma registrada exitosamente");
          // Si estamos en la tab de mermas, podríamos recargar la lista
          if (activeTab === "mermas") {
            // El componente HistorialMermas se recargará automáticamente
          }
        }}
      />
    </div>
  );
}
