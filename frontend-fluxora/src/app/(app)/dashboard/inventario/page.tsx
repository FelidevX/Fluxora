"use client";

import { useState } from "react";
import InventarioCard from "@/components/inventario/InventarioCard";
import MateriasManager from "@/components/inventario/materias/MateriasManager";
import ProductosManager from "@/components/inventario/productos/ProductosManager";
import RecetasManager from "@/components/inventario/recetas/RecetasManager";
import DashboardEstadisticas from "@/components/inventario/dashboard/DashboardEstadisticas";
import AlertasNotificaciones from "@/components/inventario/dashboard/AlertasNotificaciones";

export default function InventarioPage() {
  const [activeView, setActiveView] = useState<
    "overview" | "materias" | "productos" | "recetas"
  >("overview");

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
          <InventarioCard
            title="Materias Primas"
            description="Gestiona las materias primas disponibles en el inventario"
            icon="inventory"
            iconColor="bg-blue-100 text-blue-600"
            buttonText="Gestionar Materias Primas"
            buttonVariant="primary"
            onClick={() => handleCardClick("materias")}
          />

          <InventarioCard
            title="Productos"
            description="Administra el catálogo de productos terminados"
            icon="shopping_bag"
            iconColor="bg-green-100 text-green-600"
            buttonText="Gestionar Productos"
            buttonVariant="success"
            onClick={() => handleCardClick("productos")}
          />

          <InventarioCard
            title="Recetas"
            description="Crear y gestionar recetas base para producción"
            icon="restaurant_menu"
            iconColor="bg-purple-100 text-purple-600"
            buttonText="Gestionar Recetas"
            buttonVariant="primary"
            onClick={() => handleCardClick("recetas")}
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
        <MateriasManager />
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
