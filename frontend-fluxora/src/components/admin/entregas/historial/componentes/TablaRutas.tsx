"use client";

import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

interface Ruta {
  id: number;
  id_driver: number;
  fecha: string;
  kg_corriente: number;
  kg_especial: number;
  corriente_devuelto: number;
  especial_devuelto: number;
  hora_retorno: string | null;
}

interface TablaRutasProps {
  rutas: Ruta[];
  getNombreDriver: (idDriver: number) => string;
  onVerDetalles: (ruta: Ruta) => void;
  loading?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
}

export function TablaRutas({
  rutas,
  getNombreDriver,
  onVerDetalles,
  loading = false,
  searchValue = "",
  onSearch,
}: TablaRutasProps) {
  return (
    <DataTable
      data={rutas}
      columns={[
        {
          key: "id_driver",
          label: "Conductor",
          render: (ruta: Ruta) => (
            <span className="text-sm font-medium text-gray-800 block">
              {getNombreDriver(ruta.id_driver)}
            </span>
          ),
        },
        {
          key: "fecha",
          label: "Fecha",
          render: (ruta: Ruta) => (
            <span className="text-sm text-gray-800 text-center block">
              {new Date(ruta.fecha).toLocaleDateString()}
            </span>
          ),
        },
        {
          key: "kg_corriente",
          label: "Pan Corriente",
          render: (ruta: Ruta) => (
            <span className="text-sm text-gray-800 text-center block">
              {ruta.kg_corriente} kg
            </span>
          ),
        },
        {
          key: "kg_especial",
          label: "Pan Especial",
          render: (ruta: Ruta) => (
            <span className="text-sm text-gray-800 text-center block">
              {ruta.kg_especial} kg
            </span>
          ),
        },
        {
          key: "corriente_devuelto",
          label: "Devuelto Corriente",
          render: (ruta: Ruta) => (
            <span className="text-sm text-gray-800 text-center block">
              {ruta.corriente_devuelto} kg
            </span>
          ),
        },
        {
          key: "especial_devuelto",
          label: "Devuelto Especial",
          render: (ruta: Ruta) => (
            <span className="text-sm text-gray-800 text-center block">
              {ruta.especial_devuelto} kg
            </span>
          ),
        },
        {
          key: "hora_retorno",
          label: "Estado",
          render: (ruta: Ruta) => (
            <div className="flex justify-center">
              <Badge variant={ruta.hora_retorno ? "success" : "warning"}>
                {ruta.hora_retorno ? "Finalizada" : "En proceso"}
              </Badge>
            </div>
          ),
        },
      ]}
      actions={[
        {
          label: "",
          icon: "visibility",
          variant: "primary" as const,
          onClick: (ruta: Ruta) => onVerDetalles(ruta),
        },
      ]}
      loading={loading}
      searchValue={searchValue}
      onSearch={onSearch}
      searchPlaceholder="Buscar por conductor, fecha..."
      pagination={{ enabled: true, serverSide: false, defaultPageSize: 10 }}
      emptyMessage="No se encontraron rutas registradas"
    />
  );
}