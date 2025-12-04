"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GestionMateriasPrimas from "@/components/inventario/materias/GestionMateriasPrimas";
import RegistrarCompra from "@/components/inventario/compras/RegistrarCompra";
import VisualizarCompras from "@/components/inventario/compras/VisualizarCompras";
import Link from "next/dist/client/link";
import MaterialIcon from "@/components/ui/MaterialIcon";

function MateriasContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "gestion" | "compras" | "visualizar"
  >("gestion");

  // Detectar si se debe abrir una tab específica
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "compras") {
      setActiveTab("compras");
    } else if (tab === "visualizar") {
      setActiveTab("visualizar");
    } else {
      setActiveTab("gestion");
    }
  }, [searchParams]);

  return (
    <div className="p-4 md:p-6 mt-12 md:mt-0">
      <div className="flex items-center justify-between mb-4">
        <Link
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center font-bold cursor-pointer"
          href={"/dashboard/inventario"}
        >
          <MaterialIcon name="arrow_back" className="mr-1" />
          <span>Volver al inicio</span>
        </Link>
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
            Gestión de Materias Primas
          </button>

          <button
            className={`px-4 py-2 border-t border-b text-sm font-medium focus:outline-none transition-colors ${
              activeTab === "compras"
                ? "bg-white border-blue-500 text-blue-600 z-10"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "compras"}
            onClick={() => setActiveTab("compras")}
          >
            Registrar Compra
          </button>

          <button
            className={`px-4 py-2 rounded-r-md border text-sm font-medium focus:outline-none transition-colors ${
              activeTab === "visualizar"
                ? "bg-white border-blue-500 text-blue-600 z-10"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "visualizar"}
            onClick={() => setActiveTab("visualizar")}
          >
            Visualizar Compras
          </button>
        </nav>
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === "gestion" && <GestionMateriasPrimas />}
        {activeTab === "compras" && <RegistrarCompra />}
        {activeTab === "visualizar" && <VisualizarCompras />}
      </div>
    </div>
  );
}

export default function MateriasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">Cargando...</div>
        </div>
      }
    >
      <MateriasContent />
    </Suspense>
  );
}
