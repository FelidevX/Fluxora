"use client";

import { useEffect, useState } from "react";
import PantallaRuta from "@/components/driver/ruta/PantallaRuta";
import PantallaClientes from "@/components/driver/clientes/PantallaClientes";
import PantallaFormulario from "@/components/driver/formulario/PantallaFormulario";
import { Entrega } from "@/interfaces/driver";

// Función para obtener datos del usuario del token
function getUserFromToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Se debe crear el modulo de entregas en la parte del admin para asignar entregas a los drivers
// Datos de ejemplo para las entregas
const entregasEjemplo: Entrega[] = [
  {
    id: 1,
    direccion: "Av. Argentina 283",
    cliente: "María Escalona",
    estado: "pendiente",
  },
  {
    id: 2,
    direccion: "Los Puelches 239",
    cliente: "Juan Pérez",
    estado: "pendiente",
  },
  {
    id: 3,
    direccion: "Av. Brasil 112",
    cliente: "Ana García",
    estado: "pendiente",
  },
  {
    id: 4,
    direccion: "Las Rosas 533",
    cliente: "Carlos López",
    estado: "pendiente",
  },
  {
    id: 5,
    direccion: "Bodoque 304",
    cliente: "Laura Martín",
    estado: "pendiente",
  },
  {
    id: 6,
    direccion: "El Volcán 83",
    cliente: "Pedro Silva",
    estado: "pendiente",
  },
  {
    id: 7,
    direccion: "Los Andes 703",
    cliente: "Sofia Ruiz",
    estado: "pendiente",
  },
];

export default function DriverHomePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "ruta" | "clientes" | "formulario"
  >("ruta");
  const [entregas, setEntregas] = useState<Entrega[]>(entregasEjemplo);
  const [entregaSeleccionada, setEntregaSeleccionada] =
    useState<Entrega | null>(null);

  useEffect(() => {
    const userData = getUserFromToken();
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  const handleEntregarClick = (entrega: Entrega) => {
    setEntregaSeleccionada(entrega);
    setActiveTab("formulario");
  };

  const handleFormularioComplete = () => {
    // Marcar como entregado
    setEntregas((prev) =>
      prev.map((e) =>
        e.id === entregaSeleccionada?.id ? { ...e, estado: "entregado" } : e
      )
    );
    setEntregaSeleccionada(null);
    setActiveTab("clientes");
  };

  const handleFormularioCancel = () => {
    setEntregaSeleccionada(null);
    setActiveTab("clientes");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header fijo */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">
              local_shipping
            </span>
          </div>
          <h1 className="text-lg font-semibold">
            {activeTab === "ruta" && "Mi Ruta"}
            {activeTab === "clientes" && "Gestión entregas"}
            {activeTab === "formulario" && "Formulario"}
          </h1>
        </div>
        <button onClick={handleLogout} className="p-2 bg-white/20 rounded-lg">
          <span className="material-symbols-outlined text-sm">logout</span>
        </button>
      </div>

      {/* Navigation Tabs - Solo mostrar para ruta y clientes */}
      {activeTab !== "formulario" && (
        <div className="bg-gray-100 flex">
          <button
            onClick={() => setActiveTab("ruta")}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === "ruta"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Mi Ruta
          </button>
          <button
            onClick={() => setActiveTab("clientes")}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === "clientes"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Clientes
          </button>
        </div>
      )}

      {/* Contenido de las pantallas */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ruta" && <PantallaRuta />}
        {activeTab === "clientes" && (
          <PantallaClientes
            entregas={entregas}
            onEntregarClick={handleEntregarClick}
          />
        )}
        {activeTab === "formulario" && entregaSeleccionada && (
          <PantallaFormulario
            entrega={entregaSeleccionada}
            onComplete={handleFormularioComplete}
            onCancel={handleFormularioCancel}
          />
        )}
      </div>
    </div>
  );
}
