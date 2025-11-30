"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermisos } from "@/hooks/usePermisos";
import { Modulo } from "@/types/rol";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: Modulo;
  requiredRoles?: string[];
  fallbackUrl?: string;
}

/**
 * Componente para proteger rutas basado en permisos y roles
 * 
 * @example
 * // Proteger por módulo
 * <ProtectedRoute requiredModule="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * 
 * @example
 * // Proteger por rol específico
 * <ProtectedRoute requiredRoles={['ADMIN', 'DRIVER']}>
 *   <ReportesPanel />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  requiredModule,
  requiredRoles,
  fallbackUrl = "/dashboard",
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, tieneAcceso, tieneRol } = usePermisos();

  useEffect(() => {
    // Esperar a que cargue el usuario
    if (loading) return;

    // Si no hay usuario, redirigir al login
    if (!user) {
      router.push("/login");
      return;
    }

    // Si es PRODUCER y está intentando acceder al dashboard, redirigir a inventario
    if (user.role === 'PRODUCER' && requiredModule === 'dashboard') {
      router.replace('/dashboard/inventario');
      return;
    }

    // Verificar acceso al módulo si se especifica
    if (requiredModule && !tieneAcceso(requiredModule)) {
      router.push(fallbackUrl);
      return;
    }

    // Verificar roles si se especifican
    if (requiredRoles && requiredRoles.length > 0 && !tieneRol(...requiredRoles)) {
      router.push(fallbackUrl);
      return;
    }
  }, [user, loading, requiredModule, requiredRoles, router, tieneAcceso, tieneRol, fallbackUrl]);

  // Mostrar loader mientras verifica
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MaterialIcon name="hourglass_empty" className="text-4xl text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje de acceso denegado si no tiene usuario
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MaterialIcon name="lock" className="text-4xl text-red-600 mb-4" />
          <p className="text-gray-600">Acceso no autorizado</p>
        </div>
      </div>
    );
  }

  // Verificar acceso al módulo
  if (requiredModule && !tieneAcceso(requiredModule)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <MaterialIcon name="block" className="text-4xl text-red-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a este módulo.
          </p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Verificar roles
  if (requiredRoles && requiredRoles.length > 0 && !tieneRol(...requiredRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <MaterialIcon name="block" className="text-4xl text-red-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            Tu rol no tiene permisos suficientes para acceder a esta sección.
          </p>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Si pasa todas las validaciones, mostrar el contenido
  return <>{children}</>;
}
