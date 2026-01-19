"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMermas } from "@/hooks/useMermas";
import { useProductos } from "@/hooks/useProductos";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { MermaProducto } from "@/types/inventario";

// Interface para las mermas agrupadas por fecha
interface MermasAgrupadas {
  fecha: string;
  mermas: MermaProducto[];
  totalCantidad: number;
  totalValor: number;
  cantidadProductos: number;
}

export default function HistorialMermas() {
  const { mermas, loading, error, cargarMermas, clearError } = useMermas();
  const { productos, cargarProductos } = useProductos();
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mermasSeleccionadas, setMermasSeleccionadas] = useState<
    MermaProducto[]
  >([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");

  useEffect(() => {
    cargarMermas();
    cargarProductos();
  }, []);

  // Función para obtener el precio de un producto
  const obtenerPrecioProducto = (productoId: number): number => {
    const producto = productos.find((p) => p.id === productoId);
    return producto?.precioVenta || 0;
  };

  // Agrupar mermas por fecha
  const mermasAgrupadas = useMemo(() => {
    const grupos: { [key: string]: MermasAgrupadas } = {};

    mermas.forEach((merma) => {
      const fecha = new Date(merma.fechaRegistro).toLocaleDateString("es-CL");

      if (!grupos[fecha]) {
        grupos[fecha] = {
          fecha,
          mermas: [],
          totalCantidad: 0,
          totalValor: 0,
          cantidadProductos: 0,
        };
      }

      const precioProducto = obtenerPrecioProducto(merma.productoId);
      const valorMerma = merma.cantidadMermada * precioProducto;

      grupos[fecha].mermas.push(merma);
      grupos[fecha].totalCantidad += merma.cantidadMermada;
      grupos[fecha].totalValor += valorMerma;
      grupos[fecha].cantidadProductos++;
    });

    return Object.values(grupos).sort((a, b) => {
      return (
        new Date(b.mermas[0].fechaRegistro).getTime() -
        new Date(a.mermas[0].fechaRegistro).getTime()
      );
    });
  }, [mermas, productos]);

  // Filtrar mermas agrupadas
  const mermasFiltradas = useMemo(() => {
    return mermasAgrupadas.filter((grupo) => {
      // Filtro por búsqueda
      const cumpleBusqueda =
        !busqueda ||
        grupo.mermas.some(
          (merma) =>
            merma.productoNombre
              .toLowerCase()
              .includes(busqueda.toLowerCase()) ||
            merma.motivo.toLowerCase().includes(busqueda.toLowerCase())
        );

      // Filtro por rango de fechas
      let cumpleFecha = true;
      if (fechaInicio || fechaFin) {
        const fechaGrupo = new Date(grupo.mermas[0].fechaRegistro);
        fechaGrupo.setHours(0, 0, 0, 0);

        if (fechaInicio) {
          const inicio = new Date(fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          cumpleFecha = cumpleFecha && fechaGrupo >= inicio;
        }

        if (fechaFin) {
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          cumpleFecha = cumpleFecha && fechaGrupo <= fin;
        }
      }

      return cumpleBusqueda && cumpleFecha;
    });
  }, [mermasAgrupadas, busqueda, fechaInicio, fechaFin]);

  const abrirModal = (grupo: MermasAgrupadas) => {
    setMermasSeleccionadas(grupo.mermas);
    setFechaSeleccionada(grupo.fecha);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setMermasSeleccionadas([]);
    setFechaSeleccionada("");
  };

  const columns = [
    {
      key: "fecha",
      label: "Fecha",
      render: (grupo: MermasAgrupadas) => (
        <div className="font-medium text-gray-900">{grupo.fecha}</div>
      ),
    },
    {
      key: "cantidadProductos",
      label: "Productos Afectados",
      render: (grupo: MermasAgrupadas) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-blue-600">
            {grupo.cantidadProductos}
          </span>
          <div className="text-xs text-gray-500">productos</div>
        </div>
      ),
    },
    {
      key: "totalCantidad",
      label: "Cantidad Total",
      render: (grupo: MermasAgrupadas) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-red-600">
            {grupo.totalCantidad.toFixed(1)}
          </span>
          <div className="text-xs text-gray-500">Kg</div>
        </div>
      ),
    },
    {
      key: "totalValor",
      label: "Valor Desechado",
      render: (grupo: MermasAgrupadas) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-red-700">
            ${grupo.totalValor.toLocaleString("es-CL")}
          </span>
        </div>
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (grupo: MermasAgrupadas) => (
        <button
          onClick={() => abrirModal(grupo)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MaterialIcon name="visibility" className="w-4 h-4" />
          Ver Detalles
        </button>
      ),
    },
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Días con Mermas</p>
              <p className="text-2xl font-bold text-gray-900">
                {mermasAgrupadas.length}
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
              <p className="text-sm text-gray-500">Total de Mermas</p>
              <p className="text-2xl font-bold text-blue-600">
                {mermas.length}
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
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valor Total Desechado</p>
              <p className="text-2xl font-bold text-red-700">
                $
                {mermasAgrupadas
                  .reduce((sum, g) => sum + g.totalValor, 0)
                  .toLocaleString("es-CL")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>
        </div>
        {(fechaInicio || fechaFin) && (
          <button
            onClick={() => {
              setFechaInicio("");
              setFechaFin("");
            }}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MaterialIcon name="close" className="w-4 h-4" />
            Limpiar filtros de fecha
          </button>
        )}
      </motion.div>

      {/* Tabla usando DataTable con búsqueda y paginación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <DataTable
          data={mermasFiltradas}
          columns={columns}
          loading={loading}
          searchValue={busqueda}
          onSearch={setBusqueda}
          searchPlaceholder="Buscar por producto o motivo..."
          emptyMessage="No hay mermas registradas en el período seleccionado"
          pagination={{
            enabled: true,
            serverSide: false,
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 25, 50],
          }}
        />
      </motion.div>

      {/* Modal de detalles */}
      <AnimatePresence>
        {modalAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cerrarModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Detalle de Mermas - {fechaSeleccionada}
                  </h3>
                  <p className="text-red-100 text-sm mt-1">
                    {mermasSeleccionadas.length} producto(s) mermado(s)
                  </p>
                </div>
                <button
                  onClick={cerrarModal}
                  className="text-white hover:bg-red-800 rounded-full p-2 transition-colors"
                >
                  <MaterialIcon name="close" className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="space-y-4">
                  {mermasSeleccionadas.map((merma, index) => {
                    const precio = obtenerPrecioProducto(merma.productoId);
                    const valorMerma = merma.cantidadMermada * precio;

                    return (
                      <motion.div
                        key={merma.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-lg text-gray-900">
                                  {merma.productoNombre}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    merma.fechaRegistro
                                  ).toLocaleTimeString("es-CL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  merma.tipoMerma === "AUTOMATICA"
                                    ? "info"
                                    : "warning"
                                }
                              >
                                {merma.tipoMerma === "AUTOMATICA"
                                  ? "Automática"
                                  : "Manual"}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MaterialIcon
                                  name="scale"
                                  className="w-5 h-5 text-gray-400"
                                />
                                <span className="text-sm text-gray-600">
                                  Cantidad:{" "}
                                  <span className="font-semibold text-red-600">
                                    {merma.cantidadMermada.toFixed(1)} Kg
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <MaterialIcon
                                  name="attach_money"
                                  className="w-5 h-5 text-gray-400"
                                />
                                <span className="text-sm text-gray-600">
                                  Precio unitario:{" "}
                                  <span className="font-semibold text-gray-900">
                                    ${precio.toLocaleString("es-CL")}
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <MaterialIcon
                                  name="money_off"
                                  className="w-5 h-5 text-gray-400"
                                />
                                <span className="text-sm text-gray-600">
                                  Valor desechado:{" "}
                                  <span className="font-semibold text-red-700">
                                    ${valorMerma.toLocaleString("es-CL")}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-start gap-2">
                              <MaterialIcon
                                name="info"
                                className="w-5 h-5 text-gray-400 mt-0.5"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Motivo:
                                </p>
                                <p className="text-sm text-gray-600 bg-white rounded px-3 py-2 border border-gray-200">
                                  {merma.motivo}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Resumen del modal */}
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-600 font-medium mb-1">
                        Total Productos
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {mermasSeleccionadas.length}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-red-600 font-medium mb-1">
                        Total Cantidad
                      </p>
                      <p className="text-2xl font-bold text-red-700">
                        {mermasSeleccionadas
                          .reduce((sum, m) => sum + m.cantidadMermada, 0)
                          .toFixed(1)}{" "}
                        Kg
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-red-600 font-medium mb-1">
                        Valor Total Desechado
                      </p>
                      <p className="text-2xl font-bold text-red-700">
                        $
                        {mermasSeleccionadas
                          .reduce(
                            (sum, m) =>
                              sum +
                              m.cantidadMermada *
                                obtenerPrecioProducto(m.productoId),
                            0
                          )
                          .toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
