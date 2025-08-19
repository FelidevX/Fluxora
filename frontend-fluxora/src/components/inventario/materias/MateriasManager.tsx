"use client";

import { useState } from "react";
import { MateriaPrimaDTO } from "@/types/inventario";
import { useMaterias } from "@/hooks/useMaterias";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

export default function MateriasManager() {
  const {
    materias,
    loading,
    error,
    crearMateria,
    eliminarMateria,
    clearError,
  } = useMaterias();

  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formulario, setFormulario] = useState<MateriaPrimaDTO>({
    nombre: "",
    cantidad: 0,
    proveedor: "",
    estado: "Disponible",
    unidad: "kg",
    fecha: new Date().toISOString().split("T")[0],
  });

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

      // Limpiar formulario
      setFormulario({
        nombre: "",
        cantidad: 0,
        proveedor: "",
        estado: "Disponible",
        unidad: "kg",
        fecha: new Date().toISOString().split("T")[0],
      });

      setShowForm(false);
    } catch (err) {
      // El error ya está manejado en el hook
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
      // El error ya está manejado en el hook
      console.error(err);
    }
  };

  // Filtrar materias por búsqueda
  const materiasFiltradas = materias.filter(
    (materia) =>
      materia.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      materia.proveedor.toLowerCase().includes(busqueda.toLowerCase())
  );

  const obtenerEstadoBadge = (estado: string, cantidad: number) => {
    if (cantidad < 5) return "danger";
    if (estado.toLowerCase() === "disponible") return "success";
    return "warning";
  };

  const obtenerTextoEstado = (estado: string, cantidad: number) => {
    if (cantidad < 5) return "Bajo";
    return estado;
  };

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
            {showForm ? "Cancelar" : "Registrar Materia Prima"}
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
        <div className="bg-white rounded-lg border border-blue-200 p-6">
          <div className="flex items-center mb-4">
            <MaterialIcon
              name="add_box"
              className="w-6 h-6 text-green-600 mr-2"
            />
            <h2 className="text-xl font-semibold text-gray-900">
              Registrar Materia Prima
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Input
              label="Nombre del material:"
              placeholder="Ej: Harina de trigo"
              value={formulario.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre: e.target.value })
              }
              required
            />

            <Input
              label="Cantidad:"
              type="number"
              placeholder="Ej: 50"
              value={formulario.cantidad || ""}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  cantidad: parseFloat(e.target.value) || 0,
                })
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
            />

            <div className="md:col-span-2">
              <Input
                label="Proveedor:"
                placeholder="Ej: Distribuidora nacional"
                value={formulario.proveedor}
                onChange={(e) =>
                  setFormulario({ ...formulario, proveedor: e.target.value })
                }
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" variant="success" disabled={loading}>
                {loading ? "Registrando..." : "Registrar Material"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de inventario */}
      <div className="bg-white rounded-lg border border-blue-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Inventario Actual
          </h2>
          <p className="text-gray-600">
            Listado de materias primas disponibles
          </p>

          <div className="mt-4">
            <Input
              icon="search"
              placeholder="Buscar material o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <MaterialIcon
                name="hourglass_empty"
                className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin"
              />
              <p className="text-gray-600">Cargando materias primas...</p>
            </div>
          ) : materiasFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <MaterialIcon
                name="inventory_2"
                className="w-12 h-12 text-gray-400 mx-auto mb-2"
              />
              <p className="text-gray-600">
                {materias.length === 0
                  ? "No hay materias primas registradas"
                  : "No se encontraron resultados"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materiasFiltradas.map((materia) => (
                  <tr key={materia.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {materia.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {materia.cantidad} {materia.unidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {materia.proveedor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(materia.fecha).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={obtenerEstadoBadge(
                          materia.estado,
                          materia.cantidad
                        )}
                      >
                        {obtenerTextoEstado(materia.estado, materia.cantidad)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
                          title="Editar"
                        >
                          <MaterialIcon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                          onClick={() => handleDelete(materia.id)}
                          title="Eliminar"
                        >
                          <MaterialIcon name="delete" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
