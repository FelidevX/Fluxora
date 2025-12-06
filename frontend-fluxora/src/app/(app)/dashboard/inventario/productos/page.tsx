"use client";

import { useState } from "react";
import GestionProductos from "@/components/inventario/productos/GestionProductos";
import HistorialMermas from "@/components/inventario/mermas/HistorialMermas";
import RegistrarMermaModal from "@/components/inventario/RegistrarMermaModal";
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
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import Link from "next/dist/client/link";

export default function ProductosPage() {
  const {
    productos,
    loading,
    error,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    clearError,
  } = useProductos();
  const [activeTab, setActiveTab] = useState<"gestion" | "mermas">("gestion");
  const [showMermaModal, setShowMermaModal] = useState(false);
  const { recetas, loading: loadingRecetas } = useRecetas();

  // Hook para notificaciones toast
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

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
    tipoProducto: "CORRIENTE", // Por defecto CORRIENTE
    categoria: "", // Vacío para forzar selección
  });

  const resetFormulario = () => {
    setFormulario({
      nombre: "",
      estado: "activo",
      precioVenta: 0,
      tipoProducto: "CORRIENTE", // Por defecto CORRIENTE
      categoria: "", // Vacío para forzar selección
    });
    setProductoEnEdicion(null);
    setRecetaSeleccionada(null);
  };

  const handleRecetaChange = (recetaId: number) => {
    const receta = recetas.find((r) => r.id === recetaId);
    if (receta) {
      setRecetaSeleccionada(receta);

      // Determinar el tipo de producto según la categoría
      const nuevoTipoProducto =
        receta.categoria.toLowerCase() === "panaderia"
          ? "CORRIENTE" // Por defecto CORRIENTE para panadería
          : "NO_APLICA";

      // Actualizar formulario con datos de la receta
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
      warning("El nombre del producto es requerido", "Campo Requerido");
      return;
    }

    if (formulario.precioVenta <= 0) {
      warning("El precio de venta debe ser mayor a 0", "Precio Inválido");
      return;
    }

    // Validar que se haya seleccionado una receta cuando se crea
    if (!productoEnEdicion && !recetaSeleccionada) {
      warning(
        "Debe seleccionar una receta para crear el producto",
        "Receta Requerida"
      );
      return;
    }

    try {
      // Incluir el ID de la receta seleccionada en el DTO
      const productoDTO = {
        ...formulario,
        recetaMaestraId: recetaSeleccionada?.id || null,
      };

      if (productoEnEdicion) {
        await actualizarProducto(productoEnEdicion.id, productoDTO);
        success(
          "El producto ha sido actualizado correctamente",
          "Producto Actualizado"
        );
      } else {
        await crearProducto(productoDTO);
        success(
          "Producto creado exitosamente. Ahora puede registrar lotes de producción.",
          "¡Producto Creado!"
        );
      }

      resetFormulario();
      setShowForm(false);
    } catch (err) {
      console.error("Error al guardar producto:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al guardar el producto",
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
      success(
        "El producto y sus lotes han sido eliminados correctamente",
        "Producto Eliminado"
      );
      setShowDeleteModal(false);
      setProductoAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al eliminar el producto",
        "Error al Eliminar Producto"
      );
      setShowDeleteModal(false);
      setProductoAEliminar(null);
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

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Columnas para la tabla
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
        // Si no es panadería, mostrar N/A
        if (
          !producto.categoria ||
          producto.categoria.toLowerCase() !== "panaderia"
        ) {
          return <span className="text-gray-400 text-sm">N/A</span>;
        }

        // Si no tiene tipo definido o es NO_APLICA (error de datos)
        if (!producto.tipoProducto || producto.tipoProducto === "NO_APLICA") {
          return (
            <span className="text-red-500 text-xs font-medium">
              Requiere tipo
            </span>
          );
        }

        // Normalizar el tipo a mayúsculas para comparación
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

  // Definir acciones de la tabla
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
    <div className="p-4 md:p-6 mt-12 md:mt-0">
      <Link
        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center font-bold cursor-pointer"
        href={"/dashboard/inventario"}
      >
        <MaterialIcon name="arrow_back" className="mr-1" />
        <span>Volver al inicio</span>
      </Link>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="inline-flex rounded-md shadow-sm" role="tablist">
          <button
            className={`px-4 py-2 rounded-l-md border text-sm font-medium focus:outline-none transition-colors ${
              activeTab === "gestion"
                ? "bg-white border-blue-500 text-blue-600 z-10"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "gestion"}
            onClick={() => setActiveTab("gestion")}
          >
            Gestión de Productos
          </button>

          <button
            className={`px-4 py-2 rounded-r-md border text-sm font-medium focus:outline-none transition-colors ${
              activeTab === "mermas"
                ? "bg-white border-blue-500 text-blue-600 z-10"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            role="tab"
            aria-selected={activeTab === "mermas"}
            onClick={() => setActiveTab("mermas")}
          >
            Merma de Productos
          </button>
        </nav>
      </div>

      {/* Contenido según tab activa */}
      {activeTab === "gestion" && (
        <GestionProductos onOpenMerma={() => setShowMermaModal(true)} />
      )}

      {activeTab === "mermas" && <HistorialMermas />}

      {/* Modal de registro de merma */}
      <RegistrarMermaModal
        isOpen={showMermaModal}
        onClose={() => setShowMermaModal(false)}
        onSuccess={() => {
          console.log("Merma registrada exitosamente");
          // Si estamos en la tab de mermas, podríamos recargar la lista
          if (activeTab === "mermas") {
            // El componente HistorialMermas se recargará automáticamente
          }
        }}
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
