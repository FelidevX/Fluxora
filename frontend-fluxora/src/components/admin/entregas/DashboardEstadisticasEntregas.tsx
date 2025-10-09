"use client";

import MaterialIcon from "@/components/ui/MaterialIcon";

export default function DashboardEstadisticasEntregas() {
  // Datos estáticos de ejemplo
  const stats = {
    total: 120,
    entregados: 95,
    entregasHoy: 30,
    entregasHoyCompletadas: 20,
    rutasActivas: 6,
    rutasCompletadasHoy: 4,
  };

  const entregadosPercent = Math.round((stats.entregados / stats.total) * 100);

  const recentDeliveries = [
    {
      id: 1245,
      cliente: "Panadería La Esquina",
      direccion: "Av. Libertad 123",
      hora_entrega: "2025-10-07 09:12",
      driver: "J. Pérez",
      ruta: "Ruta Norte 1",
    },
    {
      id: 1244,
      cliente: "Café Central",
      direccion: "Calle Mayor 58",
      hora_entrega: "2025-10-07 08:58",
      driver: "M. Gómez",
      ruta: "Ruta Centro 2",
    },
    {
      id: 1243,
      cliente: "Supermercado Sol",
      direccion: "Calle Sol 7",
      hora_entrega: "2025-10-07 08:42",
      driver: "R. Díaz",
      ruta: "Ruta Sur 3",
    },
    {
      id: 1242,
      cliente: "Panadería El Molino",
      direccion: "Av. Principal 300",
      hora_entrega: "2025-10-06 18:05",
      driver: "L. Fernández",
      ruta: "Ruta Norte 2",
    },
    {
      id: 1241,
      cliente: "Tienda Verde",
      direccion: "Pje. Los Cedros 12",
      hora_entrega: "2025-10-06 17:50",
      driver: "S. Ramírez",
      ruta: "Ruta Oeste 1",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MaterialIcon name="local_shipping" className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Entregas - Estadísticas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Entregados vs Total
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.entregados} / {stats.total}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {entregadosPercent}% completado
              </p>
            </div>
            <div className="text-blue-500 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100">
              <MaterialIcon name="task_alt" className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Entregas hoy / en curso
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                {stats.entregasHoyCompletadas} / {stats.entregasHoy}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.entregasHoy - stats.entregasHoyCompletadas} en curso
              </p>
            </div>
            <div className="text-emerald-500 w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100">
              <MaterialIcon name="today" className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">
                Rutas activas / completadas (hoy)
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {stats.rutasActivas} / {stats.rutasCompletadasHoy}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Rutas en ejecución / finalizadas
              </p>
            </div>
            <div className="text-orange-500 w-10 h-10 flex items-center justify-center rounded-full bg-orange-100">
              <MaterialIcon
                name="alt_route"
                className="w-5 h-5 text-orange-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Últimos pedidos entregados
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {recentDeliveries.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Registros recientes (estático)
              </p>
            </div>
            <div className="text-gray-500 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
              <MaterialIcon
                name="receipt_long"
                className="w-5 h-5 text-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Últimos pedidos entregados
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruta
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDeliveries.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {d.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {d.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {d.direccion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {d.hora_entrega}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {d.driver}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {d.ruta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
