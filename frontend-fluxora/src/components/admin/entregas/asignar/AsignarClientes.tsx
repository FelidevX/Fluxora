"use client";
import React, { Fragment, useState, useEffect, useMemo } from "react";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import { ClienteConRutaDTO } from "@/types/Clientes";

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  latitud?: number;
  longitud?: number;
  email?: string;
  precioCorriente?: number;
  precioEspecial?: number;
}

interface Ruta {
  id: number;
  nombre: string;
  descripcion?: string;
}

type TabType = "sin-asignar" | "asignados";

export function AsignarClientes() {
  const [activeTab, setActiveTab] = useState<TabType>("sin-asignar");
  const [clientesSinAsignar, setClientesSinAsignar] = useState<Cliente[]>([]);
  const [clientesAsignados, setClientesAsignados] = useState<
    ClienteConRutaDTO[]
  >([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAsignados, setLoadingAsignados] = useState(false);
  const [loadingRutas, setLoadingRutas] = useState(false);

  // Estados para modales
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showReasignarModal, setShowReasignarModal] = useState(false);
  const [clientesSeleccionados, setClientesSeleccionados] = useState<number[]>(
    []
  );
  const [clientesAsignadosSeleccionados, setClientesAsignadosSeleccionados] =
    useState<number[]>([]);
  const [clienteAReasignar, setClienteAReasignar] =
    useState<ClienteConRutaDTO | null>(null);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<number | null>(null);
  const [assigningClients, setAssigningClients] = useState(false);

  // Búsqueda y filtros
  const [busquedaSinAsignar, setBusquedaSinAsignar] = useState("");
  const [busquedaAsignados, setBusquedaAsignados] = useState("");
  const [filtroRuta, setFiltroRuta] = useState<number | "todas">("todas");

  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  useEffect(() => {
    cargarClientesSinAsignar();
    cargarClientesAsignados();
    cargarRutas();
  }, []);

  const cargarClientesSinAsignar = async () => {
    try {
      setLoading(true);
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) token = token.substring(7);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/clientes-sin-ruta`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setClientesSinAsignar(data);
    } catch (err) {
      console.error("Error al cargar clientes sin asignar:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Cargar Clientes"
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarClientesAsignados = async () => {
    try {
      setLoadingAsignados(true);
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) token = token.substring(7);

      // Endpoint para obtener todos los clientes con ruta asignada
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/clientes-con-ruta`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // Si el endpoint no existe (404), intentar con el método anterior
        if (response.status === 404) {
          console.log(
            "Endpoint /clientes-con-ruta no existe, usando método alternativo"
          );
          await cargarClientesAsignadosAlternativo(token);
          return;
        }
        throw new Error(`Error ${response.status}`);
      }

      const clientesConRuta = await response.json();
      setClientesAsignados(clientesConRuta);
    } catch (err) {
      console.error("Error al cargar clientes asignados:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Cargar Clientes Asignados"
      );
    } finally {
      setLoadingAsignados(false);
    }
  };

  // Método alternativo: extraer clientes de todas las rutas
  const cargarClientesAsignadosAlternativo = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Error ${response.status}`);
      const rutasData = await response.json();

      // Extraer todos los clientes asignados de todas las rutas
      const clientesConRuta: ClienteConRutaDTO[] = [];
      rutasData.forEach((ruta: any) => {
        if (ruta.clientes && Array.isArray(ruta.clientes)) {
          ruta.clientes.forEach((cliente: any) => {
            clientesConRuta.push({
              id: cliente.id,
              nombre: cliente.nombre,
              direccion: cliente.direccion,
              latitud: cliente.latitud || 0,
              longitud: cliente.longitud || 0,
              email: cliente.email || "",
              precioCorriente: cliente.precioCorriente || 0,
              precioEspecial: cliente.precioEspecial || 0,
              rutaId: ruta.id,
              rutaNombre: ruta.nombre,
            });
          });
        }
      });

      setClientesAsignados(clientesConRuta);
    } catch (err) {
      console.error(
        "Error al cargar clientes asignados (método alternativo):",
        err
      );
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Cargar Clientes Asignados"
      );
    }
  };

  const cargarRutas = async () => {
    try {
      setLoadingRutas(true);
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) token = token.substring(7);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setRutas(data);
    } catch (err) {
      console.error("Error al cargar rutas:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Cargar Rutas"
      );
    } finally {
      setLoadingRutas(false);
    }
  };

  const handleAsignarClientes = async () => {
    if (clientesSeleccionados.length === 0) {
      warning("Seleccione al menos un cliente", "Selección Requerida");
      return;
    }
    setShowAsignarModal(true);
  };

  const handleReasignarMultiple = () => {
    if (clientesAsignadosSeleccionados.length === 0) {
      warning("Seleccione al menos un cliente", "Selección Requerida");
      return;
    }
    setShowReasignarModal(true);
  };

  const handleConfirmarAsignacion = async () => {
    if (!rutaSeleccionada) {
      warning("Seleccione una ruta", "Selección Requerida");
      return;
    }

    try {
      setAssigningClients(true);
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) token = token.substring(7);

      for (const clienteId of clientesSeleccionados) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/asignar-cliente`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_ruta: rutaSeleccionada,
              id_cliente: clienteId,
            }),
          }
        );

        if (!response.ok)
          throw new Error(`Error al asignar cliente ${clienteId}`);
      }

      success(
        `${clientesSeleccionados.length} cliente(s) asignado(s) exitosamente`,
        "¡Asignación Exitosa!"
      );

      setClientesSeleccionados([]);
      setShowAsignarModal(false);
      setRutaSeleccionada(null);
      await cargarClientesSinAsignar();
      await cargarClientesAsignados();
    } catch (err) {
      console.error("Error al asignar clientes:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Asignar"
      );
    } finally {
      setAssigningClients(false);
    }
  };

  const handleConfirmarReasignacion = async () => {
    if (!rutaSeleccionada) {
      warning("Seleccione una ruta", "Selección Requerida");
      return;
    }

    try {
      setAssigningClients(true);
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) token = token.substring(7);

      // Reasignar todos los clientes seleccionados
      for (const clienteId of clientesAsignadosSeleccionados) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/reasignar-cliente`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_ruta: rutaSeleccionada,
              id_cliente: clienteId,
            }),
          }
        );

        if (!response.ok)
          throw new Error(`Error al reasignar cliente ${clienteId}`);
      }

      success(
        `${clientesAsignadosSeleccionados.length} cliente(s) reasignado(s) exitosamente`,
        "¡Reasignación Exitosa!"
      );

      setShowReasignarModal(false);
      setClientesAsignadosSeleccionados([]);
      setRutaSeleccionada(null);
      await cargarClientesAsignados();
    } catch (err) {
      console.error("Error al reasignar clientes:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Reasignar"
      );
    } finally {
      setAssigningClients(false);
    }
  };

  const toggleClienteSeleccionado = (clienteId: number) => {
    setClientesSeleccionados((prev) =>
      prev.includes(clienteId)
        ? prev.filter((id) => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const toggleClienteAsignadoSeleccionado = (clienteId: number) => {
    setClientesAsignadosSeleccionados((prev) =>
      prev.includes(clienteId)
        ? prev.filter((id) => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const toggleSeleccionarTodos = () => {
    const clientesFiltrados = clientesSinAsignar.filter((c) =>
      c.nombre.toLowerCase().includes(busquedaSinAsignar.toLowerCase())
    );

    if (clientesSeleccionados.length === clientesFiltrados.length) {
      setClientesSeleccionados([]);
    } else {
      setClientesSeleccionados(clientesFiltrados.map((c) => c.id));
    }
  };

  const toggleSeleccionarTodosAsignados = () => {
    if (
      clientesAsignadosSeleccionados.length ===
      clientesAsignadosFiltrados.length
    ) {
      setClientesAsignadosSeleccionados([]);
    } else {
      setClientesAsignadosSeleccionados(
        clientesAsignadosFiltrados.map((c) => c.id)
      );
    }
  };

  // Columnas para clientes sin asignar
  const columnasSinAsignar = [
    {
      key: "seleccion",
      label: "",
      render: (cliente: Cliente) => (
        <input
          type="checkbox"
          checked={clientesSeleccionados.includes(cliente.id)}
          onChange={() => toggleClienteSeleccionado(cliente.id)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
      ),
      className: "w-12",
    },
    {
      key: "nombre",
      label: "Nombre",
      render: (cliente: Cliente) => (
        <span className="font-medium text-gray-900 text-sm">{cliente.nombre}</span>
      ),
    },
    {
      key: "direccion",
      label: "Dirección",
      render: (cliente: Cliente) => (
        <span className="text-gray-600 text-sm">{cliente.direccion}</span>
      ),
    },
  ];

  // Columnas para clientes asignados
  const columnasAsignados = [
    {
      key: "seleccion",
      label: "",
      render: (cliente: Cliente) => (
        <input
          type="checkbox"
          checked={clientesAsignadosSeleccionados.includes(cliente.id)}
          onChange={() => toggleClienteAsignadoSeleccionado(cliente.id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      className: "w-12",
    },
    {
      key: "nombre",
      label: "Nombre",
      render: (cliente: ClienteConRutaDTO) => (
        <span className="font-medium text-gray-900 text-sm">{cliente.nombre}</span>
      ),
    },
    {
      key: "direccion",
      label: "Dirección",
      render: (cliente: ClienteConRutaDTO) => (
        <span className="text-gray-600 text-sm">{cliente.direccion}</span>
      ),
    },
    {
      key: "ruta",
      label: "Ruta",
      render: (cliente: ClienteConRutaDTO) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {cliente.rutaNombre}
        </span>
      ),
    },
  ];

  const clientesSinAsignarFiltrados = useMemo(() => {
    return clientesSinAsignar.filter((c) =>
      c.nombre.toLowerCase().includes(busquedaSinAsignar.toLowerCase())
    );
  }, [clientesSinAsignar, busquedaSinAsignar]);

  const clientesAsignadosFiltrados = useMemo(() => {
    let filtrados = clientesAsignados;

    // Filtrar por ruta
    if (filtroRuta !== "todas") {
      filtrados = filtrados.filter((c) => c.rutaId === filtroRuta);
    }

    // Filtrar por búsqueda
    if (busquedaAsignados) {
      filtrados = filtrados.filter((c) =>
        c.nombre.toLowerCase().includes(busquedaAsignados.toLowerCase())
      );
    }

    return filtrados;
  }, [clientesAsignados, busquedaAsignados, filtroRuta]);

  return (
    <Fragment>
      <div className="max-w-full overflow-x-hidden">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">Asignar Clientes</h2>
          <p className="text-sm text-gray-500">
            Administra la asignación de clientes a rutas de entrega.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab("sin-asignar")}
            className={`${
              activeTab === "sin-asignar"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors flex items-center`}
          >
            <MaterialIcon name="person_add" className="mr-1 md:mr-2 text-base md:text-xl" />
            <span className="hidden sm:inline">Clientes sin Asignar</span>
            <span className="sm:hidden">Sin Asignar</span>
            {clientesSinAsignar.length > 0 && (
              <span className="ml-1 md:ml-2 bg-blue-100 text-blue-600 py-0.5 px-1.5 md:px-2.5 rounded-full text-xs font-medium">
                {clientesSinAsignar.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("asignados")}
            className={`${
              activeTab === "asignados"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors flex items-center`}
          >
            <MaterialIcon name="assignment_ind" className="mr-1 md:mr-2 text-base md:text-xl" />
            <span className="hidden sm:inline">Clientes Asignados</span>
            <span className="sm:hidden">Asignados</span>
            {clientesAsignados.length > 0 && (
              <span className="ml-1 md:ml-2 bg-blue-100 text-blue-600 py-0.5 px-1.5 md:px-2.5 rounded-full text-xs font-medium">
                {clientesAsignados.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Contenido de tabs */}
      {activeTab === "sin-asignar" && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {clientesSinAsignar.length > 0 && (
                <Button variant="primary" onClick={toggleSeleccionarTodos} className="w-full sm:w-auto text-sm">
                  <MaterialIcon
                    name={
                      clientesSeleccionados.length ===
                      clientesSinAsignarFiltrados.length
                        ? "check_box"
                        : "check_box_outline_blank"
                    }
                    className="mr-2"
                  />
                  <span className="md:inline">
                    {clientesSeleccionados.length ===
                    clientesSinAsignarFiltrados.length
                      ? "Deseleccionar Todos"
                      : "Seleccionar Todos"}
                  </span>
                </Button>
              )}
              {clientesSeleccionados.length > 0 && (
                <Button variant="success" onClick={handleAsignarClientes} className="w-full sm:w-auto text-sm">
                  <MaterialIcon name="add_road" className="mr-2" />
                  Asignar a Ruta ({clientesSeleccionados.length})
                </Button>
              )}
            </div>
          </div>

          <DataTable
            data={clientesSinAsignarFiltrados}
            columns={columnasSinAsignar}
            loading={loading}
            searchValue={busquedaSinAsignar}
            onSearch={setBusquedaSinAsignar}
            searchPlaceholder="Buscar cliente..."
            emptyMessage="No hay clientes sin asignar"
            pagination={{
              enabled: true,
              serverSide: false,
              defaultPageSize: 10,
              pageSizeOptions: [5, 10, 25, 50],
            }}
          />
        </div>
      )}

      {activeTab === "asignados" && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-6">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              {/* Filtro por ruta */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <MaterialIcon name="filter_list" className="text-gray-600 flex-shrink-0" />
                <select
                  value={filtroRuta}
                  onChange={(e) =>
                    setFiltroRuta(
                      e.target.value === "todas"
                        ? "todas"
                        : Number(e.target.value)
                    )
                  }
                  className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                >
                  <option value="todas">Todas las rutas</option>
                  {rutas.map((ruta) => (
                    <option key={ruta.id} value={ruta.id}>
                      {ruta.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {clientesAsignados.length > 0 && (
                  <Button
                    variant="primary"
                    onClick={toggleSeleccionarTodosAsignados}
                    className="w-full sm:w-auto text-sm"
                  >
                    <MaterialIcon
                      name={
                        clientesAsignadosSeleccionados.length ===
                        clientesAsignadosFiltrados.length
                          ? "check_box"
                          : "check_box_outline_blank"
                      }
                      className="mr-2"
                    />
                    <span className="md:inline">
                      {clientesAsignadosSeleccionados.length ===
                      clientesAsignadosFiltrados.length
                        ? "Deseleccionar Todos"
                        : "Seleccionar Todos"}
                    </span>
                  </Button>
                )}

                {clientesAsignadosSeleccionados.length > 0 && (
                  <Button variant="warning" onClick={handleReasignarMultiple} className="w-full sm:w-auto text-sm">
                    <MaterialIcon name="swap_horiz" className="mr-2" />
                    Reasignar ({clientesAsignadosSeleccionados.length})
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DataTable
            data={clientesAsignadosFiltrados}
            columns={columnasAsignados}
            loading={loadingAsignados}
            searchValue={busquedaAsignados}
            onSearch={setBusquedaAsignados}
            searchPlaceholder="Buscar cliente asignado..."
            emptyMessage="No hay clientes asignados a rutas"
            pagination={{
              enabled: true,
              serverSide: false,
              defaultPageSize: 10,
              pageSizeOptions: [5, 10, 25, 50],
            }}
          />
        </div>
      )}

      {/* Modal de Asignar */}
      {showAsignarModal && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => {
            setShowAsignarModal(false);
            setRutaSeleccionada(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Asignar Clientes a Ruta
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Asignar {clientesSeleccionados.length} cliente(s)
                seleccionado(s)
              </p>
            </div>

            <div className="p-6">
              {loadingRutas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Cargando rutas...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {rutas.map((ruta) => (
                    <div
                      key={ruta.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        rutaSeleccionada === ruta.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setRutaSeleccionada(ruta.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={rutaSeleccionada === ruta.id}
                          onChange={() => setRutaSeleccionada(ruta.id)}
                          className="mr-3 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {ruta.nombre}
                          </h4>
                          {ruta.descripcion && (
                            <p className="text-sm text-gray-600">
                              {ruta.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAsignarModal(false);
                    setRutaSeleccionada(null);
                  }}
                  disabled={assigningClients}
                >
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleConfirmarAsignacion}
                  disabled={!rutaSeleccionada || assigningClients}
                >
                  {assigningClients ? "Asignando..." : "Confirmar Asignación"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reasignar */}
      {showReasignarModal && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50"
          onClick={() => {
            setShowReasignarModal(false);
            setClientesAsignadosSeleccionados([]);
            setRutaSeleccionada(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Reasignar Clientes
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Reasignar {clientesAsignadosSeleccionados.length} cliente(s)
                seleccionado(s) a una nueva ruta
              </p>
            </div>

            <div className="p-6">
              {loadingRutas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Cargando rutas...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {rutas.map((ruta) => (
                    <div
                      key={ruta.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        rutaSeleccionada === ruta.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setRutaSeleccionada(ruta.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={rutaSeleccionada === ruta.id}
                          onChange={() => setRutaSeleccionada(ruta.id)}
                          className="mr-3 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {ruta.nombre}
                          </h4>
                          {ruta.descripcion && (
                            <p className="text-sm text-gray-600">
                              {ruta.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowReasignarModal(false);
                    setClientesAsignadosSeleccionados([]);
                    setRutaSeleccionada(null);
                  }}
                  disabled={assigningClients}
                >
                  Cancelar
                </Button>
                <Button
                  variant="warning"
                  onClick={handleConfirmarReasignacion}
                  disabled={!rutaSeleccionada || assigningClients}
                >
                  {assigningClients
                    ? "Reasignando..."
                    : "Confirmar Reasignación"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
      </div>
    </Fragment>
  );
}
