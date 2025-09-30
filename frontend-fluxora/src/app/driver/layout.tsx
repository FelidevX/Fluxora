"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Función para decodificar el JWT (exactamente igual que en Sidebar)
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

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getUserFromToken();
    console.log("JWT payload Driver Layout:", userData);

    // Si no hay token, redirigir al login
    if (!userData) {
      console.log("No hay userData, redirigiendo a login");
      router.push("/login");
      return;
    }

    // Si no es DRIVER, redirigir al dashboard
    if (userData.role !== "DRIVER") {
      console.log(
        "Usuario no es DRIVER:",
        userData.role,
        "redirigiendo a dashboard"
      );
      router.push("/dashboard");
      return;
    }

    console.log("Usuario es DRIVER, acceso permitido");
    setUser(userData);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center">
        <div className="text-white text-lg">Verificando acceso...</div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
