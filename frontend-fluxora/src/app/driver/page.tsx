"use client";

import { useEffect, useState } from "react";
import PantallaRuta from "@/components/driver/ruta/PantallaRuta";
import PantallaClientes from "@/components/driver/clientes/PantallaClientes";
import PantallaFormulario from "@/components/driver/formulario/PantallaFormulario";
import { Entrega } from "@/interfaces/entregas/driver";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

interface RutaData {
  orderedClients: Cliente[];
  osrmRoute: string;
}

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

export default function DriverHomePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"ruta" | "clientes" | "formulario">("ruta");
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState<Entrega | null>(null);
  
  const [rutaData, setRutaData] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userData = getUserFromToken();
    setUser(userData);
    
    fetchRutaOptimizada();
  }, []);

  const fetchRutaOptimizada = async () => {
    try {
      let token = localStorage.getItem('auth_token');

      if(!token) {
        setError('No autenticado. Por favor, inicia sesión.');
        return;
      }

      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      const userData = getUserFromToken();
      console.log('Datos del usuario desde el token:', userData);
      
      if(!userData) {
        setError('Token inválido. Por favor, inicia sesión de nuevo.');
        return;
      }

      const rutaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/driver/${userData.sub}` , {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!rutaResponse.ok) throw new Error('Error al obtener la ruta del conductor');

      const rutaData = await rutaResponse.json();
      const rutaId = rutaData.rutaId;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/optimized-ortools/${rutaId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar la ruta');
      
      const data = await response.json();
      console.log('Datos de ruta recibidos:', data);
      setRutaData(data);

      // Convertir los clientes de la ruta a entregas
      const entregasFromRuta: Entrega[] = data.orderedClients.map((cliente: Cliente, index: number) => ({
        id: cliente.id,
        direccion: cliente.direccion,
        cliente: cliente.nombre,
        estado: "pendiente" as const,
        orden: index + 1,
        latitud: cliente.latitud,
        longitud: cliente.longitud,
        id_cliente: cliente.id,
      }));
      
      setEntregas(entregasFromRuta);
    } catch (err) {
      console.error('Error al cargar ruta:', err);
      setError('Error al cargar la ruta optimizada');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  const handleEntregarClick = (entrega: Entrega) => {
    setEntregaSeleccionada(entrega);
    setActiveTab("formulario");
  };

  const handleClienteEntregarClick = (cliente: Cliente) => {
    const entrega = entregas.find(e => e.id === cliente.id);
    if (entrega) {
      handleEntregarClick(entrega);
    }
  };

  const handleFormularioComplete = () => {
    setEntregas((prev) =>
      prev.map((e) =>
        e.id === entregaSeleccionada?.id 
          ? { ...e, estado: "entregado" }
          : e
      )
    );
    
    if (entregaSeleccionada) {
      setEntregaSeleccionada({
        ...entregaSeleccionada,
        estado: "entregado"
      });
    }
    
    setEntregaSeleccionada(null);
    setActiveTab("clientes");
  };

  const handleFormularioCancel = () => {
    setEntregaSeleccionada(null);
    setActiveTab("clientes");
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Cargando datos del conductor...</p>
        </div>
      </div>
    );
  }

  if (error || !rutaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error || 'Error al cargar los datos'}</p>
          </div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchRutaOptimizada();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          >
            REINTENTAR
          </button>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          {/* Indicador de entregas pendientes */}
          {rutaData && (
            <div className="bg-white/20 px-2 py-1 rounded text-xs">
              {entregas.filter(e => e.estado === 'pendiente').length} pendientes
            </div>
          )}
          <button onClick={handleLogout} className="p-2 bg-white/20 rounded-lg">
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
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
            <div className="flex items-center justify-center gap-1">
              <MaterialIcon name="delivery_truck_speed" className="mr-1" />
              <span>Mi Ruta</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("clientes")}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === "clientes"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <MaterialIcon name="box_add" className="mr-1" />
              <span>Entregas ({entregas.filter(e => e.estado === 'pendiente').length})</span>
            </div>
          </button>
        </div>
      )}

      {/* Contenido de las pantallas */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ruta" && (
          <PantallaRuta rutaData={rutaData} />
        )}
        {activeTab === "clientes" && (
          <PantallaClientes
            orderedClients={rutaData.orderedClients}
            onEntregarClick={handleClienteEntregarClick}
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
