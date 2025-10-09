"use client";

import { useState, useEffect } from "react";
import { EntregaConductor } from "@/interfaces/entregas/entregas";

export function HistorialEntregas() {
  const [entregas, setEntregas] = useState<EntregaConductor[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroConductor, setFiltroConductor] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchHistorialEntregas = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/historial`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEntregas(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener historial de entregas:", error);
      setEntregas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorialEntregas();
  }, []);

  const entregasFiltradas = entregas.filter((entrega) => {
    const cumpleFecha =
      !filtroFecha ||
      (entrega.entrega.hora_entregada &&
        new Date(entrega.entrega.hora_entregada).toDateString() ===
          new Date(filtroFecha).toDateString());

    const cumpleConductor =
      !filtroConductor ||
      entrega.ruta.id_driver.toString().includes(filtroConductor);

    return cumpleFecha && cumpleConductor;
  });

  const totalPages = Math.ceil(entregasFiltradas.length / itemsPerPage);
  const entregasPaginadas = entregasFiltradas.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Historial de pedidos
        </h2>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Conductor
            </label>
            <input
              type="text"
              placeholder="Filtrar por conductor..."
              value={filtroConductor}
              onChange={(e) => setFiltroConductor(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroFecha("");
                setFiltroConductor("");
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {entregasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay entregas registradas
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron entregas que coincidan con los filtros aplicados.
          </p>
        </div>
      ) : (
        <>
          {/* Tabla de Entregas */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Entregas Realizadas ({entregasFiltradas.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conductor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pan Corriente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pan Especial
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entregasPaginadas.map((item, index) => (
                      <tr
                        key={item.entrega.id || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.cliente?.nombreNegocio ||
                                "Cliente no encontrado"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.cliente?.nombre}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.ruta.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {item.ruta.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.ruta.id_driver}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.entrega.hora_entregada
                            ? new Date(
                                item.entrega.hora_entregada
                              ).toLocaleString()
                            : "No registrada"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.entrega.corriente_entregado} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.entrega.especial_entregado} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Mostrando {(page - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(page * itemsPerPage, entregasFiltradas.length)} de{" "}
                    {entregasFiltradas.length} entregas
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
