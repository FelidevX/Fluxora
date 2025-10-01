"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InventarioCard from "@/components/inventario/InventarioCard";
import ProductosManager from "@/components/inventario/productos/ProductosManager";
import RecetasManager from "@/components/inventario/recetas/RecetasManager";
import DashboardEstadisticas from "@/components/inventario/dashboard/DashboardEstadisticas";
import AlertasNotificaciones from "@/components/inventario/dashboard/AlertasNotificaciones";
import Link from "next/link";
import MateriasPage from "./materias/page";

function InventarioContent() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<
    "overview" | "materias" | "productos" | "recetas"
  >("overview");

  // Manejar parámetros de query para navegación directa
  useEffect(() => {
    const view = searchParams.get("view");
    if (view && ["materias", "productos", "recetas"].includes(view)) {
      setActiveView(view as "materias" | "productos" | "recetas");
    }
  }, [searchParams]);

  const handleCardClick = (view: "materias" | "productos" | "recetas") => {
    setActiveView(view);
  };

  if (activeView === "overview") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Inventario y Producción
          </h1>
          <p className="text-gray-600">
            Sistema completo de materias primas, recetas, producción e
            inventario
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/inventario/materias">
            <InventarioCard
              title="Materias Primas"
              description="Gestiona las materias primas disponibles en el inventario"
              icon="inventory"
              iconColor="bg-blue-100 text-blue-600"
              buttonText="Gestionar Materias Primas"
              buttonVariant="primary"
            />
          </Link>

          <Link href="/dashboard/inventario/productos">
            <InventarioCard
              title="Productos"
              description="Administra el catálogo de productos terminados"
              icon="inventory"
              iconColor="bg-blue-100 text-blue-600"
              buttonText="Gestionar Productos"
              buttonVariant="primary"
            />
          </Link>

          <Link href="/dashboard/inventario/recetas">
            <InventarioCard
              title="Recetas"
              description="Crear y gestionar recetas base para producción"
              icon="restaurant_menu"
              iconColor="bg-purple-100 text-purple-600"
              buttonText="Gestionar Recetas"
              buttonVariant="primary"
            />
          </Link>
        </div>

        {/* Dashboard de Estadísticas */}
        <div className="mt-8">
          <DashboardEstadisticas />
        </div>

        {/* Alertas y Notificaciones */}
        <div className="mt-6">
          <AlertasNotificaciones />
        </div>
      </div>
    );
  }

  // Mostrar el componente específico según la vista activa
  if (activeView === "materias") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setActiveView("overview")}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-bold"
          >
            ← Volver al inicio
          </button>
        </div>
        <MateriasPage />
      </div>
    );
  }

  if (activeView === "productos") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setActiveView("overview")}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-bold"
          >
            ← Volver al inicio
          </button>
        </div>
        <ProductosManager />
      </div>
    );
  }

  if (activeView === "recetas") {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => setActiveView("overview")}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2 font-bold"
          >
            ← Volver al inicio
          </button>
        </div>
        <RecetasManager />
      </div>
    );
  }
}

export default function InventarioPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Cargando inventario...</div>
      </div>
    }>
      <InventarioContent />
    </Suspense>
  );
}
