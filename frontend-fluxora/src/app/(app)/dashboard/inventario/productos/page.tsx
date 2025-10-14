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
          receta.precioUnidad !== undefined && receta.precioUnidad > 0
            ? receta.precioUnidad * multiplicadorReceta
            : (receta.precioEstimado || 0) * multiplicadorReceta,
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
          recetaSeleccionada.precioUnidad !== undefined &&
          recetaSeleccionada.precioUnidad > 0
            ? recetaSeleccionada.precioUnidad * nuevoMultiplicador
            : (recetaSeleccionada.precioEstimado || 0) * nuevoMultiplicador,
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

  // Función para calcular el costo total de producción basado en PPP
  const calcularCostoProduccion = (): number => {
    if (!recetaSeleccionada) return 0;

    return recetaSeleccionada.ingredientes.reduce((total, ingrediente) => {
      const ppp = ingrediente.ppp || 0;
      const cantidadTotal = ingrediente.cantidadNecesaria * multiplicadorReceta;
      return total + cantidadTotal * ppp;
    }, 0);
  };

  // Función para calcular la ganancia
  const calcularGanancia = (): number => {
    const precioTotal = formulario.precio;
    const costoTotal = calcularCostoProduccion();
    return precioTotal - costoTotal;
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

  // Función auxiliar para crear el producto
  const crearProductoFinal = async () => {
    try {
      const costoProduccion = calcularCostoProduccion();
      const ganancia = calcularGanancia();

      const productoConReceta = {
        ...formulario,
        receta: receta,
        costoProduccion: costoProduccion,
        ganancia: ganancia,
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
      // Crear el producto directamente (cada producto es único por su costo de producción)
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
      key: "costoProduccion",
      label: "Costo",
      render: (producto: Producto) => (
        <div className="text-sm">
          <div className="text-orange-600 font-medium">
            {formatCLP(producto.costoProduccion || 0)}
          </div>
        </div>
      ),
    },
    {
      key: "ganancia",
      label: "Ganancia",
      render: (producto: Producto) => {
        const ganancia = producto.ganancia || 0;
        const precio = producto.precio || 0;
        const porcentaje = precio > 0 ? (ganancia / precio) * 100 : 0;

        return (
          <div className="text-sm">
            <div
              className={`font-medium ${
                ganancia >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCLP(ganancia)}
            </div>
            <div className="text-xs text-gray-500">
              {porcentaje.toFixed(1)}%
            </div>
          </div>
        );
      },
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
      if (
        typeof materia.cantidad === "number" &&
        materia.cantidad < cantidadNecesaria
      ) {
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
                    <div className="text-sm text-gray-700 w-full">
                      <div className="font-medium mb-2">Resultado:</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Cantidad:</span>
                          <span className="font-medium">
                            {recetaSeleccionada.cantidadBase *
                              multiplicadorReceta}{" "}
                            {recetaSeleccionada.unidadBase}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span>Precio Total:</span>
                          <span className="font-medium text-blue-600">
                            {formatCLP(
                              recetaSeleccionada.precioUnidad !== undefined &&
                                recetaSeleccionada.precioUnidad > 0
                                ? recetaSeleccionada.precioUnidad *
                                    multiplicadorReceta
                                : (recetaSeleccionada.precioEstimado || 0) *
                                    multiplicadorReceta
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Costo Producción:</span>
                          <span className="font-medium text-orange-600">
                            {formatCLP(calcularCostoProduccion())}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span>Ganancia:</span>
                          <span
                            className={`font-bold ${
                              calcularGanancia() >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCLP(calcularGanancia())}
                          </span>
                        </div>
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
                    {receta.map((item, index) => {
                      // Buscar el ingrediente original en la receta seleccionada para obtener PPP
                      const ingredienteOriginal =
                        recetaSeleccionada?.ingredientes.find(
                          (ing) => ing.materiaPrimaId === item.materiaPrimaId
                        );
                      const ppp = ingredienteOriginal?.ppp || 0;
                      const costoIngrediente = item.cantidadNecesaria * ppp;

                      return (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-blue-50 rounded-lg"
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
                              Cantidad Total:
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

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              PPP:
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400">
                              {formatCLP(ppp)}/{item.unidad}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Costo:
                            </label>
                            <div className="w-full px-3 py-2 bg-orange-100 rounded-lg border border-orange-200 text-orange-700 font-medium">
                              {formatCLP(costoIngrediente)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

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

                    {/* Resumen de costos */}
                    {receta.length > 0 && recetaSeleccionada && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                          <MaterialIcon
                            name="payments"
                            className="w-5 h-5 mr-2 text-green-600"
                          />
                          Resumen Financiero
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">
                              Precio Total
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatCLP(formulario.precio)}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">
                              Costo de Producción
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                              {formatCLP(calcularCostoProduccion())}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ({recetaSeleccionada.ingredientes.length}{" "}
                              ingredientes)
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">
                              Ganancia
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                calcularGanancia() >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCLP(calcularGanancia())}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {calcularGanancia() >= 0
                                ? `+${(
                                    (calcularGanancia() / formulario.precio) *
                                    100
                                  ).toFixed(1)}%`
                                : `${(
                                    (calcularGanancia() / formulario.precio) *
                                    100
                                  ).toFixed(1)}%`}
                            </div>
                          </div>
                        </div>
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
