"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMermas } from "@/hooks/useMermas";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { MermaProducto } from "@/types/inventario";

export default function HistorialMermas() {
  const { mermas, loading, error, cargarMermas, clearError } = useMermas();
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarMermas();
  }, []);

  const columns = [
    {
      key: "fechaRegistro",
      label: "Fecha y Hora",
      render: (merma: MermaProducto) => {
        const fecha = new Date(merma.fechaRegistro);
        return (
          <div>
            <div className="font-medium text-gray-900">
              {fecha.toLocaleDateString("es-CL")}
            </div>
            <div className="text-xs text-gray-500">
              {fecha.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      },
    },
    {
      key: "productoNombre",
      label: "Producto",
      render: (merma: MermaProducto) => (
        <span className="font-medium text-gray-900">
          {merma.productoNombre}
        </span>
      ),
    },
    {
      key: "cantidadMermada",
      label: "Cantidad",
      render: (merma: MermaProducto) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-red-600">
            {merma.cantidadMermada.toFixed(1)}
          </span>
          <div className="text-xs text-gray-500">Kg</div>
        </div>
      ),
    },
    {
      key: "tipoMerma",
      label: "Tipo",
      render: (merma: MermaProducto) => (
        <Badge variant={merma.tipoMerma === "AUTOMATICA" ? "info" : "warning"}>
          {merma.tipoMerma === "AUTOMATICA" ? "Automática" : "Manual"}
        </Badge>
      ),
    },
    {
      key: "motivo",
      label: "Motivo",
      render: (merma: MermaProducto) => (
        <span className="text-sm text-gray-600">{merma.motivo}</span>
      ),
    },
  ];

  // Filtrar mermas por búsqueda
  const mermasFiltradas = mermas.filter(
    (merma) =>
      merma.productoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      merma.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
      merma.tipoMerma.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-between items-start"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Historial de Mermas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Registro completo de productos mermados
          </p>
        </div>
      </motion.div>

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={clearError}
          >
            <MaterialIcon name="close" className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Mermas</p>
              <p className="text-2xl font-bold text-gray-900">
                {mermas.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cantidad Total Mermada</p>
              <p className="text-2xl font-bold text-red-600">
                {mermas
                  .reduce((sum, m) => sum + m.cantidadMermada, 0)
                  .toFixed(1)}{" "}
                Kg
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mermas Automáticas</p>
              <p className="text-2xl font-bold text-blue-600">
                {mermas.filter((m) => m.tipoMerma === "AUTOMATICA").length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabla usando DataTable con búsqueda y paginación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
      <DataTable
        data={mermasFiltradas}
        columns={columns}
        loading={loading}
        searchValue={busqueda}
        onSearch={setBusqueda}
        searchPlaceholder="Buscar por producto, motivo o tipo..."
        emptyMessage="No hay mermas registradas"
        pagination={{
          enabled: true,
          serverSide: false,
          defaultPageSize: 10,
          pageSizeOptions: [5, 10, 25, 50],
        }}
      />
      </motion.div>
    </div>
  );
}
