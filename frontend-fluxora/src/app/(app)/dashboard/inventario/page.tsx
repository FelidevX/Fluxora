"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InventarioCard from "@/components/inventario/InventarioCard";
import DashboardEstadisticas from "@/components/inventario/dashboard/DashboardEstadisticas";
import AlertasNotificaciones from "@/components/inventario/dashboard/AlertasNotificaciones";
import Link from "next/link";

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
          <InventarioCard
            title="Materias Primas"
            description="Gestiona las materias primas disponibles en el inventario"
            icon="inventory"
            iconColor="bg-blue-100 text-blue-600"
            buttonText="Gestionar Materias Primas"
            buttonVariant="primary"
            href="/dashboard/inventario/materias"
          />

          <InventarioCard
            title="Productos"
            description="Administra el catálogo de productos terminados"
            icon="inventory"
            iconColor="bg-blue-100 text-blue-600"
            buttonText="Gestionar Productos"
            buttonVariant="primary"
            href="/dashboard/inventario/productos"
          />
          
          <InventarioCard
            title="Recetas"
            description="Crear y gestionar recetas base para producción"
            icon="restaurant_menu"
            iconColor="bg-purple-100 text-purple-600"
            buttonText="Gestionar Recetas"
            buttonVariant="primary"
            href="/dashboard/inventario/recetas"
          />
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
