"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Producto, ProductoDTO } from "@/types/inventario";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import { RecetaMaestra } from "@/types/produccion";
import { useProductos } from "@/hooks/useProductos";
import { useRecetas } from "@/hooks/useRecetas";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import LoteProductoModal from "@/components/inventario/LoteProductoModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModalText";

interface GestionProductosProps {
  onOpenMerma: () => void;
}

export default function GestionProductos({
  onOpenMerma,
}: GestionProductosProps) {
  const {
    productos,
    loading,
    error,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    clearError,
  } = useProductos();

  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  const { recetas, loading: loadingRecetas } = useRecetas();

  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(
    null
  );
  const [productoParaLotes, setProductoParaLotes] = useState<Producto | null>(
    null
  );
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<RecetaMaestra | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(
    null
  );

  const [formulario, setFormulario] = useState<ProductoDTO>({
    nombre: "",
    estado: "activo",
    precioVenta: 0,
    tipoProducto: "CORRIENTE",
    categoria: "",
  });

  const resetFormulario = () => {
    setFormulario({
      nombre: "",
      estado: "activo",
      precioVenta: 0,
      tipoProducto: "CORRIENTE",
      categoria: "",
    });
    setProductoEnEdicion(null);
    setRecetaSeleccionada(null);
  };

  const handleRecetaChange = (recetaId: number) => {
    const receta = recetas.find((r) => r.id === recetaId);
    if (receta) {
      setRecetaSeleccionada(receta);

      const nuevoTipoProducto =
        receta.categoria.toLowerCase() === "panaderia"
          ? "CORRIENTE"
          : "NO_APLICA";

      setFormulario((prev) => ({
        ...prev,
        nombre: receta.nombre,
        categoria: receta.categoria,
        precioVenta: receta.precioUnidad,
        tipoProducto: nuevoTipoProducto,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulario.nombre) {
      warning("El nombre del producto es requerido");
      return;
    }

    if (formulario.precioVenta <= 0) {
      warning("El precio de venta debe ser mayor a 0");
      return;
    }

    if (!productoEnEdicion && !recetaSeleccionada) {
      warning("Debe seleccionar una receta para crear el producto");
      return;
    }

    try {
      const productoDTO = {
        ...formulario,
        recetaMaestraId: recetaSeleccionada?.id || null,
      };

      if (productoEnEdicion) {
        await actualizarProducto(productoEnEdicion.id, productoDTO);
        success("Producto actualizado exitosamente");
      } else {
        await crearProducto(productoDTO);
        success(
          "Producto creado exitosamente. Ahora puede registrar lotes de producción."
        );
      }

      resetFormulario();
      setShowForm(false);
    } catch (err) {
      console.error("Error al guardar producto:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Guardar Producto"
      );
    }
  };

  const handleEdit = (producto: Producto) => {
    setProductoEnEdicion(producto);
    setFormulario({
      nombre: producto.nombre,
      estado: producto.estado,
      precioVenta: producto.precioVenta,
      tipoProducto: producto.tipoProducto || "NO_APLICA",
      categoria: producto.categoria,
    });
    setShowForm(true);
  };

  const handleDelete = (producto: Producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productoAEliminar) return;

    try {
      await eliminarProducto(productoAEliminar.id);
      setShowDeleteModal(false);
      setProductoAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProductoAEliminar(null);
    clearError();
  };

  const handleGestionarLotes = (producto: Producto) => {
    setProductoParaLotes(producto);
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Filtrar recetas que ya están asociadas a productos existentes
  const recetasDisponibles = recetas.filter((receta) => {
    // Solo mostrar recetas activas que no estén asociadas a ningún producto
    return (
      receta.activa &&
      !productos.some((producto) => producto.recetaMaestraId === receta.id)
    );
  });

  const columns = [
    {
      key: "nombre",
      label: "Nombre",
      render: (producto: Producto) => (
        <div>
          <div className="font-medium text-gray-500">{producto.nombre}</div>
          <div className="text-xs text-gray-500">{producto.categoria}</div>
        </div>
      ),
    },
    {
      key: "tipoProducto",
      label: "Tipo",
      render: (producto: Producto) => {
        if (
          !producto.categoria ||
          producto.categoria.toLowerCase() !== "panaderia"
        ) {
          return <span className="text-gray-400 text-sm">N/A</span>;
        }

        if (!producto.tipoProducto || producto.tipoProducto === "NO_APLICA") {
          return (
            <span className="text-red-500 text-xs font-medium">
              Requiere tipo
            </span>
          );
        }

        const tipo = producto.tipoProducto.toUpperCase();

        return (
          <Badge variant={tipo === "ESPECIAL" ? "warning" : "info"}>
            {tipo === "CORRIENTE"
              ? "Corriente"
              : tipo === "ESPECIAL"
                ? "Especial"
                : producto.tipoProducto}
          </Badge>
        );
      },
    },
    {
      key: "precioVenta",
      label: "Precio Venta",
      render: (producto: Producto) => (
        <span className="font-semibold text-green-600">
          ${(producto.precioVenta || 0).toLocaleString("es-CL")}
        </span>
      ),
    },
    {
      key: "stockTotal",
      label: "Stock Total",
      render: (producto: Producto) => (
        <div className="text-center">
          <span className="font-semibold text-lg text-gray-400">
            {producto.stockTotal || 0}
          </span>
          <div className="text-xs text-gray-500">Kg</div>
        </div>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (producto: Producto) => (
        <Badge variant={producto.estado === "activo" ? "success" : "danger"}>
          {producto.estado === "activo" ? "Activo" : "Descontinuado"}
        </Badge>
      ),
    },
  ];

  const actions = [
    {
      label: "Gestionar Lotes",
      icon: "inventory_2",
      variant: "primary" as const,
      onClick: (producto: Producto) => handleGestionarLotes(producto),
    },
    {
      label: "Editar",
      icon: "edit",
      variant: "warning" as const,
      onClick: (producto: Producto) => handleEdit(producto),
    },
    {
      label: "Eliminar",
      icon: "delete",
      variant: "danger" as const,
      onClick: (producto: Producto) => handleDelete(producto),
    },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión de Productos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Administra los productos y sus lotes de producción
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button 
            onClick={onOpenMerma} 
            variant="danger" 
            icon="delete_sweep"
            className="w-full sm:w-auto whitespace-nowrap"
          >
            Registrar Merma
          </Button>
          <Button
            onClick={() => {
              resetFormulario();
              setShowForm(true);
            }}
            variant="primary"
            icon="add"
            className="w-full sm:w-auto whitespace-nowrap"
          >
            Nuevo Producto
          </Button>
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

      {/* Tabla de productos usando DataTable con búsqueda y paginación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <DataTable
          data={productosFiltrados}
          columns={columns}
          actions={actions}
          loading={loading}
          searchValue={busqueda}
          onSearch={setBusqueda}
          searchPlaceholder="Buscar por nombre o categoría..."
          emptyMessage="No hay productos registrados"
          pagination={{
            enabled: true,
            serverSide: false,
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 25, 50],
          }}
        />
      </motion.div>

      {/* Modal de formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowForm(false);
              resetFormulario();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-full md:max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-3 md:py-4 flex justify-between items-center z-10">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800">
                {productoEnEdicion ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetFormulario();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <MaterialIcon name="close" className="text-xl md:text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6">
              <div className="space-y-4">
                {/* Selector de Receta (solo para crear) */}
                {!productoEnEdicion && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Seleccionar Receta *
                    </label>
                    <select
                      value={recetaSeleccionada?.id || ""}
                      onChange={(e) =>
                        handleRecetaChange(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
                      required
                      disabled={loadingRecetas}
                    >
                      <option value="">
                        {loadingRecetas
                          ? "Cargando recetas..."
                          : recetasDisponibles.length === 0
                            ? "No hay recetas disponibles"
                            : "-- Seleccione una receta --"}
                      </option>
                      {recetasDisponibles.map((receta) => (
                        <option key={receta.id} value={receta.id}>
                          {receta.nombre} - {receta.categoria}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      El nombre, categoría y precio se extraerán de la receta
                      seleccionada
                    </p>
                  </div>
                )}

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Nombre del Producto *
                  </label>
                  <Input
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) =>
                      setFormulario({ ...formulario, nombre: e.target.value })
                    }
                    required
                    placeholder="Seleccione una receta"
                    readOnly={!productoEnEdicion}
                    className={!productoEnEdicion ? "bg-gray-100" : ""}
                  />
                  {!productoEnEdicion && (
                    <p className="text-xs text-gray-500 mt-1">
                      El nombre se obtiene de la receta seleccionada
                    </p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Categoría *
                  </label>
                  <select
                    value={formulario.categoria}
                    onChange={(e) => {
                      const categoria = e.target.value;
                      setFormulario({
                        ...formulario,
                        categoria,
                        tipoProducto:
                          categoria.toLowerCase() !== "panaderia"
                            ? "NO_APLICA"
                            : "CORRIENTE",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
                    required
                  >
                    <option value="">-- Seleccione una categoría --</option>
                    <option value="panaderia">Panadería</option>
                    <option value="pasteleria">Pastelería</option>
                    <option value="reposteria">Repostería</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {/* Tipo Producto (solo si es panadería) */}
                {formulario.categoria.toLowerCase() === "panaderia" && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Tipo de Producto (Panadería) *
                    </label>
                    <select
                      value={formulario.tipoProducto || "CORRIENTE"}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          tipoProducto: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
                      required
                    >
                      <option value="CORRIENTE">Corriente</option>
                      <option value="ESPECIAL">Especial</option>
                    </select>
                    {!productoEnEdicion && (
                      <p className="text-xs text-gray-500 mt-1">
                        Por defecto es "Corriente", puede cambiarse a "Especial"
                      </p>
                    )}
                  </div>
                )}

                {/* Precio de Venta */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Precio de Venta *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">$</span>
                    <Input
                      type="number"
                      value={formulario.precioVenta || ""}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          precioVenta: Number(e.target.value),
                        })
                      }
                      min="0"
                      step="1"
                      required
                      readOnly={!productoEnEdicion}
                      className={!productoEnEdicion ? "bg-gray-100" : ""}
                    />
                  </div>
                  {!productoEnEdicion && (
                    <p className="text-xs text-gray-500 mt-1">
                      El precio se obtiene de la receta seleccionada
                    </p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Estado *
                  </label>
                  <select
                    value={formulario.estado}
                    onChange={(e) =>
                      setFormulario({ ...formulario, estado: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
                    required
                  >
                    <option value="activo">Activo</option>
                    <option value="descontinuado">Descontinuado</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetFormulario();
                  }}
                  variant="secondary"
                  className="flex-1 w-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1 w-full"
                >
                  {loading
                    ? "Guardando..."
                    : productoEnEdicion
                      ? "Actualizar"
                      : "Crear Producto"}
                </Button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de gestión de lotes */}
      {productoParaLotes && (
        <LoteProductoModal
          producto={productoParaLotes}
          isOpen={!!productoParaLotes}
          onClose={() => setProductoParaLotes(null)}
        />
      )}

      {/* Modal de confirmación para eliminar producto */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Producto"
        message="¿Está seguro de que desea eliminar este producto? Se eliminarán también todos sus lotes de producción. Esta acción no se puede deshacer."
        itemName={productoAEliminar?.nombre}
        requireConfirmation={true}
      />

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
