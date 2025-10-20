"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MateriaPrimaDTO, MateriaPrima } from "@/types/inventario";
import { useMaterias } from "@/hooks/useMaterias";
import { useCurrentDate } from "@/hooks/useDate";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DataTable from "@/components/ui/DataTable";

export default function GestionMateriasPrimas() {
  const searchParams = useSearchParams();
  const {
    materias,
    loading,
    error,
    cargarMaterias,
    crearMateria,
    eliminarMateria,
    clearError,
  } = useMaterias();

  const { currentDate } = useCurrentDate();

  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [materiaAActualizar, setMateriaAActualizar] =
    useState<MateriaPrima | null>(null);
  const [cantidadAAgregar, setCantidadAAgregar] = useState(0);
  const [costoUnitario, setCostoUnitario] = useState(0);
  const [fechaCompraInput, setFechaCompraInput] = useState(
    currentDate || new Date().toISOString().split("T")[0]
  );
  const [fechaVencimientoInput, setFechaVencimientoInput] = useState<
    string | null
  >(null);
  const [lotes, setLotes] = useState<
    Array<{
      id?: number;
      materiaPrimaId: number;
      cantidad: number;
      costoUnitario: number;
      fechaCompra: string;
      fechaVencimiento?: string | null;
    }>
  >([]);
  const [formulario, setFormulario] = useState<MateriaPrimaDTO>({
    nombre: "",
    unidad: "kg",
  });

  // Cargar materias al montar el componente
  useEffect(() => {
    cargarMaterias();
  }, []);

  // Detectar si se debe abrir el formulario automáticamente
  useEffect(() => {
    const action = searchParams?.get("action");
    const suggestion = searchParams?.get("suggestion");

    if (action === "create") {
      setShowForm(true);

      // Si hay una sugerencia de nombre, pre-llenar el formulario
      if (suggestion) {
        setFormulario((prev) => ({
          ...prev,
          nombre: suggestion,
        }));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulario.nombre) {
      return;
    }

    try {
      // Create catalog materia (stock will be added by creating lotes)
      await crearMateria({
        nombre: formulario.nombre,
        unidad: formulario.unidad,
      });

      // Reset del formulario (solo catálogo)
      setFormulario({ nombre: "", unidad: "kg" });
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
    setCostoUnitario(0);
    setFechaVencimientoInput(null);
    // Antes de abrir, cargar lotes existentes
    fetchLotes(materia.id);
    setShowStockModal(true);
  };

  const fetchLotes = async (materiaId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/inventario/materias-primas/${materiaId}/lotes`
      );
      if (!res.ok) throw new Error("Error al obtener lotes");
      const data = await res.json();
      setLotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching lotes:", err);
      setLotes([]);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidadAAgregar <= 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmStock = async () => {
    if (!materiaAActualizar) return;

    try {
      // Crear un lote con la cantidad y el costo proporcionado por el usuario
      const lote = {
        cantidad: cantidadAAgregar,
        costoUnitario: costoUnitario,
        fechaCompra: fechaCompraInput,
        fechaVencimiento: fechaVencimientoInput || null,
      };

      const response = await fetch(
        `http://localhost:8080/api/inventario/materias-primas/${materiaAActualizar.id}/lotes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lote),
        }
      );

      if (!response.ok) {
        throw new Error(`Error creando lote: ${response.status}`);
      }

      // Refresh materia list and lotes
      await cargarMaterias();
      await fetchLotes(materiaAActualizar.id);

      setShowConfirmModal(false);
      setShowStockModal(false);
      setMateriaAActualizar(null);
      setCantidadAAgregar(0);
      setCostoUnitario(0);
      setFechaVencimientoInput(null);
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

  // Filtrar materias primas por búsqueda (nombre o unidad)
  const materiasFiltradas = materias.filter(
    (materia) =>
      (materia.nombre?.toLowerCase() || "").includes(busqueda.toLowerCase()) ||
      (materia.unidad?.toLowerCase() || "").includes(busqueda.toLowerCase())
  );

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
      key: "unidad",
      label: "Unidad",
      render: (materia: MateriaPrima) => (
        <span className="text-sm text-gray-900">{materia.unidad || ""}</span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (materia: MateriaPrima) => (
        <span className="text-sm text-gray-900">
          {materia.cantidad ?? 0} {materia.unidad || ""}
        </span>
      ),
    },
  ];

  // Definir acciones de la tabla
  const actions = [
    {
      label: "Registrar Compra",
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
          <h2 className="text-xl font-semibold text-gray-900">
            Catálogo de Materias Primas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona las materias primas disponibles en el sistema
          </p>
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
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Nueva Materia Prima
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              label="Nombre de la materia prima:"
              type="text"
              value={formulario.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre: e.target.value })
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
        pagination={{
          enabled: true,
          serverSide: false,
          defaultPageSize: 10,
          pageSizeOptions: [5, 10, 25, 50],
        }}
      />

      {/* Modal de Agregar Stock */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Registrar Compra Rápida
              </h3>
              <p className="text-gray-600">{materiaAActualizar?.nombre}</p>
              <p className="text-sm text-gray-500">
                Stock actual: {materiaAActualizar?.cantidad ?? 0}{" "}
                {materiaAActualizar?.unidad}
              </p>
            </div>

            {/* Lista de lotes existentes para esta materia */}
            <div className="p-4 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Lotes existentes
              </h4>
              {lotes && lotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-2">Fecha compra</th>
                        <th className="py-2 px-2">Cantidad</th>
                        <th className="py-2 px-2">Costo unit.</th>
                        <th className="py-2 px-2">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotes.map((lote) => (
                        <tr
                          key={
                            lote.id ??
                            `${lote.materiaPrimaId}-${lote.fechaCompra}-${lote.cantidad}`
                          }
                          className="odd:bg-gray-50"
                        >
                          <td className="py-2 px-2">
                            {lote.fechaCompra
                              ? new Date(lote.fechaCompra).toLocaleDateString(
                                  "es-CL"
                                )
                              : "-"}
                          </td>
                          <td className="py-2 px-2">
                            {lote.cantidad} {materiaAActualizar?.unidad}
                          </td>
                          <td className="py-2 px-2">
                            {typeof lote.costoUnitario === "number"
                              ? lote.costoUnitario.toLocaleString("es-CL", {
                                  style: "currency",
                                  currency: "CLP",
                                })
                              : "-"}
                          </td>
                          <td className="py-2 px-2">
                            {lote.fechaVencimiento
                              ? new Date(
                                  lote.fechaVencimiento
                                ).toLocaleDateString("es-CL")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No hay lotes registrados para esta materia.
                </p>
              )}
            </div>

            <form onSubmit={handleStockSubmit} className="p-6">
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad a agregar
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    label="Costo unitario (CLP):"
                    type="number"
                    value={costoUnitario}
                    onChange={(e) =>
                      setCostoUnitario(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="0.01"
                    placeholder="Ej: 1200"
                    className="w-full"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de compra:
                    </label>
                    <input
                      type="date"
                      value={fechaCompraInput}
                      onChange={(e) => setFechaCompraInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de vencimiento (opcional):
                  </label>
                  <input
                    type="date"
                    value={fechaVencimientoInput ?? ""}
                    onChange={(e) =>
                      setFechaVencimientoInput(e.target.value || null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
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
                  Registrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-5 text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mb-3">
                <MaterialIcon name="add" className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                Confirmar registro de compra
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
