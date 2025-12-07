"use client";

import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import DashboardEstadisticasEntregas from "@/components/admin/entregas/DashboardEstadisticasEntregas";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function EntregasPage() {
  return (
    <ProtectedRoute requiredModule="entregas">
      <div className="min-h-screen bg-gray-100 p-4 md:p-6 mt-12 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pedidos y Rutas</h1>
          <p className="text-sm text-gray-600">
            Accesos rápidos a los pedidos y la gestión de rutas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card
              title="Pedidos"
              description="Ver historial de pedidos entregados"
              icon="local_shipping"
              iconColor="bg-blue-50 text-blue-600"
              buttonText="Gestionar Pedidos"
              buttonVariant="primary"
              href="/dashboard/entregas/entregas"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card
              title="Rutas"
              description="Visualizar, crear, editar y asignar drivers a rutas programadas."
              icon="map"
              iconColor="bg-green-50 text-green-600"
              buttonText="Gestionar Rutas"
              buttonVariant="success"
              href="/dashboard/entregas/rutas"
            />
          </motion.div>
        </div>

        {/* Estadísticas de entregas (estático) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8"
        >
          <DashboardEstadisticasEntregas />
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
