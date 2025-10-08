"use client";

import {
  ReactNode,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
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
  pagination?: {
    enabled?: boolean; // activar paginación
    serverSide?: boolean; // si la paginación es manejada por servidor
    total?: number; // total de elementos (útil para serverSide)
    page?: number; // página actual (útil para serverSide)
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
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
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    );
  }

  // Paginación: estado local para cliente
  const paginationEnabled = pagination?.enabled ?? false;
  const serverSide = pagination?.serverSide ?? false;
  const pageSizeOptions = pagination?.pageSizeOptions ?? [5, 10, 25, 50];
  const defaultPageSize =
    pagination?.defaultPageSize ?? pageSizeOptions[0] ?? 5;

  const [page, setPage] = useState<number>(pagination?.page ?? 1);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);

  // Si server-side, total puede venir en pagination.total, si no usar data.length
  const totalCount = serverSide
    ? pagination?.total ?? data.length
    : data.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Si la paginación es por servidor, notificar cambios iniciales
  useEffect(() => {
    if (serverSide && pagination?.onPageChange) pagination.onPageChange(page);
  }, []);

  // Cuando cambie página notificar a quien lo use (server-side)
  useEffect(() => {
    if (serverSide && pagination?.onPageChange) pagination.onPageChange(page);
  }, [page]);

  useEffect(() => {
    if (serverSide && pagination?.onPageSizeChange)
      pagination.onPageSizeChange(pageSize);
    // reset page when pageSize changes
    setPage(1);
  }, [pageSize]);

  // Calcular datos paginados para cliente
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalCount);
  const paginatedData = paginationEnabled
    ? serverSide
      ? data
      : data.slice(start, end)
    : data;

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
              {paginatedData.length === 0 ? (
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
                paginatedData.map((item, index) => (
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
                                <MaterialIcon name={action.icon} />
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

      {/* Paginación */}
      <TablePaginator
        // Componente controlado: pasamos estado y handlers
        data={data}
        enabled={paginationEnabled}
        serverSide={serverSide}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        pageSizeOptions={pageSizeOptions}
        totalCount={totalCount}
        totalPages={totalPages}
        columnsCount={columns.length + (actions.length > 0 ? 1 : 0)}
      />
    </div>
  );
}

// Componente interno para gestionar y mostrar paginación simple
function TablePaginator<T extends Record<string, any>>({
  data,
  enabled,
  serverSide,
  page,
  setPage,
  pageSize,
  setPageSize,
  pageSizeOptions,
  totalCount,
  totalPages,
  columnsCount,
}: {
  data: T[];
  enabled: boolean;
  serverSide: boolean;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  pageSizeOptions: number[];
  totalCount: number;
  totalPages: number;
  columnsCount: number;
}) {
  if (!enabled) {
    return (
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Total: {totalCount} elemento(s)</span>
      </div>
    );
  }

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalCount);

  const paginatedData = serverSide ? data : data.slice(start, end);

  return (
    <div>
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Mostrando {start + (totalCount === 0 ? 0 : 1)} - {end} de {totalCount}
        </span>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filas:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 5))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <nav className="inline-flex items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-l disabled:opacity-50"
              aria-label="Anterior"
            >
              &lt;
            </button>
            <span className="px-3 py-1 border-t border-b border-gray-300 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-r disabled:opacity-50"
              aria-label="Siguiente"
            >
              &gt;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
