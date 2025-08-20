"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MateriaPrimaDTO, MateriaPrima } from "@/types/inventario";
import { useMaterias } from "@/hooks/useMaterias";
import { useCurrentDate, useFormattedDate } from "@/hooks/useDate";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import FormattedDate from "@/components/ui/FormattedDate";

export default function MateriasManager() {
  const searchParams = useSearchParams();
  const {
    materias,
    loading,
    error,
    cargarMaterias,
    crearMateria,
    actualizarMateria,
    actualizarStock,
    eliminarMateria,
    clearError,
  } = useMaterias();

  const { currentDate } = useCurrentDate();
  const currentDateFormatted = useFormattedDate();

  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [materiaAActualizar, setMateriaAActualizar] =
    useState<MateriaPrima | null>(null);
  const [cantidadAAgregar, setCantidadAAgregar] = useState(0);
  const [formulario, setFormulario] = useState<MateriaPrimaDTO>({
    nombre: "",
    cantidad: 0,
    proveedor: "",
    estado: "Disponible",
    unidad: "kg",
    fecha: currentDate || new Date().toISOString().split("T")[0],
  });

  // Cargar materias al montar el componente
  useEffect(() => {
    cargarMaterias();
  }, []); // Sin dependencias para evitar loops infinitos

  // Detectar si se debe abrir el formulario automáticamente
  useEffect(() => {
    const action = searchParams.get('action');
    const suggestion = searchParams.get('suggestion');
    
    if (action === 'create') {
      setShowForm(true);
      
      // Si hay una sugerencia de nombre, pre-llenar el formulario
      if (suggestion) {
        setFormulario(prev => ({
          ...prev,
          nombre: suggestion
        }));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formulario.nombre ||
      !formulario.proveedor ||
      formulario.cantidad <= 0
    ) {
      return;
    }

    try {
      await crearMateria(formulario);
      setFormulario({
        nombre: "",
        cantidad: 0,
        proveedor: "",
        estado: "Disponible",
        unidad: "kg",
        fecha: currentDate || new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta materia prima?")) {
      return;
    }

    try {
      await eliminarMateria(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAgregarStock = (materia: MateriaPrima) => {
    setMateriaAActualizar(materia);
    setCantidadAAgregar(0);
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidadAAgregar <= 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmStock = async () => {
    if (!materiaAActualizar) return;

    try {
      // Actualizar solo la cantidad usando el endpoint dedicado
      const nuevaCantidad = materiaAActualizar.cantidad + cantidadAAgregar;

      await actualizarStock(materiaAActualizar.id, nuevaCantidad);

      setShowConfirmModal(false);
      setShowStockModal(false);
      setMateriaAActualizar(null);
      setCantidadAAgregar(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelStock = () => {
    setShowStockModal(false);
    setShowConfirmModal(false);
    setMateriaAActualizar(null);
    setCantidadAAgregar(0);
  };

  // Filtrar materias primas por búsqueda
  const materiasFiltradas = materias.filter(
    (materia) =>
      (materia.nombre?.toLowerCase() || "").includes(busqueda.toLowerCase()) ||
      (materia.proveedor?.toLowerCase() || "").includes(busqueda.toLowerCase())
  );

  const obtenerEstadoBadge = (estado: string, cantidad: number) => {
    if (cantidad < 5) return "danger";
    if ((estado?.toLowerCase() || "") === "disponible") return "success";
    return "warning";
  };

  const obtenerTextoEstado = (estado: string, cantidad: number) => {
    if (cantidad === 0) return "Agotado";
    if (cantidad < 5) return "Stock Bajo";
    return estado || "Disponible";
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: "nombre",
      label: "Producto",
      render: (materia: MateriaPrima) => (
        <span className="text-sm font-medium text-gray-900">
          {materia.nombre || "Sin nombre"}
        </span>
      ),
    },
    {
      key: "cantidad",
      label: "Cantidad",
      render: (materia: MateriaPrima) => (
        <span className="text-sm text-gray-900">
          {materia.cantidad || 0} {materia.unidad || ""}
        </span>
      ),
    },
    {
      key: "proveedor",
      label: "Proveedor",
      render: (materia: MateriaPrima) => (
        <span className="text-sm text-gray-900">
          {materia.proveedor || "Sin proveedor"}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      render: (materia: MateriaPrima) => (
        <FormattedDate date={materia.fecha} className="text-sm text-gray-900" />
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (materia: MateriaPrima) => (
        <Badge
          variant={obtenerEstadoBadge(
            materia.estado || "Disponible",
            materia.cantidad || 0
          )}
        >
          {obtenerTextoEstado(
            materia.estado || "Disponible",
            materia.cantidad || 0
          )}
        </Badge>
      ),
    },
  ];

  // Definir acciones de la tabla
  const actions = [
    {
      label: "Agregar Stock",
      icon: "add",
      variant: "success" as const,
      onClick: (materia: MateriaPrima) => handleAgregarStock(materia),
    },
    {
      label: "Eliminar",
      icon: "delete",
      variant: "danger" as const,
      onClick: (materia: MateriaPrima) => handleDelete(materia.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Materias Primas
          </h1>
          <div className="flex items-center text-gray-600 mt-1">
            <MaterialIcon name="calendar_today" className="w-4 h-4 mr-1" />
            <span>{currentDateFormatted}</span>
          </div>
        </div>
        <Button
          variant="primary"
          icon="add"
          onClick={() => setShowForm(!showForm)}
        >
          Nueva Materia Prima
        </Button>
      </div>

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

      {/* Formulario */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Nueva Materia Prima</h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              label="Nombre del producto:"
              type="text"
              value={formulario.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre: e.target.value })
              }
              required
            />

            <Input
              label="Cantidad:"
              type="number"
              value={formulario.cantidad}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  cantidad: parseFloat(e.target.value) || 0,
                })
              }
              min="0"
              step="0.1"
              required
            />

            <Input
              label="Proveedor:"
              type="text"
              value={formulario.proveedor}
              onChange={(e) =>
                setFormulario({ ...formulario, proveedor: e.target.value })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad:
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formulario.unidad}
                onChange={(e) =>
                  setFormulario({ ...formulario, unidad: e.target.value })
                }
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="L">Litros (L)</option>
                <option value="U">Unidades (U)</option>
              </select>
            </div>

            <Input
              label="Fecha de recepción:"
              type="date"
              value={formulario.fecha}
              onChange={(e) =>
                setFormulario({ ...formulario, fecha: e.target.value })
              }
              required
            />

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" variant="success">
                Guardar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla usando DataTable */}
      <DataTable
        data={materiasFiltradas}
        columns={columns}
        actions={actions}
        loading={loading}
        searchValue={busqueda}
        onSearch={setBusqueda}
        searchPlaceholder="Buscar materias primas..."
        emptyMessage="No hay materias primas registradas"
      />

      {/* Modal de Agregar Stock */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Agregar Stock
              </h3>
              <p className="text-gray-600">{materiaAActualizar?.nombre}</p>
              <p className="text-sm text-gray-500">
                Stock actual: {materiaAActualizar?.cantidad}{" "}
                {materiaAActualizar?.unidad}
              </p>
            </div>

            <form onSubmit={handleStockSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cuánta cantidad desea agregar?
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={cantidadAAgregar}
                    onChange={(e) =>
                      setCantidadAAgregar(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="0.1"
                    placeholder="0"
                    required
                    className="flex-1"
                  />
                  <span className="text-gray-600 font-medium">
                    {materiaAActualizar?.unidad}
                  </span>
                </div>
                {cantidadAAgregar > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Stock total después:{" "}
                    {(materiaAActualizar?.cantidad || 0) + cantidadAAgregar}{" "}
                    {materiaAActualizar?.unidad}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelStock}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={cantidadAAgregar <= 0}
                >
                  Agregar Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-5 text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mb-3">
                <MaterialIcon name="add" className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                Confirmar Agregar Stock
              </h3>
              <p className="text-gray-600 mb-2 text-sm">
                ¿Está seguro de que desea agregar{" "}
                <strong>
                  {cantidadAAgregar} {materiaAActualizar?.unidad}
                </strong>{" "}
                a:
              </p>
              <p className="font-medium text-gray-900 mb-5 text-sm">
                {materiaAActualizar?.nombre}?
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-3 py-1 text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleConfirmStock}
                  className="px-3 py-1 text-sm"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
