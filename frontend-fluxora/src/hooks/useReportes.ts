import { useState } from "react";
import {
  FiltrosReporte,
  ReporteEntregas,
  ReporteVentas,
  ReporteInventario,
  ReporteClientes,
  ReporteRutas,
  ReporteProductividad,
  RespuestaReporte,
  TipoReporte,
} from "@/types/reportes";

export const useReportes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener token de autenticación
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

  // Generar reporte de entregas
  const generarReporteEntregas = async (
    filtros: FiltrosReporte
  ): Promise<RespuestaReporte<ReporteEntregas> | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        ...(filtros.idRuta && { idRuta: filtros.idRuta.toString() }),
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE
        }/api/entregas/entrega/reporte-entregas?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener reporte de entregas");
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || "Error al generar reporte");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generar reporte de ventas
  const generarReporteVentas = async (
    filtros: FiltrosReporte
  ): Promise<RespuestaReporte<ReporteVentas> | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE
        }/api/entregas/entrega/reporte-ventas?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener reporte de ventas");
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || "Error al generar reporte");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generar reporte de inventario
  const generarReporteInventario = async (
    filtros: FiltrosReporte
  ): Promise<RespuestaReporte<ReporteInventario> | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        ...(filtros.idProducto && {
          idProducto: filtros.idProducto.toString(),
        }),
      });

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE
        }/api/inventario/reporte-inventario?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener reporte de inventario");
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || "Error al generar reporte");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generar reporte de clientes
  const generarReporteClientes = async (
    filtros: FiltrosReporte
  ): Promise<RespuestaReporte<ReporteClientes> | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/reporte-clientes?` +
          new URLSearchParams({
            fechaInicio: filtros.fechaInicio,
            fechaFin: filtros.fechaFin,
          }),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener reporte de clientes");
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message || "Error al generar reporte");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función principal para generar cualquier tipo de reporte
  const generarReporte = async (
    filtros: FiltrosReporte
  ): Promise<any | null> => {
    switch (filtros.tipo) {
      case "entregas":
        return await generarReporteEntregas(filtros);
      case "ventas":
        return await generarReporteVentas(filtros);
      case "inventario":
        return await generarReporteInventario(filtros);
      case "clientes":
        return await generarReporteClientes(filtros);
      default:
        setError("Tipo de reporte no soportado");
        return null;
    }
  };

  return {
    loading,
    error,
    generarReporte,
    generarReporteEntregas,
    generarReporteVentas,
    generarReporteInventario,
    generarReporteClientes,
  };
};
