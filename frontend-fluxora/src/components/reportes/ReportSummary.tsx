import { ResumenReporte } from "@/types/reportes";

interface ReportSummaryProps {
  resumen: ResumenReporte;
  tipo: string;
}

export default function ReportSummary({ resumen, tipo }: ReportSummaryProps) {
  // Configuración de métricas según el tipo de reporte
  const getMetricas = () => {
    switch (tipo) {
      case "entregas":
        return [
          {
            label: "Total Entregas",
            value: resumen.totalEntregas || resumen.totalRegistros || 0,
            icon: "📦",
          },
          {
            label: "Entregas Programadas",
            value: resumen.totalProgramadas || 0,
            icon: "📋",
          },
          {
            label: "Kg Total",
            value: `${(resumen.totalKilos || 0).toFixed(1)} kg`,
            icon: "⚖️",
          },
          {
            label: "Tasa de Completado",
            value: `${(resumen.porcentajeCompletado || 0).toFixed(1)}%`,
            icon: "📊",
          },
        ];
      case "ventas":
        return [
          {
            label: "Ventas Totales",
            value: `$${(resumen.totalVentas || 0).toLocaleString()}`,
            icon: "💰",
          },
          {
            label: "Kg Vendidos",
            value: `${(resumen.totalKilos || 0).toFixed(1)} kg`,
            icon: "⚖️",
          },
          {
            label: "Clientes Únicos",
            value: resumen.totalClientes || 0,
            icon: "👥",
          },
          {
            label: "Ticket Promedio",
            value: `$${(resumen.ticketPromedio || 0).toLocaleString()}`,
            icon: "🎫",
          },
        ];
      case "inventario":
        return [
          {
            label: "Total Productos",
            value: resumen.totalRegistros,
            icon: "📦",
          },
          {
            label: "Entradas",
            value: `${(resumen.totalEntradas || 0).toFixed(1)} kg`,
            icon: "📥",
          },
          {
            label: "Salidas",
            value: `${(resumen.totalSalidas || 0).toFixed(1)} kg`,
            icon: "📤",
          },
          {
            label: "Stock Actual",
            value: `${(resumen.stockTotal || 0).toFixed(1)} kg`,
            icon: "📊",
          },
        ];
      case "clientes":
        return [
          {
            label: "Total Clientes",
            value: resumen.totalRegistros,
            icon: "👥",
          },
          {
            label: "Compras Totales",
            value: resumen.totalCompras || 0,
            icon: "🛒",
          },
          {
            label: "Kg Totales",
            value: `${(resumen.totalKilos || 0).toFixed(1)} kg`,
            icon: "⚖️",
          },
          {
            label: "Valor Total",
            value: `$${(resumen.valorTotal || 0).toLocaleString()}`,
            icon: "💵",
          },
        ];
      default:
        return [
          {
            label: "Total Registros",
            value: resumen.totalRegistros,
            icon: "📋",
          },
        ];
    }
  };

  const metricas = getMetricas();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span>📈</span>
        <span>Resumen del Reporte</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricas.map((metrica, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{metrica.icon}</span>
              <p className="text-xs text-gray-600 font-medium">
                {metrica.label}
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrica.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
