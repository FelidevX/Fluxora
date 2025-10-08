"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GestionRutas from "@/components/admin/entregas/gestion/GestionRutas";
import { RutasActivas } from "@/components/admin/entregas/rutas/RutasActivas";
import { RutaActiva } from "@/interfaces/entregas/entregas";
import { AsignarClientes } from "@/components/admin/entregas/asignar/AsignarClientes";

export default function GestionRutasPage() {
  const [rutas, setRutas] = useState<RutaActiva[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "gestion" | "rutas-activas" | "asignar"
  >("gestion");
  const router = useRouter();

  const fetchRutas = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        console.warn("No auth token found");
        setRutas([]);
        return;
      }
      if (token.startsWith("Bearer ")) token = token.substring(7);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-activas`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setRutas(data || []);
      } else {
        console.error("Failed to fetch rutas:", res.statusText);
        setRutas([]);
      }
    } catch (e) {
      console.error(e);
      setRutas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutas();
  }, []);

  const handleVerDetalle = (ruta: RutaActiva) => {
    router.push(`/dashboard/entregas/detalle-ruta?id=${ruta.id}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-black">Rutas</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="inline-flex rounded-md shadow-sm" role="tablist">
          <button
            className={`px-4 py-2 rounded-l-md border text-sm font-medium focus:outline-none ${
              activeTab === "gestion"
                ? "bg-white border-blue-500 text-blue-600"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "gestion"}
            onClick={() => setActiveTab("gestion")}
          >
            Gestión de Rutas
          </button>

          <button
            className={`px-4 py-2 border-t border-b border-gray-200 text-sm font-medium focus:outline-none ${
              activeTab === "rutas-activas"
                ? "bg-white border-blue-500 text-blue-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "rutas-activas"}
            onClick={() => setActiveTab("rutas-activas")}
          >
            Rutas Activas
          </button>

          <button
            className={`px-4 py-2 rounded-r-md border text-sm font-medium focus:outline-none ${
              activeTab === "asignar"
                ? "bg-white border-blue-500 text-blue-600"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "asignar"}
            onClick={() => setActiveTab("asignar")}
          >
            Asignar
          </button>
        </nav>
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === "gestion" && (
          <GestionRutas
            rutas={rutas}
            loading={loading}
            onRefresh={fetchRutas}
            onVerDetalle={handleVerDetalle}
          />
        )}

        {activeTab === "rutas-activas" && (
          <div>
            <RutasActivas
              rutas={rutas}
              loading={loading}
              onRefresh={fetchRutas}
              onVerDetalle={handleVerDetalle}
            />
          </div>
        )}
        {activeTab === "asignar" && <AsignarClientes />}
      </div>
    </div>
  );
}
