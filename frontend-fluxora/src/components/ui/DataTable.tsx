"use client";

import { ReactNode } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";

interface ColumnDefinition<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableAction<T> {
  label: string;
  icon: string;
  variant: "primary" | "success" | "warning" | "danger";
  onClick: (item: T) => void;
  condition?: (item: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = "No hay datos disponibles",
  className = "",
  searchValue,
  onSearch,
  searchPlaceholder = "Buscar...",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Búsqueda */}
      {onSearch && (
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue || ""}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.className || ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                    className="px-6 py-8 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <MaterialIcon
                        name="inbox"
                        className="w-12 h-12 text-gray-300 mb-2"
                      />
                      <p className="text-gray-500">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap ${
                          column.className || ""
                        }`}
                      >
                        {column.render ? (
                          column.render(item)
                        ) : (
                          <span className="text-sm text-gray-900">
                            {item[column.key] || "-"}
                          </span>
                        )}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {actions.map((action, actionIndex) => {
                            // Verificar condición si existe
                            if (action.condition && !action.condition(item)) {
                              return null;
                            }

                            return (
                              <Button
                                key={actionIndex}
                                variant={action.variant}
                                size="sm"
                                onClick={() => action.onClick(item)}
                                className="flex items-center gap-1"
                              >
                                <MaterialIcon
                                  name={action.icon}
                                  className="w-4 h-4"
                                />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información del total */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Total: {data.length} elemento(s)</span>
      </div>
    </div>
  );
}

export default DataTable;
