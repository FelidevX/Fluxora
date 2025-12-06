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
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const ClientesPage = () => {
  const {
    clientes,
    loading,
    error,
    cargarClientes,
    crearCliente,
    editarCliente,
    clearError,
    eliminarCliente,
  } = useClientes();

  // Hook para notificaciones toast
  const { toasts, removeToast, success, error: showError, warning, info } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"clientes" | "repartos">(
    "clientes"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] =
    useState<ClienteResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<ClienteResponse | null>(
    null
  );

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientes();
    console.log("Clientes cargados:", clientes);
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
      success(
        "El cliente ha sido registrado exitosamente",
        "¡Cliente Registrado!"
      );
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al registrar el cliente",
        "Error al Registrar Cliente"
      );
    }
  };

  const handleEdit = (id: number) => {
    const cliente = clientes.find((c) => c.id === id);
    if (cliente) {
      setClienteAEditar(cliente);
      setShowEditModal(true);
    }
  };

  const handleClientEditSubmit = async (data: any) => {
    if (!clienteAEditar) return;

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

      await editarCliente(clienteAEditar.id, clientData);
      success(
        "El cliente ha sido actualizado exitosamente",
        "¡Cliente Actualizado!"
      );
      setShowEditModal(false);
      setClienteAEditar(null);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al actualizar el cliente",
        "Error al Actualizar Cliente"
      );
    }
  }; const handleDelete = (cliente: ClienteResponse) => {
    setClienteAEliminar(cliente);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteAEliminar) return;
    try {
      await eliminarCliente(clienteAEliminar.id);
      success(
        "El cliente ha sido eliminado correctamente",
        "Cliente Eliminado"
      );
      setShowDeleteModal(false);
      setClienteAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al eliminar el cliente",
        "Error al Eliminar Cliente"
      );
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
    <ProtectedRoute requiredModule="clientes">
    <div className="p-4 md:p-6 max-w-full overflow-x-hidden min-h-screen bg-gray-50 mt-12 md:mt-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Gestión de clientes
          </h1>
          <p className="text-sm text-gray-600">
            {" Gestiona clienes y rutas de reparto "}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <span className="mr-2">Nuevo Cliente</span>
            <MaterialIcon name="add" />
          </button>
        </div>
      </div>

      {/* Panel de formulario similar a Materias: aparece al hacer click en Nuevo Cliente */}
      {showForm && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md text-black mb-6">
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
                <span className="text-xs md:text-sm font-medium text-gray-800">
                  {c.nombre}
                </span>
              ),
            },
            {
              key: "contacto",
              label: "Contacto",
              render: (c: ClienteResponse) => (
                <span className="text-xs md:text-sm text-gray-800">{c.contacto}</span>
              ),
            },
            {
              key: "direccion",
              label: "Dirección",
              render: (c: ClienteResponse) => (
                <span className="text-xs md:text-sm text-gray-800">
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
              key: "precioCorriente",
              label: "Precio Corriente",
              render: (c: ClienteResponse) => (
                <span className="text-xs md:text-sm font-semibold text-gray-700">
                  ${c.precioCorriente?.toFixed(2) || "0.00"}
                </span>
              ),
            },
            {
              key: "precioEspecial",
              label: "Precio Especial",
              render: (c: ClienteResponse) => (
                <span className="text-xs md:text-sm font-semibold text-gray-700">
                  ${c.precioEspecial?.toFixed(2) || "0.00"}
                </span>
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

      {/* Modal de edición de cliente */}
      {showEditModal && clienteAEditar && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex text-black items-center justify-center z-50 p-4"
          onClick={() => {
            setShowEditModal(false);
            setClienteAEditar(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Editar Cliente
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setClienteAEditar(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MaterialIcon name="close" className="text-2xl" />
              </button>
            </div>
            <div className="p-4 md:p-6">
              <ClientForm
                onSubmit={(data) => {
                  handleClientEditSubmit(data);
                }}
                initialData={{
                  businessName: clienteAEditar.nombreNegocio || "",
                  contactPerson: clienteAEditar.nombre || "",
                  phone: clienteAEditar.contacto || "",
                  email: clienteAEditar.email || "",
                  address: clienteAEditar.direccion || "",
                  latitude: clienteAEditar.latitud,
                  longitude: clienteAEditar.longitud,
                  precioCorriente: clienteAEditar.precioCorriente || 1200,
                  precioEspecial: clienteAEditar.precioEspecial || 1500,
                }}
                title="Actualizar información del cliente"
                submitButtonText="Guardar cambios"
              />
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
    </ProtectedRoute>
  );
};

export default ClientesPage;
