"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Usuario } from "@/types/usuario";
import { Rol } from "@/types/rol";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Badge from "@/components/ui/Badge";

const UsuariosManager: React.FC = () => {
  const searchParams = useSearchParams();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    setError("");
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MaterialIcon name="group" className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Usuarios</h2>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {usuario.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {usuario.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="info">{usuario.rol.rol}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="text-center text-gray-500 py-6">
            Cargando usuarios...
          </div>
        )}
        {usuarios.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-6">
            No se encontraron usuarios.
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosManager;
