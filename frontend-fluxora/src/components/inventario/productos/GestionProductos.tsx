"use client";

import { useState } from "react";
import { Producto, ProductoDTO } from "@/types/inventario";
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
      alert("El nombre del producto es requerido");
      return;
    }

    if (formulario.precioVenta <= 0) {
      alert("El precio de venta debe ser mayor a 0");
      return;
    }

    if (!productoEnEdicion && !recetaSeleccionada) {
      alert("Debe seleccionar una receta para crear el producto");
      return;
    }

    try {
      const productoDTO = {
        ...formulario,
        recetaMaestraId: recetaSeleccionada?.id || null,
      };

      if (productoEnEdicion) {
        await actualizarProducto(productoEnEdicion.id, productoDTO);
        alert("Producto actualizado exitosamente");
      } else {
        await crearProducto(productoDTO);
        alert(
          "Producto creado exitosamente. Ahora puede registrar lotes de producción."
        );
      }

      resetFormulario();
      setShowForm(false);
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert(
        `Error al guardar el producto: ${err instanceof Error ? err.message : "Error desconocido"
        }`
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
    <div>
      {/* Alertas */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Barra de búsqueda y acciones */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            icon="search"
          />
        </div>
        <Button onClick={onOpenMerma} variant="danger">
          <MaterialIcon name="delete_sweep" className="mr-2" />
          Registrar Merma
        </Button>
        <Button
          onClick={() => {
            resetFormulario();
            setShowForm(true);
          }}
          variant="primary"
        >
          <MaterialIcon name="add" className="mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={productosFiltrados}
          columns={columns}
          actions={actions}
          loading={loading}
          emptyMessage="No hay productos registrados"
        />
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => {
            setShowForm(false);
            resetFormulario();
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {productoEnEdicion ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetFormulario();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <MaterialIcon name="close" className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
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
                          : "-- Seleccione una receta --"}
                      </option>
                      {recetas
                        .filter((r) => r.activa)
                        .map((receta) => (
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
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetFormulario();
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading
                    ? "Guardando..."
                    : productoEnEdicion
                      ? "Actualizar"
                      : "Crear Producto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
