import { useState, useCallback } from "react";
import { RutaActiva, ClienteDTO } from "@/interfaces/entregas/entregas";

interface Driver {
  id: number;
  nombre: string;
  email?: string;
}

interface ProgresoRuta {
  totalProgramadas: number;
  entregasRealizadas: number;
  progresoReal: number;
}

interface RutaDetalleCompleta extends RutaActiva {
  clientes: ClienteDTO[];
  driver?: Driver;
  progreso: number;
  totalClientes: number;
  entregasCompletadas: number;
}

const getAuthToken = () => {
  let token = localStorage.getItem("auth_token");
  if (!token) {
    throw new Error("No se encontró el token de autenticación");
  }
  if (token.startsWith("Bearer ")) {
    token = token.substring(7);
  }
  return token;
};

export function useRutas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todas las rutas activas
  const fetchRutasActivas = useCallback(async (): Promise<RutaActiva[]> => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-activas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar las rutas activas");
      }

      return await response.json();
    } catch (err) {
      console.error("Error al obtener rutas activas:", err);
      throw err;
    }
  }, []);

  // Obtener una ruta específica por ID
  const fetchRutaById = useCallback(async (rutaId: string): Promise<RutaActiva | null> => {
    try {
      const rutas = await fetchRutasActivas();
      return rutas.find((r) => r.id === parseInt(rutaId)) || null;
    } catch (err) {
      console.error("Error al obtener ruta por ID:", err);
      throw err;
    }
  }, [fetchRutasActivas]);

  // Obtener clientes de una ruta
  const fetchClientesRuta = useCallback(async (rutaId: string): Promise<ClienteDTO[]> => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/clientes/${rutaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar los clientes de la ruta");
      }

      return await response.json();
    } catch (err) {
      console.error("Error al obtener clientes de la ruta:", err);
      throw err;
    }
  }, []);

  // Obtener información del driver
  const fetchDriver = useCallback(async (driverId: number): Promise<Driver | null> => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios/${driverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.warn("No se pudo cargar la información del driver:", err);
      return null;
    }
  }, []);

  // Obtener programaciones de una ruta para una fecha
  const fetchProgramacionRuta = useCallback(
    async (rutaId: string, fecha: string): Promise<any[]> => {
      try {
        const token = getAuthToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/programacion/${rutaId}/${fecha}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          return await response.json();
        }
        return [];
      } catch (err) {
        console.warn("Error al obtener programaciones:", err);
        return [];
      }
    },
    []
  );

  // Verificar si un cliente tiene entrega hoy
  const verificarEntregaHoy = useCallback(
    async (clienteId: number, fechaHoy: string): Promise<boolean> => {
      try {
        const token = getAuthToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/cliente/${clienteId}/historial`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const historial = await response.json();
          const entregaHoy = historial.find((entrega: any) => {
            const fechaEntrega = new Date(entrega.hora_entregada)
              .toISOString()
              .split("T")[0];
            return fechaEntrega === fechaHoy && entrega.tipo === "VENTA";
          });
          return !!entregaHoy;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  // Calcular progreso de una ruta
  const calcularProgresoRuta = useCallback(
    async (rutaId: string, fecha?: string): Promise<ProgresoRuta> => {
      const fechaHoy = fecha || new Date().toISOString().split("T")[0];
      
      try {
        const programaciones = await fetchProgramacionRuta(rutaId, fechaHoy);
        const totalProgramadas = programaciones.length;

        if (totalProgramadas === 0) {
          return {
            totalProgramadas: 0,
            entregasRealizadas: 0,
            progresoReal: 0,
          };
        }

        // Verificar entregas realizadas
        const verificaciones = await Promise.all(
          programaciones.map((prog) =>
            verificarEntregaHoy(prog.id_cliente, fechaHoy)
          )
        );

        const entregasRealizadas = verificaciones.filter(Boolean).length;
        const progresoReal =
          totalProgramadas > 0
            ? Math.round((entregasRealizadas / totalProgramadas) * 100)
            : 0;

        return {
          totalProgramadas,
          entregasRealizadas,
          progresoReal,
        };
      } catch (err) {
        console.error("Error al calcular progreso:", err);
        return {
          totalProgramadas: 0,
          entregasRealizadas: 0,
          progresoReal: 0,
        };
      }
    },
    [fetchProgramacionRuta, verificarEntregaHoy]
  );

  // Obtener detalle completo de una ruta con progreso real
  const fetchRutaDetalle = useCallback(
    async (rutaId: string): Promise<RutaDetalleCompleta> => {
      setLoading(true);
      setError(null);

      try {
        // Obtener ruta base
        const ruta = await fetchRutaById(rutaId);
        if (!ruta) {
          throw new Error("Ruta no encontrada");
        }

        // Obtener clientes
        const clientes = await fetchClientesRuta(rutaId);

        // Obtener driver si está asignado
        let driver = null;
        if (ruta.id_driver) {
          driver = await fetchDriver(ruta.id_driver);
        }

        // Calcular progreso real
        const progreso = await calcularProgresoRuta(rutaId);

        return {
          ...ruta,
          clientes,
          driver: driver || undefined,
          progreso: progreso.progresoReal,
          totalClientes: progreso.totalProgramadas,
          entregasCompletadas: progreso.entregasRealizadas,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al cargar la ruta";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      fetchRutaById,
      fetchClientesRuta,
      fetchDriver,
      calcularProgresoRuta,
    ]
  );

  // Obtener ruta optimizada desde el backend usando OR-Tools
  const fetchRutaOptimizada = useCallback(
    async (rutaId: string): Promise<{
      orderedClients: ClienteDTO[];
      osrmRoute: any;
      origen: { latitud: number; longitud: number };
    }> => {
      try {
        const token = getAuthToken();
        const url =`${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/optimized-ortools/${rutaId}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener la ruta optimizada");
        }

        const data = await response.json();
        return {
          orderedClients: data.orderedClients,
          osrmRoute: JSON.parse(data.osrmRoute),
          origen: data.origen,
        };
      } catch (err) {
        console.error("Error al obtener ruta optimizada:", err);
        throw err;
      }
    },
    []
  );

  return {
    loading,
    error,
    fetchRutasActivas,
    fetchRutaById,
    fetchClientesRuta,
    fetchDriver,
    fetchProgramacionRuta,
    calcularProgresoRuta,
    fetchRutaDetalle,
    fetchRutaOptimizada,
  };
}
