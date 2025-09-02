"use client";
import React, { useState, useMemo } from "react";
import Badge from "@/components/ui/Badge";
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

interface ClientListProps {
  clients: Client[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const estadoColor = {
  activo: "bg-green-100 text-green-700 border-green-400",
  inactivo: "bg-gray-100 text-gray-500 border-gray-300",
};

const ClientList: React.FC<ClientListProps> = ({
  clients,
  onEdit,
  onDelete,
}) => {
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("Todas");

  // Obtener rutas únicas para el filtro
  const rutas = useMemo(() => {
    const unique = Array.from(new Set(clients.map((c) => c.ruta)));
    return unique;
  }, [clients]);

  // Filtrar clientes por búsqueda y ruta
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.nombre.toLowerCase().includes(search.toLowerCase()) ||
        client.contacto.toLowerCase().includes(search.toLowerCase()) ||
        client.direccion.toLowerCase().includes(search.toLowerCase());
      const matchesRoute =
        selectedRoute === "Todas" || client.ruta === selectedRoute;
      return matchesSearch && matchesRoute;
    });
  }, [clients, search, selectedRoute]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MaterialIcon name="group" className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Clientes registrados
          </h2>
        </div>
        <Badge variant={filteredClients.length > 0 ? "info" : "success"}>
          {filteredClients.length} cliente(s)
        </Badge>
      </div>
      <p className="text-gray-500 mb-4">Gestión de clientes y sus datos</p>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-64 text-gray-500"
        />
        <select
          className="border px-3 py-2 rounded-md text-gray-500"
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
        >
          <option value="Todas">Todas las rutas</option>
          {rutas.map((ruta) => (
            <option key={ruta} value={ruta}>
              {ruta}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dirección
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última entrega
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
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {client.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {client.contacto}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {client.direccion.length > 25
                    ? client.direccion.slice(0, 25) + "..."
                    : client.direccion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="info">{client.ruta}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {client.ultimaEntrega}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={client.estado === "activo" ? "success" : "warning"}
                  >
                    {client.estado === "activo" ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                  <button
                    title="Editar"
                    onClick={() => onEdit?.(client.id)}
                    className="p-2 rounded hover:bg-gray-200"
                  >
                    <MaterialIcon name="edit" className="text-blue-500" />
                  </button>
                  <button
                    title="Eliminar"
                    onClick={() => onDelete?.(client.id)}
                    className="p-2 rounded hover:bg-red-100"
                  >
                    <MaterialIcon name="delete" className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredClients.length === 0 && (
        <div className="text-center text-gray-500 py-6">
          No se encontraron clientes.
        </div>
      )}
    </div>
  );
};

export default ClientList;
