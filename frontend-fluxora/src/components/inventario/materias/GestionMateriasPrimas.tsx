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
  const [materiaAActualizar, setMateriaAActualizar] =
    useState<MateriaPrima | null>(null);
  const [lotes, setLotes] = useState<
    Array<{
      id?: number;
      materiaPrimaId: number;
      cantidad: number;
      stockActual?: number;
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
    // Cargar lotes existentes
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
      // Filtrar solo lotes con stock_actual > 0
      const lotesConStock = Array.isArray(data)
        ? data.filter((lote: any) => {
            // Usar stockActual si existe, sino usar cantidad como fallback
            const stock =
              lote.stockActual !== undefined ? lote.stockActual : lote.cantidad;
            return stock > 0;
          })
        : [];
      setLotes(lotesConStock);
    } catch (err) {
      console.error("Error fetching lotes:", err);
      setLotes([]);
    }
  };

  const handleCancelStock = () => {
    setShowStockModal(false);
    setMateriaAActualizar(null);
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
      label: "Visualizar Lotes",
      icon: "visibility",
      variant: "primary" as const,
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

      {/* Modal de Visualizar Lotes */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Visualizar Lotes
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {materiaAActualizar?.nombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    Stock total disponible:{" "}
                    <span className="font-semibold text-green-600">
                      {materiaAActualizar?.cantidad ?? 0}
                    </span>{" "}
                    {materiaAActualizar?.unidad}
                  </p>
                </div>
                <button
                  onClick={handleCancelStock}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MaterialIcon name="close" className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Lotes con stock disponible (ordenados por fecha de vencimiento -
                FEFO)
              </p>

              {lotes && lotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-gray-700 font-medium">
                          Fecha Compra
                        </th>
                        <th className="py-3 px-4 text-gray-700 font-medium">
                          Fecha Vencimiento
                        </th>
                        <th className="py-3 px-4 text-gray-700 font-medium text-right">
                          Cantidad Original
                        </th>
                        <th className="py-3 px-4 text-gray-700 font-medium text-right">
                          Stock Actual
                        </th>
                        <th className="py-3 px-4 text-gray-700 font-medium text-right">
                          Costo Unitario
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {lotes.map((lote) => {
                        const stockActual = lote.stockActual ?? lote.cantidad;
                        const porcentajeConsumido =
                          ((lote.cantidad - stockActual) / lote.cantidad) * 100;

                        return (
                          <tr
                            key={
                              lote.id ??
                              `${lote.materiaPrimaId}-${lote.fechaCompra}-${lote.cantidad}`
                            }
                            className="hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-900">
                              {lote.fechaCompra
                                ? new Date(lote.fechaCompra).toLocaleDateString(
                                    "es-CL"
                                  )
                                : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {lote.fechaVencimiento ? (
                                <span className="text-orange-600 font-medium">
                                  {new Date(
                                    lote.fechaVencimiento
                                  ).toLocaleDateString("es-CL")}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  Sin vencimiento
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900">
                              {lote.cantidad} {materiaAActualizar?.unidad}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span
                                  className={`font-semibold ${
                                    porcentajeConsumido > 50
                                      ? "text-orange-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {stockActual} {materiaAActualizar?.unidad}
                                </span>
                                {porcentajeConsumido > 0 && (
                                  <span className="text-xs text-gray-500">
                                    ({porcentajeConsumido.toFixed(0)}% usado)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900">
                              {typeof lote.costoUnitario === "number"
                                ? lote.costoUnitario.toLocaleString("es-CL", {
                                    style: "currency",
                                    currency: "CLP",
                                  })
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MaterialIcon
                    name="inventory_2"
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                  />
                  <p className="text-gray-500">
                    No hay lotes con stock disponible para esta materia prima.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Los lotes consumidos completamente no se muestran aquí.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={handleCancelStock}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
