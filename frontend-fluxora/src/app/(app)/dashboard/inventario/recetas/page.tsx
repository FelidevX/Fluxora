"use client";

import { useState, useRef, useEffect } from "react";
import {
  RecetaMaestra,
  RecetaMaestraDTO,
  RecetaIngredienteDTO,
} from "@/types/produccion";
import { useMaterias } from "@/hooks/useMaterias";
import { useRecetas } from "@/hooks/useRecetas";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import { formatCLP } from "@/utils/currency";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ReparadorRecetas, {
  ReparadorRecetasRef,
} from "@/components/inventario/recetas/ReparadorRecetas";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

export default function RecetasManager() {
  const { materias, setOnMateriaCreated } = useMaterias();
  const {
    recetas,
    loading,
    error,
    crearReceta,
    eliminarReceta,
    actualizarReceta,
    clearError,
  } = useRecetas();

  const reparadorRef = useRef<ReparadorRecetasRef>(null);

  // Hook para notificaciones toast
  const { toasts, removeToast, success, error: showError } = useToast();

  // Ejecutar reparación manual
  const handleRepararManual = async () => {
    if (reparadorRef.current) {
      await reparadorRef.current.verificarYReparar();
    }
  };

  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [missingMaterials, setMissingMaterials] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recetaAEliminar, setRecetaAEliminar] = useState<RecetaMaestra | null>(
    null
  );
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<RecetaMaestra | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [recetaAEditar, setRecetaAEditar] = useState<RecetaMaestra | null>(
    null
  );
  const [formularioEdicion, setFormularioEdicion] = useState<RecetaMaestraDTO>({
    nombre: "",
    descripcion: "",
    categoria: "Panadería",
    unidadBase: "kg",
    cantidadBase: 1,
    precioUnidad: 0,
    tiempoPreparacion: 0,
    ingredientes: [],
  });
  const [ingredientesEdicion, setIngredientesEdicion] = useState<
    RecetaIngredienteDTO[]
  >([]);

  const [formulario, setFormulario] = useState<RecetaMaestraDTO>({
    nombre: "",
    descripcion: "",
    categoria: "Panadería",
    unidadBase: "kg",
    cantidadBase: 1,
    precioUnidad: 0,
    tiempoPreparacion: 0,
    ingredientes: [],
  });

  const [ingredientes, setIngredientes] = useState<RecetaIngredienteDTO[]>([]);

  // Configurar verificación automática cuando se agreguen materias primas
  useEffect(() => {
    if (setOnMateriaCreated) {
      setOnMateriaCreated(async () => {
        // Usar setTimeout para evitar setState durante render
        setTimeout(() => {
          if (reparadorRef.current) {
            reparadorRef.current.verificarYReparar();
          }
        }, 100);
      });
    }

    // Limpiar el callback al desmontar
    return () => {
      if (setOnMateriaCreated) {
        setOnMateriaCreated(null);
      }
    };
  }, []); // Sin dependencias para evitar reconfiguración

  // Funciones para manejo de ingredientes
  const agregarIngrediente = () => {
    setIngredientes([
      ...ingredientes,
      {
        materiaPrimaId: 0,
        cantidadNecesaria: 0,
        unidad: "kg",
        esOpcional: false,
        notas: "",
      },
    ]);
  };

  const eliminarIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const actualizarIngrediente = (
    index: number,
    campo: keyof RecetaIngredienteDTO,
    valor: any
  ) => {
    const nuevosIngredientes = [...ingredientes];
    if (campo === "materiaPrimaId") {
      const materia = materias.find((m) => m.id === parseInt(valor));
      nuevosIngredientes[index] = {
        ...nuevosIngredientes[index],
        materiaPrimaId: parseInt(valor),
        unidad: materia?.unidad || "kg",
      } as RecetaIngredienteDTO;
    } else {
      nuevosIngredientes[index] = {
        ...nuevosIngredientes[index],
        [campo]: valor,
      } as RecetaIngredienteDTO;
    }
    setIngredientes(nuevosIngredientes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formulario.nombre ||
      !formulario.descripcion ||
      ingredientes.length === 0
    ) {
      return;
    }

    // Validar que todos los ingredientes tengan materia prima seleccionada
    const ingredientesIncompletos = ingredientes.some(
      (ing) => ing.materiaPrimaId === 0 || ing.cantidadNecesaria <= 0
    );

    if (ingredientesIncompletos) {
      return;
    }

    try {
      const nuevaReceta: RecetaMaestraDTO = {
        ...formulario,
        ingredientes: ingredientes.map((ing) => {
          const materia = materias.find((m) => m.id === ing.materiaPrimaId);
          return {
            ...ing,
            materiaPrimaNombre: materia?.nombre || "",
          };
        }),
      };

      await crearReceta(nuevaReceta);
      success("Receta creada exitosamente", "¡Éxito!");

      // Limpiar formulario
      setFormulario({
        nombre: "",
        descripcion: "",
        categoria: "Panadería",
        unidadBase: "kg",
        cantidadBase: 1,
        precioUnidad: 0,
        tiempoPreparacion: 0,
        ingredientes: [],
      });
      setIngredientes([]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      showError("Error al crear la receta", "Error");
    }
  };

  const handleDelete = (receta: RecetaMaestra) => {
    setRecetaAEliminar(receta);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!recetaAEliminar) return;
    try {
      await eliminarReceta(recetaAEliminar.id);
      success("Receta eliminada exitosamente", "¡Éxito!");
      setShowDeleteModal(false);
      setRecetaAEliminar(null);
    } catch (err) {
      console.error(err);
      showError("Error al eliminar la receta", "Error");
    } finally {
      setShowDeleteModal(false);
      setRecetaAEliminar(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRecetaAEliminar(null);
  };

  const handleVerDetalle = (receta: RecetaMaestra) => {
    setRecetaSeleccionada(receta);
    setShowDetalleModal(true);
  };

  const handleEdit = (receta: RecetaMaestra) => {
    setRecetaAEditar(receta);
    setFormularioEdicion({
      nombre: receta.nombre,
      descripcion: receta.descripcion,
      categoria: receta.categoria,
      unidadBase: receta.unidadBase,
      cantidadBase: receta.cantidadBase,
      precioUnidad: receta.precioUnidad,
      tiempoPreparacion: receta.tiempoPreparacion,
      ingredientes: receta.ingredientes,
    });
    setIngredientesEdicion(receta.ingredientes);
    setShowEditModal(true);
  };

  const agregarIngredienteEdicion = () => {
    setIngredientesEdicion([
      ...ingredientesEdicion,
      {
        materiaPrimaId: 0,
        cantidadNecesaria: 0,
        unidad: "kg",
        esOpcional: false,
        notas: "",
      },
    ]);
  };

  const eliminarIngredienteEdicion = (index: number) => {
    setIngredientesEdicion(ingredientesEdicion.filter((_, i) => i !== index));
  };

  const actualizarIngredienteEdicion = (
    index: number,
    campo: keyof RecetaIngredienteDTO,
    valor: any
  ) => {
    const nuevosIngredientes = [...ingredientesEdicion];
    if (campo === "materiaPrimaId") {
      const materia = materias.find((m) => m.id === parseInt(valor));
      nuevosIngredientes[index] = {
        ...nuevosIngredientes[index],
        materiaPrimaId: parseInt(valor),
        unidad: materia?.unidad || "kg",
      } as RecetaIngredienteDTO;
    } else {
      nuevosIngredientes[index] = {
        ...nuevosIngredientes[index],
        [campo]: valor,
      } as RecetaIngredienteDTO;
    }
    setIngredientesEdicion(nuevosIngredientes);
  };

  const handleSubmitEdicion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formularioEdicion.nombre ||
      !formularioEdicion.descripcion ||
      ingredientesEdicion.length === 0
    ) {
      showError("Todos los campos son requeridos", "Error");
      return;
    }

    // Validar que todos los ingredientes tengan materia prima seleccionada
    const ingredientesIncompletos = ingredientesEdicion.some(
      (ing) => ing.materiaPrimaId === 0 || ing.cantidadNecesaria <= 0
    );

    if (ingredientesIncompletos) {
      showError("Todos los ingredientes deben estar completos", "Error");
      return;
    }

    if (!recetaAEditar) return;

    try {
      const recetaActualizada: RecetaMaestraDTO = {
        ...formularioEdicion,
        ingredientes: ingredientesEdicion.map((ing) => {
          const materia = materias.find((m) => m.id === ing.materiaPrimaId);
          return {
            ...ing,
            materiaPrimaNombre: materia?.nombre || "",
          };
        }),
      };

      await actualizarReceta(recetaAEditar.id, recetaActualizada);
      success("Receta actualizada exitosamente", "¡Éxito!");
      setShowEditModal(false);
      setRecetaAEditar(null);
    } catch (err) {
      console.error(err);
      showError("Error al actualizar la receta", "Error");
    }
  };

  // Verificar materias primas faltantes en recetas rotas
  const checkMissingMaterials = () => {
    const faltantes: string[] = [];
    recetas.forEach((receta) => {
      receta.ingredientes.forEach((ing) => {
        if (!materias.some((m) => m.id === ing.materiaPrimaId)) {
          if (!faltantes.includes(ing.materiaPrimaNombre)) {
            faltantes.push(ing.materiaPrimaNombre);
          }
        }
      });
    });
    setMissingMaterials(faltantes);
  };

  // Abrir modal y verificar faltantes
  const handleOpenRepairModal = () => {
    checkMissingMaterials();
    setShowRepairModal(true);
  };

  // Confirmar reparación
  const handleConfirmRepair = async () => {
    setShowRepairModal(false);
    await handleRepararManual();
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: "nombre",
      label: "Receta",
      render: (receta: RecetaMaestra) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {receta.nombre}
          </div>
          <div className="text-sm text-gray-500">{receta.descripcion}</div>
        </div>
      ),
    },
    {
      key: "categoria",
      label: "Categoría",
      render: (receta: RecetaMaestra) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {receta.categoria}
        </span>
      ),
    },
    {
      key: "cantidad",
      label: "Cantidad Base",
      render: (receta: RecetaMaestra) => (
        <span className="text-sm text-gray-900">
          {receta.cantidadBase} {receta.unidadBase}
        </span>
      ),
    },
    {
      key: "precio",
      label: "Precio Estimado",
      render: (receta: RecetaMaestra) => (
        <span className="text-sm text-gray-900">
          {formatCLP(receta.precioEstimado || 0)}
        </span>
      ),
    },
    {
      key: "precioUnidad",
      label: "Precio / unidad",
      render: (receta: RecetaMaestra) => (
        <span className="text-sm text-gray-900">
          {formatCLP(receta.precioUnidad || 0)}
        </span>
      ),
    },
    {
      key: "tiempo",
      label: "Tiempo",
      render: (receta: RecetaMaestra) => (
        <span className="text-sm text-gray-900">
          {receta.tiempoPreparacion} min
        </span>
      ),
    },
    {
      key: "ingredientes",
      label: "Ingredientes",
      render: (receta: RecetaMaestra) => (
        <span className="text-sm text-gray-900">
          {receta.ingredientes.length} ingredientes
        </span>
      ),
    },
  ];

  // Definir acciones de la tabla
  const actions = [
    {
      label: "Ver Detalle",
      icon: "visibility",
      variant: "primary" as const,
      onClick: (receta: RecetaMaestra) => handleVerDetalle(receta),
    },
    {
      label: "Editar",
      icon: "edit",
      variant: "warning" as const,
      onClick: (receta: RecetaMaestra) => handleEdit(receta),
    },
    {
      label: "Eliminar",
      icon: "delete",
      variant: "danger" as const,
      onClick: (receta: RecetaMaestra) => handleDelete(receta),
    },
  ];

  // Filtrar recetas (con protección contra null)
  const recetasFiltradas = (recetas || []).filter(
    (receta) =>
      receta && // Protección adicional por si hay elementos null
      receta.nombre && // Verificar que tiene propiedades
      (receta.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (receta.categoria &&
          receta.categoria.toLowerCase().includes(busqueda.toLowerCase())) ||
        (receta.descripcion &&
          receta.descripcion.toLowerCase().includes(busqueda.toLowerCase())))
  );

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
            Gestión de Recetas
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
            {showForm ? "Cancelar" : "Crear Receta"}
          </Button>
          <Button variant="secondary" icon="download">
            Exportar
          </Button>
          <Button
            variant="warning"
            icon="build"
            onClick={handleOpenRepairModal}
          >
            Reparar recetas manualmente
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

      {/* Reparador de recetas */}
      <ReparadorRecetas ref={reparadorRef} />

      {/* Modal de Crear Receta */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Crear Nueva Receta
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete la información de la receta y agregue los
                    ingredientes necesarios
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MaterialIcon name="close" className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Nombre de la receta:"
                  placeholder="Ej: Pan Francés"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario({ ...formulario, nombre: e.target.value })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría:
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    value={formulario.categoria}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        categoria: e.target.value,
                      })
                    }
                  >
                    <option value="Panadería">Panadería</option>
                    <option value="Pastelería">Pastelería</option>
                  </select>
                </div>

                <Input
                  label="Cantidad base:"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 1"
                  value={formulario.cantidadBase || ""}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      cantidadBase: parseFloat(e.target.value) || 1,
                    })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad base:
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    value={formulario.unidadBase}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        unidadBase: e.target.value,
                      })
                    }
                  >
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="L">Litros (L)</option>
                    <option value="unidad">Unidades</option>
                    <option value="porcion">Porciones</option>
                  </select>
                </div>

                <Input
                  label="Tiempo de preparación (min):"
                  type="number"
                  placeholder="Ej: 120"
                  value={formulario.tiempoPreparacion || ""}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      tiempoPreparacion: parseInt(e.target.value) || 0,
                    })
                  }
                />

                <Input
                  label={`Precio por ${formulario.unidadBase} (Precio venta):`}
                  type="number"
                  step="1"
                  placeholder="Ej: 5000"
                  value={formulario.precioUnidad || ""}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      precioUnidad: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              {/* precioEstimado se calcula en el backend usando PPP; no se ingresa manualmente */}

              <div>
                <Input
                  label="Descripción:"
                  placeholder="Ej: Pan tradicional francés con corteza crujiente y miga suave"
                  value={formulario.descripcion}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      descripcion: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Sección de ingredientes */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Ingredientes (para {formulario.cantidadBase}{" "}
                    {formulario.unidadBase})
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    icon="add"
                    onClick={agregarIngrediente}
                  >
                    Agregar Ingrediente
                  </Button>
                </div>

                {ingredientes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MaterialIcon
                      name="restaurant"
                      className="w-12 h-12 text-gray-400 mx-auto mb-2"
                    />
                    <p className="text-gray-600">
                      Agregue los ingredientes necesarios para esta receta
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ingredientes.map((ingrediente, index) => {
                      // Filtrar materias primas ya seleccionadas
                      const materiasDisponibles = materias.filter((materia) => {
                        const yaSeleccionada = ingredientes.some(
                          (ing, i) =>
                            i !== index && ing.materiaPrimaId === materia.id
                        );
                        return !yaSeleccionada;
                      });

                      return (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Materia Prima:
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-500"
                              value={ingrediente.materiaPrimaId}
                              onChange={(e) =>
                                actualizarIngrediente(
                                  index,
                                  "materiaPrimaId",
                                  e.target.value
                                )
                              }
                              required
                            >
                              <option value="">Seleccionar...</option>
                              {materiasDisponibles.map((materia) => (
                                <option key={materia.id} value={materia.id}>
                                  {materia.nombre} (Disponible:{" "}
                                  {materia.cantidad} {materia.unidad})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cantidad:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-500"
                              placeholder="Ej: 2.5"
                              value={ingrediente.cantidadNecesaria}
                              onChange={(e) =>
                                actualizarIngrediente(
                                  index,
                                  "cantidadNecesaria",
                                  parseFloat(e.target.value)
                                )
                              }
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ">
                              Unidad:
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 focus:outline-none"
                              value={ingrediente.unidad}
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Opcional:
                            </label>
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={ingrediente.esOpcional}
                                onChange={(e) =>
                                  actualizarIngrediente(
                                    index,
                                    "esOpcional",
                                    e.target.checked
                                  )
                                }
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-600">
                                Es opcional
                              </span>
                            </label>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => eliminarIngrediente(index)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                            >
                              <MaterialIcon name="delete" className="w-8 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear Receta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de recetas */}
      {/* Tabla usando DataTable */}
      <DataTable
        data={recetasFiltradas}
        columns={columns}
        actions={actions}
        loading={loading}
        searchValue={busqueda}
        onSearch={setBusqueda}
        searchPlaceholder="Buscar receta, categoría o descripción..."
        emptyMessage="No hay recetas creadas aún"
        pagination={{
          enabled: true,
          serverSide: false,
          defaultPageSize: 5,
          pageSizeOptions: [5, 10, 25, 50],
        }}
      />

      {/* Modal de reparación de recetas */}
      <Modal
        isOpen={showRepairModal}
        onClose={() => setShowRepairModal(false)}
        onConfirm={
          missingMaterials.length === 0 ? handleConfirmRepair : undefined
        }
        title="¿Desea reparar las recetas?"
        confirmText="Reparar"
        cancelText="Cancelar"
        confirmVariant="success"
        showActions={true}
      >
        {missingMaterials.length === 0 ? (
          <div className="text-gray-700 text-center">
            ¿Está seguro que desea reparar las recetas?
            <br />
            Se actualizarán los ingredientes rotos automáticamente.
          </div>
        ) : (
          <div className="text-red-700 text-center">
            Para reparar las recetas, primero debe crear la materia prima
            faltante:
            <ul className="mt-2 list-disc list-inside text-red-600">
              {missingMaterials.map((mat) => (
                <li key={mat}>{mat}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Receta"
        message="¿Está seguro de que desea eliminar esta receta?"
        itemName={recetaAEliminar?.nombre}
      />

      {/* Modal de Ver Detalle */}
      {showDetalleModal && recetaSeleccionada && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => setShowDetalleModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Detalle de Receta
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {recetaSeleccionada.nombre}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MaterialIcon name="close" className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Información General */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Información General
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nombre
                    </label>
                    <p className="text-base text-gray-900 font-medium">
                      {recetaSeleccionada.nombre}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Categoría
                    </label>
                    <p className="text-base text-gray-900">
                      <Badge variant="info">
                        {recetaSeleccionada.categoria}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Descripción
                    </label>
                    <p className="text-base text-gray-900">
                      {recetaSeleccionada.descripcion}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Cantidad Base
                    </label>
                    <p className="text-base text-gray-900">
                      {recetaSeleccionada.cantidadBase}{" "}
                      {recetaSeleccionada.unidadBase}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Precio Estimado
                    </label>
                    <p className="text-lg text-gray-900 font-bold">
                      {formatCLP(recetaSeleccionada.precioEstimado || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Precio por {recetaSeleccionada.unidadBase}
                    </label>
                    <p className="text-lg text-gray-900 font-bold">
                      {formatCLP(recetaSeleccionada.precioUnidad || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Tiempo de Preparación
                    </label>
                    <p className="text-base text-gray-900">
                      {recetaSeleccionada.tiempoPreparacion} minutos
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Estado
                    </label>
                    <p className="text-base text-gray-900">
                      <Badge
                        variant={
                          recetaSeleccionada.activa ? "success" : "danger"
                        }
                      >
                        {recetaSeleccionada.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Ingredientes ({recetaSeleccionada.ingredientes.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Materia Prima
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Cantidad Necesaria
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Unidad
                        </th>
                        <th className="px-4 py-3 text-gray-700 font-medium">
                          Opcional
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recetaSeleccionada.ingredientes.map((ing, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {ing.materiaPrimaNombre}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {ing.cantidadNecesaria}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {ing.unidad}
                          </td>
                          <td className="px-4 py-3">
                            {ing.esOpcional ? (
                              <Badge variant="warning">Sí</Badge>
                            ) : (
                              <Badge variant="info">No</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetalleModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar */}
      {showEditModal && recetaAEditar && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => {
            setShowEditModal(false);
            setRecetaAEditar(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Editar Receta
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {recetaAEditar.nombre}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setRecetaAEditar(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MaterialIcon name="close" className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitEdicion} className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Nombre de la receta:"
                  placeholder="Ej: Pan Francés"
                  value={formularioEdicion.nombre}
                  onChange={(e) =>
                    setFormularioEdicion({
                      ...formularioEdicion,
                      nombre: e.target.value,
                    })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría:
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    value={formularioEdicion.categoria}
                    onChange={(e) =>
                      setFormularioEdicion({
                        ...formularioEdicion,
                        categoria: e.target.value,
                      })
                    }
                  >
                    <option value="Panadería">Panadería</option>
                    <option value="Pastelería">Pastelería</option>
                  </select>
                </div>

                <Input
                  label="Cantidad base:"
                  type="number"
                  step="0.1"
                  placeholder="Ej: 1"
                  value={formularioEdicion.cantidadBase || ""}
                  onChange={(e) =>
                    setFormularioEdicion({
                      ...formularioEdicion,
                      cantidadBase: parseFloat(e.target.value) || 1,
                    })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad base:
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    value={formularioEdicion.unidadBase}
                    onChange={(e) =>
                      setFormularioEdicion({
                        ...formularioEdicion,
                        unidadBase: e.target.value,
                      })
                    }
                  >
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="L">Litros (L)</option>
                    <option value="unidad">Unidades</option>
                    <option value="porcion">Porciones</option>
                  </select>
                </div>

                <Input
                  label="Tiempo de preparación (min):"
                  type="number"
                  placeholder="Ej: 120"
                  value={formularioEdicion.tiempoPreparacion || ""}
                  onChange={(e) =>
                    setFormularioEdicion({
                      ...formularioEdicion,
                      tiempoPreparacion: parseInt(e.target.value) || 0,
                    })
                  }
                />

                <Input
                  label={`Precio por ${formularioEdicion.unidadBase} (Precio venta):`}
                  type="number"
                  step="1"
                  placeholder="Ej: 5000"
                  value={formularioEdicion.precioUnidad || ""}
                  onChange={(e) =>
                    setFormularioEdicion({
                      ...formularioEdicion,
                      precioUnidad: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div>
                <Input
                  label="Descripción:"
                  placeholder="Ej: Pan tradicional francés con corteza crujiente y miga suave"
                  value={formularioEdicion.descripcion}
                  onChange={(e) =>
                    setFormularioEdicion({
                      ...formularioEdicion,
                      descripcion: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Sección de ingredientes */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Ingredientes (para {formularioEdicion.cantidadBase}{" "}
                    {formularioEdicion.unidadBase})
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    icon="add"
                    onClick={agregarIngredienteEdicion}
                  >
                    Agregar Ingrediente
                  </Button>
                </div>

                {ingredientesEdicion.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MaterialIcon
                      name="restaurant"
                      className="w-12 h-12 text-gray-400 mx-auto mb-2"
                    />
                    <p className="text-gray-600">
                      Agregue los ingredientes necesarios para esta receta
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ingredientesEdicion.map((ingrediente, index) => {
                      const materiasDisponibles = materias.filter((materia) => {
                        const yaSeleccionada = ingredientesEdicion.some(
                          (ing, i) =>
                            i !== index && ing.materiaPrimaId === materia.id
                        );
                        return !yaSeleccionada;
                      });

                      return (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Materia Prima:
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-500"
                              value={ingrediente.materiaPrimaId}
                              onChange={(e) =>
                                actualizarIngredienteEdicion(
                                  index,
                                  "materiaPrimaId",
                                  e.target.value
                                )
                              }
                              required
                            >
                              <option value="">Seleccionar...</option>
                              {materiasDisponibles.map((materia) => (
                                <option key={materia.id} value={materia.id}>
                                  {materia.nombre} (Disponible:{" "}
                                  {materia.cantidad} {materia.unidad})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cantidad:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-500"
                              placeholder="Ej: 2.5"
                              value={ingrediente.cantidadNecesaria}
                              onChange={(e) =>
                                actualizarIngredienteEdicion(
                                  index,
                                  "cantidadNecesaria",
                                  parseFloat(e.target.value)
                                )
                              }
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ">
                              Unidad:
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 focus:outline-none"
                              value={ingrediente.unidad}
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Opcional:
                            </label>
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={ingrediente.esOpcional}
                                onChange={(e) =>
                                  actualizarIngredienteEdicion(
                                    index,
                                    "esOpcional",
                                    e.target.checked
                                  )
                                }
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-600">
                                Es opcional
                              </span>
                            </label>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => eliminarIngredienteEdicion(index)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                            >
                              <MaterialIcon name="delete" className="w-8 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setRecetaAEditar(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleSubmitEdicion}
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Actualizar Receta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
