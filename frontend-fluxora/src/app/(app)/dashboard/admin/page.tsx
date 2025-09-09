"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardCard from "@/components/ui/DashboardCard";
import DashboardAdmin from "@/components/admin/dashboardAdmin";
import UsuariosManager from "@/components/admin/usuariosManager";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<
    "overview" | "usuarios" | "configuracion"
  >("overview");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && ["usuarios", "configuracion", "roles"].includes(view)) {
      setActiveView(view as "usuarios" | "configuracion");
    }
  }, [searchParams]);

  const handleCardClick = (view: "usuarios" | "configuracion") => {
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
            onClick={() => handleCardClick("configuracion")}
          />
        </div>
        <DashboardAdmin />;
      </div>
    );
  }
  if (activeView === "usuarios") {
    return <UsuariosManager />;
  }
  if (activeView === "configuracion") {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Configuración del Sistema</h2>
        {/* Aquí puedes agregar la configuración global */}
      </div>
    );
  }
}
