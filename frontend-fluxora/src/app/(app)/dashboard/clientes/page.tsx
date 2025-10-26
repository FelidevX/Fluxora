"use client";

import React, { useState, useEffect } from "react";
import { useClientes } from "@/hooks/useClientes";
import { ClienteResponse } from "@/types/Clientes";
import ClientForm from "@/components/clientes/ClientForm";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/ui/MaterialIcon";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

const ClientesPage = () => {
  const {
    clientes,
    loading,
    error,
    cargarClientes,
    crearCliente,
    clearError,
    eliminarCliente,
  } = useClientes();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"clientes" | "repartos">(
    "clientes"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] =
    useState<ClienteResponse | null>(null);

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Filtrar clientes por búsqueda
  const filteredClients = clientes.filter((client) => {
    // Verificar que el cliente existe
    if (!client) return false;

    const q = search.toLowerCase();

    return (
      client.nombre?.toLowerCase().includes(q) ||
      client.contacto?.toLowerCase().includes(q) ||
      client.direccion?.toLowerCase().includes(q)
    );
  });

  const handleClientSubmit = async (data: any) => {
    try {
      // Transformar los datos del formulario al formato del backend
      const clientData = {
        nombreNegocio: data.businessName,
        nombre: data.contactPerson,
        contacto: data.phone,
        direccion: data.address,
        latitud: data.latitude,
        longitud: data.longitude,
        email: data.email,
        precioCorriente: data.precioCorriente,
        precioEspecial: data.precioEspecial,
      };
      
      await crearCliente(clientData);
      setSuccessMessage("¡Cliente registrado exitosamente!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setErrorMessage("Error al registrar el cliente");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleEdit = (id: number) => {
    alert(`Editar cliente ${id}`);
  };

  const handleDelete = (cliente: ClienteResponse) => {
    setClienteAEliminar(cliente);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteAEliminar) return;
    try {
      await eliminarCliente(clienteAEliminar.id);
      setShowDeleteModal(false);
      setClienteAEliminar(null);
    } catch (err) {
      console.log("Error al eliminar cliente:", err);
    } finally {
      setShowDeleteModal(false);
      setClienteAEliminar(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setClienteAEliminar(null);
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
              render: (c: ClienteResponse) => (
                <span className="text-sm font-medium text-gray-800">
                  {c.nombre}
                </span>
              ),
            },
            {
              key: "contacto",
              label: "Contacto",
              render: (c: ClienteResponse) => (
                <span className="text-sm text-gray-800">{c.contacto}</span>
              ),
            },
            {
              key: "direccion",
              label: "Dirección",
              render: (c: ClienteResponse) => (
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
              render: (c: ClienteResponse) => (
                <Badge variant="info">{c.ruta}</Badge>
              ),
            },
            {
              key: "ultimaEntrega",
              label: "Última entrega",
              render: (c: ClienteResponse) => (
                <span className="text-sm text-gray-800">{c.ultimaEntrega}</span>
              ),
            },
            {
              key: "estado",
              label: "Estado",
              render: (c: ClienteResponse) => (
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
              onClick: (c: ClienteResponse) => handleEdit(c.id),
            },
            {
              label: "Eliminar",
              icon: "delete",
              variant: "danger" as const,
              onClick: (c: ClienteResponse) => handleDelete(c),
            },
          ]}
          loading={loading}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Buscar cliente..."
          pagination={{ enabled: true, serverSide: false, defaultPageSize: 10 }}
          emptyMessage="No se encontraron clientes"
        />
      </div>

      {/* Modal de confirmación para eliminar cliente */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cliente"
        message={"¿Está seguro que desea eliminar este cliente?"}
        itemName={clienteAEliminar?.nombre || ""}
      />
    </div>
  );
};

export default ClientesPage;
