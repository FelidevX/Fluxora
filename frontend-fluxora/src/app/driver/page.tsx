"use client";

import { use, useEffect, useState } from "react";
import PantallaRuta from "@/components/driver/ruta/PantallaRuta";
import PantallaClientes from "@/components/driver/clientes/PantallaClientes";
import FormularioContainer from "@/components/driver/formcontainer/FormContainer";
import { Entrega } from "@/interfaces/entregas/driver";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

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
  const [rutaIniciada, setRutaIniciada] = useState(false);
  const [iniciandoRuta, setIniciandoRuta] = useState(false);
  const [rutaId, setRutaId] = useState<number | null>(null);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [programacion, setProgramacion] = useState<any[]>([]);
  
  // Estado para rastrear clientes entregados
  const [clientesEntregados, setClientesEntregados] = useState<Set<number>>(new Set());

  // Hook para notificaciones toast
  const { toasts, removeToast, success, error: showError, warning, info } = useToast();

  useEffect(() => {
    const userData = getUserFromToken();
    setUser(userData);
    
    fetchRutaOptimizada();
  }, []);

  // Cargar entregas realizadas cuando hay pedidoId
  useEffect(() => {
    if (pedidoId) {
      cargarEntregasRealizadas();
    }
  }, [pedidoId]);

  // Función para cargar entregas del pedido actual
  const cargarEntregasRealizadas = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) return;
      
      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/pedido/${pedidoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const entregasRealizadas = await response.json();
        const entregadosSet = new Set<number>(
          entregasRealizadas
            .filter((e: any) => e.id_pedido === pedidoId)
            .map((e: any) => e.id_cliente)
        );
        setClientesEntregados(entregadosSet);
        
        // Actualizar estado de entregas
        setEntregas((prev) =>
          prev.map((e) => ({
            ...e,
            estado: entregadosSet.has(e.id_cliente) ? "entregado" : "pendiente",
          }))
        );
      }
    } catch (error) {
      console.error("Error al cargar entregas realizadas:", error);
    }
  };

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

      // Paso 1: Obtener la ruta del conductor
      const rutaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/driver/${userData.sub}` , {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!rutaResponse.ok) throw new Error('Error al obtener la ruta del conductor');

      const rutaData = await rutaResponse.json();
      const rutaId = rutaData.rutaId;
      setRutaId(rutaId);

      // Paso 2: Obtener la programación de entregas del día
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      
      const programacionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/programacion/${rutaId}/${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!programacionResponse.ok) {
        throw new Error('Error al obtener la programación de entregas');
      }

      const programacionData = await programacionResponse.json();
      console.log("Programación obtenida:", programacionData);
      setProgramacion(programacionData);

      // Paso 3: Extraer IDs únicos de clientes con entregas programadas
      const clientesConEntregas = Array.from(
        new Set(programacionData.map((p: any) => p.id_cliente))
      );

      console.log('Clientes con entregas programadas para hoy:', clientesConEntregas);

      if (clientesConEntregas.length === 0) {
        setError('No hay entregas programadas para hoy.');
        setLoading(false);
        return;
      }

      // Paso 4: Optimizar la ruta solo con los clientes que tienen entregas programadas
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/optimized-ortools/${rutaId}/${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Error al cargar la ruta');
      
      const data = await response.json();
      console.log('Datos de ruta optimizada recibidos:', data);
      
      // Verificar si hay un mensaje de error o sin entregas
      if (data.message || data.orderedClients.length === 0) {
        setError(data.message || 'No hay entregas programadas para hoy.');
        setLoading(false);
        return;
      }

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
        id_ruta: rutaId,
        id_pedido: pedidoId
      }));
      
      setEntregas(entregasFromRuta);
      console.log('Entregas iniciales establecidas:', entregasFromRuta);
    } catch (err) {
      console.error('Error al cargar ruta:', err);
      setError('Error al cargar la ruta optimizada');
    } finally {
      setLoading(false);
    }
  };

  const handleObtenerProgramacion = async () => {
    if (!rutaId) {
      warning("ID de ruta no disponible", "Advertencia");
      return;
    }

    try {
      let token = localStorage.getItem('auth_token');

      if (!token) {
        warning("No autenticado. Por favor, inicia sesión.", "Sesión Requerida");
        return;
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/programacion/${rutaId}/${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener programación: " + response.statusText);
      }

      const data = await response.json();
      console.log("Programación obtenida:", data);
      setProgramacion(data);
    } catch (err) {
      console.error("Error al obtener programación:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido al obtener la programación",
        "Error al Obtener Programación"
      );
    }
  };

  const handleIniciarRuta = async () => {
    setIniciandoRuta(true);
    try {
      let token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/iniciar/${rutaId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_ruta: rutaId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al iniciar la ruta.");
      }

      const data = await response.json();
      console.log("Ruta iniciada correctamente", data);
      
      const pedidoIdObtenido = data.id_pedido;
      setPedidoId(pedidoIdObtenido);
      
      setEntregas((prevEntregas) => {
        console.log("Actualizando entregas con id_pedido:", pedidoIdObtenido);
        const entregasActualizadas = prevEntregas.map((entrega) => ({
          ...entrega,
          id_pedido: pedidoIdObtenido,
        }));
        
        console.log("Entregas después:", entregasActualizadas);
        return entregasActualizadas;
      });
      
      setRutaIniciada(true);
      success("La ruta ha sido iniciada exitosamente", "¡Ruta Iniciada!");
    } catch (err) {
      console.error("Error al iniciar ruta:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido al iniciar la ruta",
        "Error al Iniciar Ruta"
      );
    } finally {
      setIniciandoRuta(false);
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
    console.log("=== CLIENTE SELECCIONADO PARA ENTREGA ===");
    console.log("Cliente:", cliente);
    console.log("pedidoId en estado:", pedidoId);
    
    const entregaCorrespondiente = entregas.find(
      (e) => e.id_cliente === cliente.id
    );
    
    console.log("Entrega encontrada:", entregaCorrespondiente);
    
    if (entregaCorrespondiente) {
      if (!entregaCorrespondiente.id_pedido && pedidoId) {
        console.log("⚠️ Entrega sin id_pedido, agregando desde estado:", pedidoId);
        entregaCorrespondiente.id_pedido = pedidoId;
      }
      
      console.log("Entrega final con id_pedido:", entregaCorrespondiente.id_pedido);
      setEntregaSeleccionada(entregaCorrespondiente);
      setActiveTab("formulario");
    } else {
      console.error("❌ No se encontró la entrega para el cliente:", cliente.id);
      warning("No se encontró información de entrega para este cliente", "Cliente No Encontrado");
    }
  };

  // Manejar la finalización de entrega
  const handleFormularioComplete = (clienteId: number) => {
    console.log("Entrega completada para cliente:", clienteId);
    
    // Actualizar estado de entregas
    setEntregas((prev) =>
      prev.map((e) =>
        e.id_cliente === clienteId
          ? { ...e, estado: "entregado" as const }
          : e
      )
    );
    
    // Actualizar conjunto de clientes entregados
    setClientesEntregados((prev) => new Set([...prev, clienteId]));
    
    // Limpiar selección y volver a lista
    setEntregaSeleccionada(null);
    setActiveTab("clientes");
  };

  const handleFormularioCancel = () => {
    setEntregaSeleccionada(null);
    setActiveTab("clientes");
  };

  const handleFinalizarRuta = () => {
    // Redirigir al home o mostrar resumen
    success("La ruta ha sido finalizada exitosamente", "¡Ruta Finalizada!");
    setTimeout(() => {
      window.location.href = "/driver";
    }, 2000);
  };

  // Calcular entregas pendientes en tiempo real
  const clientesPendientes = Array.from(
    new Set(
      programacion.filter(p => p.estado === "PENDIENTE").map(p => p.id_cliente)
    )
  ).length;

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

  // Pantalla de inicio de ruta
  if (!rutaIniciada) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center p-4">
        <div className="text-center text-white mb-8">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-6xl">
              local_shipping
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">¡Bienvenido!</h1>
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm mb-1">Ruta de hoy</p>
            <p className="text-2xl font-bold">{clientesPendientes} entregas</p>
          </div>
        </div>

        <button
          onClick={handleIniciarRuta}
          disabled={iniciandoRuta}
          className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {iniciandoRuta ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Iniciando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">play_arrow</span>
              <span>INICIAR RUTA</span>
            </>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="mt-6 text-white/80 hover:text-white flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    );
  }

  // Contenido principal
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
          {/* Contador dinámico */}
          {rutaData && (
            <div className="bg-white/20 px-2 py-1 rounded text-xs">
              {clientesPendientes} pendientes
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
              {/*Contador dinámico */}
              <span>Entregas ({clientesPendientes})</span>
            </div>
          </button>
        </div>
      )}

      {/* Contenido de las pantallas */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ruta" && (
          <PantallaRuta rutaData={rutaData} />
        )}
        {activeTab === "clientes" && rutaData && (
          <PantallaClientes
            orderedClients={rutaData.orderedClients}
            onEntregarClick={handleClienteEntregarClick}
            pedidoId={pedidoId}
            onFinalizarRuta={handleFinalizarRuta}
          />
        )}
        {activeTab === "formulario" && entregaSeleccionada && (
          <FormularioContainer
            entrega={entregaSeleccionada}
            onComplete={handleFormularioComplete}
            onCancel={handleFormularioCancel}
          />
        )}
      </div>

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
