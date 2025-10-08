"use client";

import { useState, useEffect } from "react";
import {
  Producto,
  ProductoDTO,
  RecetaItem,
  MateriaPrima,
} from "@/types/inventario";
import { RecetaMaestra } from "@/types/produccion";
import { useProductos } from "@/hooks/useProductos";
import { useMaterias } from "@/hooks/useMaterias";
import { useRecetas } from "@/hooks/useRecetas";
import { formatCLP } from "@/utils/currency";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Link from "next/link";

export default function ProductosPage() {
  const {
    productos,
    loading,
    error,
    crearProducto,
    actualizarStockProducto,
    eliminarProducto,
    clearError,
  } = useProductos();

  const { materias } = useMaterias();
  const { recetas } = useRecetas();

  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [receta, setReceta] = useState<RecetaItem[]>([]);

  // Variables para manejo de recetas
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<RecetaMaestra | null>(null);
  const [multiplicadorReceta, setMultiplicadorReceta] = useState(1);
  // Usamos las recetas del hook en lugar de estado local

  const [formulario, setFormulario] = useState<ProductoDTO>({
    nombre: "",
    cantidad: 0,
    precio: 0,
    estado: "Disponible",
    categoria: "Panadería",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  // Estado para modal de confirmación de productos duplicados
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productoConflicto, setProductoConflicto] = useState<Producto | null>(
    null
  );

  // Estado para modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    details: "",
  });

  const handleRecetaSeleccionada = (recetaId: number) => {
    const receta = recetas.find((r) => r.id === recetaId); // Usar recetas del hook

    if (receta) {
      setRecetaSeleccionada(receta);

      const nuevoFormulario = {
        ...formulario,
        nombre: receta.nombre,
        descripcion: receta.descripcion,
        categoria: receta.categoria,
        precio:
          (receta.precioUnidad || receta.precioEstimado) * multiplicadorReceta,
        cantidad: receta.cantidadBase * multiplicadorReceta,
      };

      setFormulario(nuevoFormulario);

      actualizarRecetaConMultiplicador(receta, multiplicadorReceta);
    } else {
      console.error("No se encontró la receta con ID:", recetaId);
    }
  };

  const handleMultiplicadorChange = (nuevoMultiplicador: number) => {
    setMultiplicadorReceta(nuevoMultiplicador);
    if (recetaSeleccionada) {
      setFormulario({
        ...formulario,
        precio:
          (recetaSeleccionada.precioUnidad ||
            recetaSeleccionada.precioEstimado) * nuevoMultiplicador,
        cantidad: recetaSeleccionada.cantidadBase * nuevoMultiplicador,
      });
      actualizarRecetaConMultiplicador(recetaSeleccionada, nuevoMultiplicador);
    }
  };

  const actualizarRecetaConMultiplicador = (
    recetaMaestra: RecetaMaestra,
    multiplicador: number
  ) => {
    const nuevaReceta: RecetaItem[] = recetaMaestra.ingredientes.map(
      (ingrediente) => ({
        materiaPrimaId: ingrediente.materiaPrimaId,
        materiaPrimaNombre: ingrediente.materiaPrimaNombre,
        cantidadNecesaria: ingrediente.cantidadNecesaria * multiplicador,
        unidad: ingrediente.unidad,
      })
    );
    setReceta(nuevaReceta);
  };

  const resetFormulario = () => {
    setFormulario({
      nombre: "",
      cantidad: 0,
      precio: 0,
      estado: "Disponible",
      categoria: "Panadería",
      descripcion: "",
      fecha: new Date().toISOString().split("T")[0],
    });
    setReceta([]);
    setRecetaSeleccionada(null);
    setMultiplicadorReceta(1);
  };

  // Función para comparar dos recetas y ver si son iguales
  const recetasSonIguales = (receta1: RecetaItem[], receta2: RecetaItem[]) => {
    if (receta1.length !== receta2.length) return false;

    // Ordenar ambas recetas por materiaPrimaId para comparar
    const ordenada1 = [...receta1].sort(
      (a, b) => a.materiaPrimaId - b.materiaPrimaId
    );
    const ordenada2 = [...receta2].sort(
      (a, b) => a.materiaPrimaId - b.materiaPrimaId
    );

    return ordenada1.every((item1, index) => {
      const item2 = ordenada2[index];
      return (
        item1.materiaPrimaId === item2.materiaPrimaId &&
        item1.cantidadNecesaria === item2.cantidadNecesaria &&
        item1.unidad === item2.unidad
      );
    });
  };

  // Función para buscar un producto existente with la misma receta
  const buscarProductoConRecetaIgual = (recetaNueva: RecetaItem[]) => {
    if (recetaNueva.length === 0) return null;

    return productos.find((producto) => {
      if (!producto.receta || producto.receta.length === 0) return false;
      return recetasSonIguales(recetaNueva, producto.receta);
    });
  };

  // Funciones para manejar la modal de confirmación
  const handleConfirmConsolidation = async () => {
    if (!productoConflicto) return;

    try {
      // Actualizar stock del producto existente
      await actualizarStockProducto(productoConflicto.id, formulario.cantidad);

      // Mostrar modal de éxito en lugar del alert
      setSuccessMessage({
        title: "Stock actualizado exitosamente",
        details: `Producto: ${productoConflicto.nombre}\nStock anterior: ${
          productoConflicto.cantidad
        } unidades\nCantidad agregada: +${
          formulario.cantidad
        } unidades\nStock nuevo: ${
          productoConflicto.cantidad + formulario.cantidad
        } unidades`,
      });

      // Limpiar y cerrar modal de confirmación
      resetFormulario();
      setShowForm(false);
      setShowConfirmModal(false);
      setProductoConflicto(null);

      // Mostrar modal de éxito
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      alert("Error al actualizar el stock del producto");
    }
  };

  const handleCancelConsolidation = async () => {
    // El usuario eligió crear un producto duplicado
    setShowConfirmModal(false);
    setProductoConflicto(null);

    await crearProductoFinal();
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setProductoConflicto(null);
  };

  // Función auxiliar para crear el producto
  const crearProductoFinal = async () => {
    try {
      const productoConReceta = {
        ...formulario,
        receta: receta,
      };

      await crearProducto(productoConReceta);
      alert("Producto registrado exitosamente");

      // Limpiar formulario y receta
      resetFormulario();
      setShowForm(false);
    } catch (err) {
      console.error("Error en crearProductoFinal:", err);
      alert(
        `Error al crear el producto: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones con mensajes detallados
    if (!formulario.nombre) {
      alert("El nombre del producto es requerido");
      return;
    }
    if (!formulario.descripcion) {
      alert("La descripción del producto es requerida");
      return;
    }
    if (formulario.cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }
    if (formulario.precio <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    // Verificar disponibilidad de materias primas
    const faltantes = verificarDisponibilidad();
    if (faltantes.length > 0) {
      alert(`No hay suficientes materias primas:\n${faltantes.join("\n")}`);
      return;
    }

    try {
      // Verificar si ya existe un producto con la misma receta
      const productoExistente = buscarProductoConRecetaIgual(receta);

      if (productoExistente && receta.length > 0) {
        // Mostrar modal de confirmación en lugar del alert
        setProductoConflicto(productoExistente);
        setShowConfirmModal(true);
        return;
      }

      // Crear el producto sin conflicto
      await crearProductoFinal();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      alert(
        `Error al crear el producto: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) {
      return;
    }

    try {
      await eliminarProducto(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(
    (producto: Producto) =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const obtenerEstadoBadge = (estado: string, cantidad: number) => {
    if (cantidad < 5) return "danger";
    if (estado.toLowerCase() === "disponible") return "success";
    return "warning";
  };

  const obtenerTextoEstado = (estado: string, cantidad: number) => {
    if (cantidad < 5) return "Agotándose";
    return estado;
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: "nombre",
      label: "Producto",
      render: (producto: Producto) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {producto.nombre || "Sin nombre"}
          </div>
          <div className="text-sm text-gray-500">
            {producto.descripcion || "Sin descripción"}
          </div>
        </div>
      ),
    },
    {
      key: "categoria",
      label: "Categoría",
      render: (producto: Producto) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {producto.categoria || "Sin categoría"}
        </span>
      ),
    },
    {
      key: "cantidad",
      label: "Stock",
      render: (producto: Producto) => (
        <span className="text-sm text-gray-900">
          {producto.cantidad || 0} unidades
        </span>
      ),
    },
    {
      key: "precio",
      label: "Precio",
      render: (producto: Producto) => (
        <span className="text-sm text-gray-900">
          {formatCLP(producto.precio || 0)}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      render: (producto: Producto) => (
        <span className="text-sm text-gray-900">
          {producto.fecha
            ? new Date(producto.fecha).toLocaleDateString("es-ES")
            : "N/A"}
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (producto: Producto) => (
        <Badge
          variant={obtenerEstadoBadge(
            producto.estado || "Disponible",
            producto.cantidad || 0
          )}
        >
          {obtenerTextoEstado(
            producto.estado || "Disponible",
            producto.cantidad || 0
          )}
        </Badge>
      ),
    },
  ];

  // Definir acciones de la tabla
  const actions = [
    {
      label: "Editar",
      icon: "edit",
      variant: "primary" as const,
      onClick: (producto: Producto) => {
        // TODO: Implementar edición
        console.log("Editar producto:", producto);
      },
    },
    {
      label: "Eliminar",
      icon: "delete",
      variant: "danger" as const,
      onClick: (producto: Producto) => handleDelete(producto.id),
    },
  ];

  // Funciones para manejo de recetas
  const agregarIngrediente = () => {
    setReceta([
      ...receta,
      {
        materiaPrimaId: 0,
        materiaPrimaNombre: "",
        cantidadNecesaria: 0,
        unidad: "kg",
      },
    ]);
  };

  const eliminarIngrediente = (index: number) => {
    setReceta(receta.filter((_, i) => i !== index));
  };

  const actualizarIngrediente = (
    index: number,
    campo: keyof RecetaItem,
    valor: any
  ) => {
    const nuevaReceta = [...receta];
    if (campo === "materiaPrimaId") {
      const materia = materias.find((m) => m.id === parseInt(valor));
      nuevaReceta[index] = {
        ...nuevaReceta[index],
        materiaPrimaId: parseInt(valor),
        materiaPrimaNombre: materia?.nombre || "",
        unidad: materia?.unidad || "kg",
      };
    } else {
      nuevaReceta[index] = { ...nuevaReceta[index], [campo]: valor };
    }
    setReceta(nuevaReceta);
  };

  // Verificar disponibilidad de materias primas
  const verificarDisponibilidad = () => {
    const faltantes: string[] = [];
    receta.forEach((item) => {
      const materia = materias.find((m) => m.id === item.materiaPrimaId);
      if (!materia) return;

      // item.cantidadNecesaria ya está calculada con el multiplicador correcto
      const cantidadNecesaria = item.cantidadNecesaria;
      if (materia.cantidad < cantidadNecesaria) {
        faltantes.push(
          `${materia.nombre}: necesita ${cantidadNecesaria}${item.unidad}, disponible ${materia.cantidad}${item.unidad}`
        );
      }
    });
    return faltantes;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-4">
        <Link
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center font-bold cursor-pointer"
          href={"/dashboard/inventario"}
        >
          <MaterialIcon name="arrow_back" className="mr-1" />
          <span>Volver al inicio</span>
        </Link>
      </div>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Productos
          </h1>
          <div className="flex items-center text-gray-600 mt-1">
            <MaterialIcon name="calendar_today" className="mr-1" />
            <span>
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="success"
            icon="add"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancelar" : "Registrar Producto"}
          </Button>
          <Button variant="secondary" icon="download">
            Exportar
          </Button>
        </div>
      </div>

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <MaterialIcon name="error" className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <MaterialIcon name="close" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Formulario de registro */}
      {showForm && (
        <div className="bg-white rounded-lg border border-green-200 p-6">
          <div className="flex items-center mb-4">
            <MaterialIcon
              name="add_box"
              className="w-6 h-6 text-green-600 mr-2"
            />
            <h2 className="text-xl font-semibold text-gray-900">
              Registrar Producto
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Sección de selección de receta */}
            <div className="md:col-span-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Receta:
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
                    value={recetaSeleccionada?.id || ""}
                    onChange={(e) =>
                      handleRecetaSeleccionada(parseInt(e.target.value))
                    }
                    required
                  >
                    <option value="">Seleccionar receta...</option>
                    {recetas.map((receta: RecetaMaestra) => (
                      <option key={receta.id} value={receta.id}>
                        {receta.nombre} (Base: {receta.cantidadBase}{" "}
                        {receta.unidadBase})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Cuántas veces preparar?
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
                    placeholder="Ej: 2 (para doble cantidad)"
                    value={multiplicadorReceta}
                    onChange={(e) =>
                      handleMultiplicadorChange(parseFloat(e.target.value) || 1)
                    }
                    disabled={!recetaSeleccionada}
                  />
                </div>

                <div className="flex items-end">
                  {recetaSeleccionada && (
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">Resultado:</div>
                      <div>
                        {recetaSeleccionada.cantidadBase * multiplicadorReceta}{" "}
                        {recetaSeleccionada.unidadBase}
                      </div>
                      <div className="text-green-600">
                        {formatCLP(
                          (recetaSeleccionada.precioUnidad ||
                            recetaSeleccionada.precioEstimado) *
                            multiplicadorReceta
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {recetaSeleccionada && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Receta seleccionada: {recetaSeleccionada.nombre}
                  </h4>
                  <p className="text-sm text-green-700 mb-2">
                    {recetaSeleccionada.descripcion}
                  </p>
                  <div className="text-sm text-green-600">
                    Tiempo estimado:{" "}
                    {recetaSeleccionada.tiempoPreparacion * multiplicadorReceta}{" "}
                    minutos
                  </div>
                </div>
              )}
            </div>
            <Input
              label="Nombre del producto:"
              placeholder="Ej: Pan integral"
              value={formulario.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre: e.target.value })
              }
              disabled={true}
              required
            />

            <Input
              label="Cantidad en stock:"
              type="number"
              placeholder="Ej: 50"
              value={formulario.cantidad || ""}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  cantidad: parseFloat(e.target.value) || 0,
                })
              }
              disabled={true}
              required
            />

            <Input
              label="Precio unitario (CLP):"
              type="number"
              step="1"
              placeholder="Ej: 2500"
              value={formulario.precio || ""}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  precio: parseFloat(e.target.value) || 0,
                })
              }
              disabled={true}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría:
              </label>
              <select
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100 cursor-not-allowed text-gray-500`}
                value={formulario.categoria}
                onChange={(e) =>
                  setFormulario({ ...formulario, categoria: e.target.value })
                }
                disabled={true}
              >
                <option value="Panadería">Panadería</option>
                <option value="Pastelería">Pastelería</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Snacks">Snacks</option>
                <option value="Especiales">Especiales</option>
              </select>
            </div>

            <Input
              label="Fecha de producción:"
              type="date"
              value={formulario.fecha}
              onChange={(e) =>
                setFormulario({ ...formulario, fecha: e.target.value })
              }
            />

            <div className="md:col-span-3">
              <Input
                label="Descripción:"
                placeholder="Ej: Pan integral con semillas, rico en fibra"
                value={formulario.descripcion}
                onChange={(e) =>
                  setFormulario({ ...formulario, descripcion: e.target.value })
                }
                disabled={true}
                required
              />
            </div>

            {/* Sección de Receta */}
            <div className="md:col-span-4">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Ingredientes de la Receta (Calculado Automáticamente)
                  </h3>
                </div>

                {receta.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MaterialIcon
                      name="restaurant"
                      className="w-12 h-12 text-gray-400 mx-auto mb-2"
                    />
                    <p className="text-gray-600">
                      Seleccione una receta para ver los ingredientes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receta.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-blue-50 rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Materia Prima:
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400">
                            {item.materiaPrimaNombre}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad Total Necesaria:
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400">
                            {item.cantidadNecesaria} {item.unidad}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Por Unidad Base:
                          </label>
                          <div className="w-full px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400">
                            {recetaSeleccionada
                              ? (
                                  item.cantidadNecesaria / multiplicadorReceta
                                ).toFixed(2)
                              : item.cantidadNecesaria}{" "}
                            {item.unidad}
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <MaterialIcon
                            name="lock"
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Verificación de disponibilidad */}
                    {receta.length > 0 && formulario.cantidad > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                          Para {multiplicadorReceta}x la receta (
                          {formulario.cantidad}{" "}
                          {recetaSeleccionada?.unidadBase || "unidades"}) se
                          necesita:
                        </h4>
                        {receta.map((item, index) => {
                          const materia = materias.find(
                            (m) => m.id === item.materiaPrimaId
                          );
                          const cantidadTotal = item.cantidadNecesaria;
                          const disponible = materia?.cantidad || 0;
                          const suficiente = disponible >= cantidadTotal;

                          return (
                            <div
                              key={index}
                              className={`text-sm ${
                                suficiente ? "text-green-700" : "text-red-700"
                              }`}
                            >
                              • {item.materiaPrimaNombre}: {cantidadTotal}{" "}
                              {item.unidad}
                              (Disponible: {disponible} {item.unidad})
                              {!suficiente && (
                                <span className="font-medium">
                                  {" "}
                                  - ¡INSUFICIENTE!
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <Button
                type="submit"
                variant="success"
                disabled={loading || verificarDisponibilidad().length > 0}
              >
                {loading ? "Registrando..." : "Registrar Producto"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla usando DataTable */}
      <DataTable
        data={productosFiltrados}
        columns={columns}
        actions={actions}
        loading={loading}
        searchValue={busqueda}
        onSearch={setBusqueda}
        searchPlaceholder="Buscar productos..."
        emptyMessage="No hay productos registrados"
        pagination={{
          enabled: true,
          serverSide: false,
          defaultPageSize: 5,
          pageSizeOptions: [5, 10, 25, 50],
        }}
      />

      {/* Modal de confirmación para productos duplicados */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmConsolidation}
        title="Producto Duplicado Detectado"
        confirmText="Consolidar Stock"
        cancelText="Crear Duplicado"
        confirmVariant="primary"
        size="lg"
      >
        {productoConflicto && (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <MaterialIcon
                name="warning"
                className="w-6 h-6 text-amber-600 mr-3"
              />
              <div>
                <p className="font-medium text-amber-800">
                  Ya existe un producto con la misma receta
                </p>
                <p className="text-sm text-amber-700">
                  ¿Deseas consolidar el stock o crear un producto separado?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Producto existente */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <MaterialIcon name="inventory" className="w-5 h-5 mr-2" />
                  Producto Existente
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <span className="font-medium">Nombre:</span>{" "}
                    {productoConflicto.nombre}
                  </p>
                  <p>
                    <span className="font-medium">Stock actual:</span>{" "}
                    {productoConflicto.cantidad} unidades
                  </p>
                  <p>
                    <span className="font-medium">Precio:</span>{" "}
                    {formatCLP(productoConflicto.precio)}
                  </p>
                  <p>
                    <span className="font-medium">Categoría:</span>{" "}
                    {productoConflicto.categoria}
                  </p>
                </div>
              </div>

              {/* Producto nuevo */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  <MaterialIcon name="add_box" className="w-5 h-5 mr-2" />
                  Producto Nuevo
                </h4>
                <div className="space-y-2 text-sm text-green-800">
                  <p>
                    <span className="font-medium">Nombre:</span>{" "}
                    {formulario.nombre}
                  </p>
                  <p>
                    <span className="font-medium">Cantidad a agregar:</span>{" "}
                    {formulario.cantidad} unidades
                  </p>
                  <p>
                    <span className="font-medium">Precio:</span>{" "}
                    {formatCLP(formulario.precio)}
                  </p>
                  <p>
                    <span className="font-medium">Categoría:</span>{" "}
                    {formulario.categoria}
                  </p>
                </div>
              </div>
            </div>

            {/* Receta */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <MaterialIcon name="restaurant_menu" className="w-5 h-5 mr-2" />
                Receta Común
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-purple-800">
                {receta.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start text-sm bg-white p-2 rounded border"
                  >
                    <MaterialIcon
                      name="circle"
                      className="w-2 h-2 text-purple-500 mr-5"
                    />
                    <span className="font-medium mr-1">
                      {item.materiaPrimaNombre}:
                    </span>
                    <span>
                      {item.cantidadNecesaria} {item.unidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resultado de consolidación */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <MaterialIcon name="calculate" className="w-5 h-5 mr-2" />
                Si consolidas el stock:
              </h4>
              <div className="text-sm space-y-1 text-gray-700">
                <p>
                  • Stock final:{" "}
                  <span className="font-semibold">
                    {productoConflicto.cantidad + formulario.cantidad} unidades
                  </span>
                </p>
                <p>• Se mantendrá el producto "{productoConflicto.nombre}"</p>
                <p>• No se creará un producto duplicado</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de éxito */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Operación Exitosa"
        showActions={false}
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <MaterialIcon
              name="check_circle"
              className="w-10 h-10 text-green-600"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {successMessage.title}
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {successMessage.details}
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="success"
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
