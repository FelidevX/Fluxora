"use client";

import React, { useState, useEffect } from "react";
import ClientForm from "@/components/clientes/ClientForm";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface Client {
  id: number;
  nombre: string;
  contacto: string;
  direccion: string;
  ruta: string;
  ultimaEntrega: string;
  estado: "activo" | "inactivo";
}

const ClientesPage = () => {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"clientes" | "repartos">(
    "clientes"
  );

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error al cargar los clientes");
      const data = await res.json();

      setClients(
        data.map((c: any) => ({
          id: c.id || 0,
          nombre: c.nombre || "No disponible",
          contacto: c.contacto || "No disponible",
          direccion: c.direccion || "No disponible",
          ruta: c.ruta || "No disponible",
          ultimaEntrega: c.ultimaEntrega || "No disponible",
          estado: c.estado || "activo",
        }))
      );
    } catch (error: any) {
      setErrorMessage(
        error.message ||
          "Error al cargar los clientes. Por favor, intente nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filtrar clientes por búsqueda
  const filteredClients = clients.filter((client) => {
    const q = search.toLowerCase();
    return (
      client.nombre.toLowerCase().includes(q) ||
      client.contacto.toLowerCase().includes(q) ||
      client.direccion.toLowerCase().includes(q)
    );
  });

  const handleClientSubmit = async (data: any) => {
    // Manejo de resultado exitoso
    setSuccessMessage("¡Cliente registrado exitosamente!");
    setErrorMessage("");

    // Limpiar el mensaje después de unos segundos
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
    await fetchClients();
  };

  const handleEdit = (id: number) => {
    alert(`Editar cliente ${id}`);
  };

  const handleDelete = async (id: number) => {
    // Confirmar antes de eliminar
    const confirmed = window.confirm(
      "¿Está seguro de eliminar este cliente? Esta acción eliminará también todas las relaciones con rutas, entregas y programaciones."
    );

    if (!confirmed) return;

    try {
      let token = localStorage.getItem("auth_token");

      if (!token) throw new Error("No se encontró el token de autenticación");

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al eliminar el cliente");
      }

      setSuccessMessage("¡Cliente eliminado exitosamente!");
      setErrorMessage("");

      // Recargar la lista de clientes
      await fetchClients();

      // Limpiar el mensaje después de unos segundos
      setTimeout(() => {
        setSuccessMessage("");
      }, 10000);
    } catch (error: any) {
      setErrorMessage(
        error.message ||
          "Error al eliminar el cliente. Por favor, intente nuevamente."
      );
      setSuccessMessage("");

      // Limpiar el mensaje de error después de unos segundos
      setTimeout(() => {
        setErrorMessage("");
      }, 10000);
    }
  };

  const handleTabClick = (tab: "clientes" | "repartos") => {
    setActiveTab(tab);
    if (tab === "repartos") {
      router.push("/dashboard/repartos"); // Cambia la ruta según tu estructura
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de clientes
          </h1>
          <p className="text-gray-600">
            {" Gestiona clienes y rutas de reparto "}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">Nuevo Cliente</span>
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors text-gray-600">
            <MaterialIcon name="print" className="text-green-600 mr-1" />{" "}
            Imprimir hoja de ruta
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            <MaterialIcon name="file_export" className="text-white mr-1" />{" "}
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* Mensajes de feedback */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Panel de formulario similar a Materias: aparece al hacer click en Nuevo Cliente */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md text-black mb-6">
          <ClientForm
            onSubmit={(data) => {
              handleClientSubmit(data);
              setShowForm(false);
            }}
            title="Registrar nuevo cliente"
            submitButtonText="Registrar cliente"
          />
        </div>
      )}

      <div className="flex-1">
        <DataTable
          data={filteredClients}
          columns={[
            {
              key: "nombre",
              label: "Cliente",
              render: (c: Client) => (
                <span className="text-sm font-medium text-gray-800">
                  {c.nombre}
                </span>
              ),
            },
            {
              key: "contacto",
              label: "Contacto",
              render: (c: Client) => (
                <span className="text-sm text-gray-800">{c.contacto}</span>
              ),
            },
            {
              key: "direccion",
              label: "Dirección",
              render: (c: Client) => (
                <span className="text-sm text-gray-800">
                  {c.direccion.length > 40
                    ? c.direccion.slice(0, 40) + "..."
                    : c.direccion}
                </span>
              ),
            },
            {
              key: "ruta",
              label: "Ruta",
              render: (c: Client) => <Badge variant="info">{c.ruta}</Badge>,
            },
            {
              key: "ultimaEntrega",
              label: "Última entrega",
              render: (c: Client) => (
                <span className="text-sm text-gray-800">{c.ultimaEntrega}</span>
              ),
            },
            {
              key: "estado",
              label: "Estado",
              render: (c: Client) => (
                <Badge variant={c.estado === "activo" ? "success" : "warning"}>
                  {c.estado === "activo" ? "Activo" : "Inactivo"}
                </Badge>
              ),
            },
          ]}
          actions={[
            {
              label: "Editar",
              icon: "edit",
              variant: "primary" as const,
              onClick: (c: Client) => handleEdit(c.id),
            },
            {
              label: "Eliminar",
              icon: "delete",
              variant: "danger" as const,
              onClick: (c: Client) => handleDelete(c.id),
            },
          ]}
          loading={isLoading}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Buscar cliente..."
          pagination={{ enabled: true, serverSide: false, defaultPageSize: 10 }}
          emptyMessage="No se encontraron clientes"
        />
      </div>
    </div>
  );
};

export default ClientesPage;
