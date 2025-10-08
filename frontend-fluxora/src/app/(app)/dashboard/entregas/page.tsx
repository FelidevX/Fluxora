import Card from "@/components/ui/Card";
import DashboardEstadisticasEntregas from "@/components/admin/entregas/DashboardEstadisticasEntregas";

export default function EntregasPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos y Rutas</h1>
        <p className="text-gray-600">
          Accesos rápidos a los pedidos y la gestión de rutas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Pedidos"
          description="Ver historial de pedidos entregados"
          icon="local_shipping"
          iconColor="bg-blue-50 text-blue-600"
          buttonText="Gestionar Pedidos"
          buttonVariant="primary"
          href="/dashboard/entregas/entregas"
        />

        <Card
          title="Rutas"
          description="Visualizar, crear, editar y asignar drivers a rutas programadas."
          icon="map"
          iconColor="bg-green-50 text-green-600"
          buttonText="Gestionar Rutas"
          buttonVariant="success"
          href="/dashboard/entregas/rutas"
        />
      </div>

      {/* Estadísticas de entregas (estático) */}
      <div className="mt-8">
        <DashboardEstadisticasEntregas />
      </div>
    </div>
  );
}
