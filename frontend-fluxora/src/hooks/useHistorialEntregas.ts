import { useState, useEffect } from "react";

interface Ruta {
  id: number;
  id_driver: number;
  fecha: string;
  kg_corriente: number;
  kg_especial: number;
  corriente_devuelto: number;
  especial_devuelto: number;
  hora_retorno: string | null;
  pagado: boolean;
  fecha_pago: string | null;
  monto_total: number;
}

interface Driver {
  id: number;
  nombre: string;
  email: string;
}

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
}

interface DetalleEntrega {
  id: number;
  id_pedido: number;
  id_cliente: number;
  monto_total: number;
  hora_entregada: string;
  corriente_entregado: number;
  especial_entregado: number;
  comentario: string;
}

export function useHistorialEntregas() {
  const [entregas, setEntregas] = useState<Ruta[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [detallesEntrega, setDetallesEntrega] = useState<DetalleEntrega[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

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

  const fetchDrivers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios?rol=DRIVER`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error("Error al obtener drivers:", error);
    }
  };

  const fetchClientes = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  const fetchHistorialEntregas = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/pedidos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEntregas(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener historial de entregas:", error);
      setEntregas([]);
    }
  };

  const fetchDetallesEntrega = async (idPedido: number) => {
    setLoadingDetalles(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/pedido/${idPedido}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDetallesEntrega(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener detalles de entrega:", error);
      setDetallesEntrega([]);
    } finally {
      setLoadingDetalles(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchDrivers(), fetchClientes()]);
        await fetchHistorialEntregas();
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getNombreDriver = (idDriver: number): string => {
    const driver = drivers.find((d) => d.id === idDriver);
    return driver ? driver.nombre : `Driver #${idDriver}`;
  };

  const marcarComoPagado = async (idSesion: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/marcar-pagado/${idSesion}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Actualizar la lista de entregas
        await fetchHistorialEntregas();
        return true;
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al marcar como pagado:", error);
      throw error;
    }
  };

  return {
    entregas,
    drivers,
    clientes,
    loading,
    detallesEntrega,
    loadingDetalles,
    fetchDetallesEntrega,
    getNombreDriver,
    marcarComoPagado,
  };
}
