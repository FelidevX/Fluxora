"use client";

import { useState, useEffect } from "react";
import { RutasActivas } from "./rutas/RutasActivas";
import { DetalleRuta } from "./rutas/DetalleRuta";
import { HistorialEntregas } from "./historial/HistorialEntregas";
import GestionRutas from "./gestion/GestionRutas";
import { RutaActiva } from "@/interfaces/entregas/entregas";

export default function GestionEntregas() {
  const [activeTab, setActiveTab] = useState("rutas-activas");
  const [rutasActivas, setRutasActivas] = useState<RutaActiva[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaActiva | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const fetchRutasActivas = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-activas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRutasActivas(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener rutas activas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutasActivas();
  }, []);

  const handleRefresh = () => {
    fetchRutasActivas();
    if (rutaSeleccionada) {
      setRutaSeleccionada(null);
    }
  };

  const handleVerDetalleRuta = (ruta: RutaActiva) => {
    setRutaSeleccionada(ruta);
    setActiveTab("detalle-ruta");
  };

  const tabs = [
    {
      id: "rutas-activas",
      name: "Rutas Activas",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0V7"
          />
        </svg>
      ),
    },
    {
      id: "detalle-ruta",
      name: "Detalle de Ruta",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      disabled: !rutaSeleccionada,
    },
    {
      id: "historial",
      name: "Historial de Pedidos",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "gestion-rutas",
      name: "Gestión de Rutas",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Entregas
        </h1>
        <p className="text-gray-600">
          Administra las entregas de todas las rutas activas y registra las
          entregas realizadas.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : tab.disabled
                  ? "border-transparent text-gray-400 cursor-not-allowed"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
              {tab.id === "rutas-activas" && rutasActivas.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {rutasActivas.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "rutas-activas" && (
          <RutasActivas
            rutas={rutasActivas}
            loading={loading}
            onRefresh={handleRefresh}
            onVerDetalle={handleVerDetalleRuta}
          />
        )}

        {activeTab === "detalle-ruta" && rutaSeleccionada && (
          <DetalleRuta
            ruta={rutaSeleccionada}
            onBack={() => setActiveTab("rutas-activas")}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === "historial" && <HistorialEntregas />}

        {activeTab === "gestion-rutas" && (
          <GestionRutas
            rutas={rutasActivas}
            loading={loading}
            onRefresh={handleRefresh}
            onVerDetalle={handleVerDetalleRuta}
          />
        )}
      </div>
    </div>
  );
}
