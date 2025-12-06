"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardEstadisticas from "@/components/inventario/dashboard/DashboardEstadisticas";
import AlertasNotificaciones from "@/components/inventario/dashboard/AlertasNotificaciones";
import Card from "@/components/ui/Card";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
      <div className="p-4 md:p-6 mt-12 md:mt-0">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Gestión de Inventario y Producción
          </h1>
          <p className="text-sm text-gray-600">
            Sistema completo de materias primas, recetas, producción e
            inventario
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            title="Materias Primas y Compras"
            description="Gestiona materias primas y registra compras"
            icon="inventory"
            iconColor="bg-blue-100 text-blue-600"
            buttonText="Gestionar Materias Primas"
            buttonVariant="primary"
            href="/dashboard/inventario/materias"
          />
          <Card
            title="Recetas"
            description="Crear y gestionar recetas base para producción"
            icon="restaurant_menu"
            iconColor="bg-purple-100 text-purple-600"
            buttonText="Gestionar Recetas"
            buttonVariant="primary"
            href="/dashboard/inventario/recetas"
          />
          <Card
            title="Producción"
            description="Administra la producción de productos"
            icon="inventory"
            iconColor="bg-green-100 text-green-600"
            buttonText="Gestionar Productos"
            buttonVariant="primary"
            href="/dashboard/inventario/productos"
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
    <ProtectedRoute requiredModule="inventario">
      <Suspense
        fallback={
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-gray-600">Cargando inventario...</div>
          </div>
        }
      >
        <InventarioContent />
      </Suspense>
    </ProtectedRoute>
  );
}
