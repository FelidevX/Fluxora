'use client'
import React, { useState, useMemo } from 'react';

interface Client {
  id: number;
  nombre: string;
  contacto: string;
  direccion: string;
  ruta: string;
  ultimaEntrega: string;
  estado: 'activo' | 'inactivo';
}

interface ClientListProps {
  clients: Client[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const estadoColor = {
  activo: 'bg-green-100 text-green-700 border-green-400',
  inactivo: 'bg-gray-100 text-gray-500 border-gray-300'
};

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('Todas');

  // Obtener rutas únicas para el filtro
  const rutas = useMemo(() => {
    const unique = Array.from(new Set(clients.map(c => c.ruta)));
    return unique;
  }, [clients]);

  // Filtrar clientes por búsqueda y ruta
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        client.nombre.toLowerCase().includes(search.toLowerCase()) ||
        client.contacto.toLowerCase().includes(search.toLowerCase()) ||
        client.direccion.toLowerCase().includes(search.toLowerCase());
      const matchesRoute =
        selectedRoute === 'Todas' || client.ruta === selectedRoute;
      return matchesSearch && matchesRoute;
    });
  }, [clients, search, selectedRoute]);

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-blue-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Clientes registrados</h2>
      <p className="text-gray-500 mb-4">Gestión de clientes y sus datos</p>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-64"
        />
        <select
          className="border px-3 py-2 rounded-md"
          value={selectedRoute}
          onChange={e => setSelectedRoute(e.target.value)}
        >
          <option value="Todas">Todas las rutas</option>
          {rutas.map(ruta => (
            <option key={ruta} value={ruta}>{ruta}</option>
          ))}
        </select>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left font-semibold text-gray-700">Cliente</th>
            <th className="py-2 text-left font-semibold text-gray-700">Contacto</th>
            <th className="py-2 text-left font-semibold text-gray-700">Dirección</th>
            <th className="py-2 text-left font-semibold text-gray-700">Ruta</th>
            <th className="py-2 text-left font-semibold text-gray-700">Última entrega</th>
            <th className="py-2 text-left font-semibold text-gray-700">Estado</th>
            <th className="py-2 text-left font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map(client => (
            <tr key={client.id} className="border-b hover:bg-gray-50 text-black">
              <td className="py-2">{client.nombre}</td>
              <td className="py-2">{client.contacto}</td>
              <td className="py-2">{client.direccion.length > 25 ? client.direccion.slice(0, 25) + '...' : client.direccion}</td>
              <td className="py-2">
                <span className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 border border-green-400 font-bold">
                  {client.ruta}
                </span>
              </td>
              <td className="py-2">{client.ultimaEntrega}</td>
              <td className="py-2">
                <span className={`inline-block rounded-full px-3 py-1 border font-semibold ${estadoColor[client.estado]}`}>
                  {client.estado === 'activo' ? 'activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-2 flex gap-2">
                <button
                  title="Editar"
                  onClick={() => onEdit?.(client.id)}
                  className="p-2 rounded hover:bg-gray-200"
                >
                  <span role="img" aria-label="edit">✏️</span>
                </button>
                <button
                  title="Eliminar"
                  onClick={() => onDelete?.(client.id)}
                  className="p-2 rounded hover:bg-red-100"
                >
                  <span role="img" aria-label="delete">🗑️</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredClients.length === 0 && (
        <div className="text-center text-gray-500 py-6">No se encontraron clientes.</div>
      )}
    </div>
  );
};

export default ClientList;