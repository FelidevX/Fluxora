"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardCard from "@/components/ui/DashboardCard";
import DashboardAdmin from "@/components/admin/dashboardAdmin";
import UsuariosManager from "@/components/admin/usuarios/usuariosManager";
import SistemaManager from "@/components/admin/sistema/SistemaManager";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function AdminContent() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<
    "overview" | "usuarios" | "sistema"
  >("overview");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && ["usuarios", "sistema"].includes(view)) {
      setActiveView(view as "usuarios" | "sistema");
    }
  }, [searchParams]);

  const handleCardClick = (view: "usuarios" | "sistema") => {
    setActiveView(view);
  };

  if (activeView === "overview") {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Administra usuarios, roles y configuración del sistema
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Usuarios y Roles"
            description="Administra los usuarios y roles del sistema"
            icon="group"
            iconColor="bg-blue-100 text-blue-600"
            buttonText="Gestionar Usuarios"
            buttonVariant="primary"
            onClick={() => handleCardClick("usuarios")}
          />
          <DashboardCard
            title="Configuración"
            description="Ajustes y parámetros globales"
            icon="settings"
            iconColor="bg-yellow-100 text-yellow-600"
            buttonText="Configurar Sistema"
            buttonVariant="warning"
            onClick={() => handleCardClick("sistema")}
          />
        </div>
        <DashboardAdmin />;
      </div>
    );
  }

  if (activeView === "usuarios") {
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
        <UsuariosManager />
      </div>
    );
  }

  if (activeView === "sistema") {
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
        <SistemaManager />
      </div>
    );
  }
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredModule="admin">
      <Suspense fallback={
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              <div className="text-gray-600"> Cargando dashboard...</div>
            </div>
          }>
            <AdminContent />
      </Suspense>
    </ProtectedRoute>
  );
}
