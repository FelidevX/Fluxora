"use client";

import React, { useState, useEffect } from "react";
import ClientForm from "@/components/clientes/ClientForm";
import ClientList from "@/components/clientes/ClientList";
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

  const handleDelete = (id: number) => {
    alert(`Eliminar cliente ${id}`);
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

      <div className="flex gap-6">
        <ClientForm
          onSubmit={handleClientSubmit}
          title="Registrar nuevo cliente"
          submitButtonText="Registrar cliente"
        />

        <div className="flex-1">
          <ClientList
            clients={clients}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {isLoading && (
            <div className="text-center text-gray-500 py-6">
              Cargando clientes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientesPage;
