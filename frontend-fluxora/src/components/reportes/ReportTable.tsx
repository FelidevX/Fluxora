import MaterialIcon from "../ui/MaterialIcon";

interface Column {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface ReportTableProps {
  data: any[];
  columns: Column[];
  titulo: string;
  onExportar?: () => void;
}

export default function ReportTable({
  data,
  columns,
  titulo,
  onExportar,
}: ReportTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <MaterialIcon
          name="inbox"
          className="text-6xl text-gray-300 mx-auto mb-4"
        />
        <p className="text-gray-500">
          No hay datos disponibles para este reporte
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
        {onExportar && (
          <button
            onClick={onExportar}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <MaterialIcon name="download" className="text-xl" />
            <span className="font-medium">Exportar a Excel</span>
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {col.format ? col.format(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con total de registros */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total de registros:{" "}
          <span className="font-semibold">{data.length}</span>
        </p>
      </div>
    </div>
  );
}
