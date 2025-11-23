import { useState, useCallback } from "react";
import { ClienteDTO, ClienteResponse } from "@/types/Clientes";

interface UseClientesResult {
  clientes: ClienteResponse[];
  loading: boolean;
  error: string | null;
  cargarClientes: () => Promise<void>;
  crearCliente: (cliente: ClienteDTO) => Promise<void>;
  editarCliente: (id: number, cliente: ClienteDTO) => Promise<void>;
  eliminarCliente: (id: number) => Promise<void>;
  clearError: () => void;
}

export function useClientes(): UseClientesResult {
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Mapear los datos del backend al formato esperado por el frontend
      const clientesMapeados = (Array.isArray(data) ? data : []).map((cliente: any) => ({
        ...cliente,
        ruta: cliente.nombreRuta || "Sin ruta asignada",
        ultimaEntrega: cliente.ultimaEntrega || "Sin entregas",
        estado: cliente.estado || "activo",
      }));
      
      setClientes(clientesMapeados);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setError(
        "No se pudo conectar con el servidor. Verifique que el microservicio esté ejecutándose."
      );
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearCliente = async (cliente: ClienteDTO) => {
    try {
      setLoading(true);
      setError(null);

      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cliente),
        }
      );
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error("Error al crear el cliente");
      }
      await cargarClientes();
    } catch (err) {
      console.error("Error al crear cliente:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear el cliente"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editarCliente = async (id: number, cliente: ClienteDTO) => {
    try {
      setLoading(true);
      setError(null);

      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cliente),
        }
      );
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error("Error al editar el cliente");
      }
      await cargarClientes();
    } catch (err) {
      console.error("Error al editar cliente:", err);
      setError(
        err instanceof Error ? err.message : "Error al editar el cliente"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarCliente = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al eliminar el cliente");
      }
      await cargarClientes();
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      setError(
        err instanceof Error ? err.message : "Error al eliminar el cliente"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    clientes,
    loading,
    error,
    cargarClientes,
    crearCliente,
    editarCliente,
    clearError,
    eliminarCliente,
  };
}
