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
  onExportarExcel?: () => void;
  onExportarPDF?: () => void;
}

export default function ReportTable({
  data,
  columns,
  titulo,
  onExportarExcel,
  onExportarPDF,
}: ReportTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 text-center">
        <MaterialIcon
          name="inbox"
          className="text-5xl md:text-6xl text-gray-300 mx-auto mb-4"
        />
        <p className="text-sm md:text-base text-gray-500">
          No hay datos disponibles para este reporte
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">{titulo}</h3>
        <div className="flex gap-2 md:gap-3">
          {onExportarExcel && (
            <button
              onClick={onExportarExcel}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm text-sm flex-1 sm:flex-initial"
            >
              <MaterialIcon name="file_download" className="text-lg md:text-xl" />
              <span className="font-medium">Excel</span>
            </button>
          )}
          {onExportarPDF && (
            <button
              onClick={onExportarPDF}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm text-sm flex-1 sm:flex-initial"
            >
              <MaterialIcon name="picture_as_pdf" className="text-lg md:text-xl" />
              <span className="font-medium">PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                    className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900"
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
      <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs md:text-sm text-gray-600">
          Total de registros:{" "}
          <span className="font-semibold">{data.length}</span>
        </p>
      </div>
    </div>
  );
}
