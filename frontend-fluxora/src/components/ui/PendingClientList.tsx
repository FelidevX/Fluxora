import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

interface Client {
  id: number;
  nombre: string;
  direccion: string;
}

interface PendingClientList {
  submitButtonText?: string;
  title?: string;
  onClientsSelected?: (clients: Client[]) => void;
}

interface Ruta {
  id: number;
  nombre: string;
  descripción?: string;
}

export default function PendingClientList({
  submitButtonText = "Registrar cliente",
  title = "Clientes sin asignar",
  onClientsSelected,
}: PendingClientList) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedClients, setSelectedClients] = useState<Set<number>>(
    new Set()
  );
  const [showModal, setShowModal] = useState(false);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<number | null>(null);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [assigningClients, setAssigningClients] = useState(false);

  // Hook para notificaciones toast
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
  } = useToast();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        let token = localStorage.getItem("auth_token");
        if (!token) {
          throw new Error("No se encontró el token de autenticación");
        }

        if (token.startsWith("Bearer ")) {
          token = token.substring(7);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/clientes-sin-ruta`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const allClients = await response.json();
        setClients(allClients);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error al cargar clientes sin ruta:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const fetchRutas = async () => {
    try {
      setLoadingRutas(true);
      let token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const rutasData = await response.json();
      setRutas(rutasData);
    } catch (err) {
      console.error("Error al cargar rutas: ", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Cargar Rutas"
      );
    } finally {
      setLoadingRutas(false);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (!client?.nombre) return false;
      return client.nombre.toLowerCase().includes(search.toLowerCase());
    });
  }, [clients, search]);

  const handleClientSelect = (clientId: number) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const handleAssignClients = async () => {
    setShowModal(true);
    await fetchRutas();
  };

  const handleConfirmAssignment = async () => {
    if (!selectedRuta) {
      warning("Por favor selecciona una ruta", "Selección Requerida");
      return;
    }

    try {
      setAssigningClients(true);
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const selectedClientIds = Array.from(selectedClients);

      for (const clientId of selectedClientIds) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/asignar-cliente`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_ruta: selectedRuta,
              id_cliente: clientId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Error al asignar cliente ${clientId}: ${response.status}`
          );
        }
      }

      setSelectedClients(new Set());
      setShowModal(false);
      setSelectedRuta(null);

      success(
        `${selectedClientIds.length} cliente(s) asignado(s) exitosamente a la ruta`,
        "¡Asignación Exitosa!"
      );

      // Recargar clientes sin ruta
      window.location.reload();
    } catch (err) {
      console.error("Error al asignar clientes:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido",
        "Error al Asignar Clientes"
      );
    } finally {
      setAssigningClients(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border-2 border-orange-500 max-w-full">
        <div className="flex items-center justify-center py-8">
          <span className="ml-2 text-gray-600">
            Cargando clientes sin asignar...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border-2 border-red-500 max-w-full">
        <div className="text-center py-8">
          <span className="text-red-600">❌ Error: {error}</span>
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">
            {filteredClients.length} clientes sin ruta — selecciona los clientes
            que deseas asignar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded-md w-64 text-black"
            />
          </div>

          {filteredClients.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {selectedClients.size === filteredClients.length
                ? "Deseleccionar todo"
                : "Seleccionar todo"}
            </button>
          )}

          {selectedClients.size > 0 && (
            <button
              onClick={handleAssignClients}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {submitButtonText} ({selectedClients.size})
            </button>
          )}
        </div>
      </div>

      {/* compact search for small screens */}
      <div className="sm:hidden mb-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-full text-black"
        />
      </div>

      {filteredClients.length > 0 ? (
        <div className="relative">
          <div className="h-[420px] overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`w-full bg-white shadow-sm rounded-lg p-4 cursor-pointer transition-shadow ${
                    selectedClients.has(client.id)
                      ? "ring-2 ring-orange-300 bg-orange-50"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => handleClientSelect(client.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base mb-1">
                        {client.nombre}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {client.direccion}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedClients.has(client.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleClientSelect(client.id);
                        }}
                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          {search
            ? "No se encontraron clientes con ese criterio de búsqueda."
            : "¡Todos los clientes están asignados a rutas!"}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl relative z-25">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Seleccionar Ruta
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Asignar {selectedClients.size} cliente(s) a una ruta:
            </p>

            {loadingRutas ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando rutas...</span>
              </div>
            ) : (
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {rutas.map((ruta) => (
                  <div
                    key={ruta.id}
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedRuta === ruta.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedRuta(ruta.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedRuta === ruta.id}
                        onChange={() => setSelectedRuta(ruta.id)}
                        className="mr-3"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {ruta.nombre}
                        </h4>
                        {ruta.descripción && (
                          <p className="text-sm text-gray-600">
                            {ruta.descripción}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRuta(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={assigningClients}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedRuta || assigningClients}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {assigningClients ? "Asignando..." : "Confirmar"}
              </button>
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
