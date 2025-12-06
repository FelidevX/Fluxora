"use client";

import { useEffect, useState } from 'react';
import { Modulo, PERMISOS_POR_ROL } from '@/types/rol';

interface UserInfo {
  email?: string;
  role?: string;
  sub?: string;
}

/**
 * Hook para obtener información del usuario y verificar permisos
 */
export function usePermisos() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Decodificar JWT
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      
      const decoded = JSON.parse(jsonPayload);
      setUser(decoded);
    } catch (error) {
      console.error("Error al decodificar token:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verifica si el usuario tiene acceso a un módulo específico
   */
  const tieneAcceso = (modulo: Modulo): boolean => {
    if (!user?.role) return false;
    
    const permisos = PERMISOS_POR_ROL[user.role] || [];
    return permisos.includes(modulo);
  };

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  const tieneRol = (...roles: string[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  /**
   * Obtiene todos los módulos accesibles por el usuario
   */
  const getModulosAccesibles = (): Modulo[] => {
    if (!user?.role) return [];
    return PERMISOS_POR_ROL[user.role] || [];
  };

  return {
    user,
    loading,
    tieneAcceso,
    tieneRol,
    getModulosAccesibles,
    isAdmin: user?.role === 'ADMIN',
  };
}
