"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GestionRutas from "@/components/admin/entregas/gestion/GestionRutas";
import { RutaActiva } from "@/interfaces/entregas/entregas";

export default function GestionRutasPage() {
  const [rutas, setRutas] = useState<RutaActiva[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchRutas = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        console.warn("No auth token found");
        setRutas([]);
        return;
      }
      if (token.startsWith("Bearer ")) token = token.substring(7);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-activas`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setRutas(data || []);
      } else {
        console.error("Failed to fetch rutas:", res.statusText);
        setRutas([]);
      }
    } catch (e) {
      console.error(e);
      setRutas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutas();
  }, []);

  const handleVerDetalle = (ruta: RutaActiva) => {
    router.push(`/dashboard/entregas/detalle-ruta?id=${ruta.id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Rutas</h1>
      <GestionRutas
        rutas={rutas}
        loading={loading}
        onRefresh={fetchRutas}
        onVerDetalle={handleVerDetalle}
      />
    </div>
  );
}
