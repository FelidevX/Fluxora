"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Usuario } from "@/types/usuario";
import { Rol } from "@/types/rol";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Badge from "@/components/ui/Badge";
import Button from "../ui/Button";

const UsuariosManager: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    password: "",
    rolId: "",
  });
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const handleDeleteUser = (id: number) => {
    setDeleteUserId(id);
    setShowConfirmModal(true);
  };

  // Fecha actual formateada
  const currentDateFormatted = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
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

  const fetchRoles = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/roles`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error al cargar roles");
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      setError("Error al cargar roles");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formulario.nombre ||
      !formulario.email ||
      !formulario.password ||
      !formulario.rolId
    )
      return;
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre: formulario.nombre,
            email: formulario.email,
            password: formulario.password,
            rolId: Number(formulario.rolId),
          }),
        }
      );
      if (!res.ok) {
        let errorMsg = "Error al crear usuario";
        if (res.status === 401 || res.status === 403) {
          errorMsg = "No autorizado. Debes iniciar sesión como administrador.";
        } else if (
          res.status === 400 ||
          res.status === 409 ||
          res.status === 404
        ) {
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
          } catch {
            // Si la respuesta está vacía, mantener el mensaje por defecto
          }
        }
        setError(errorMsg);
        return;
      }
      setShowForm(false);
      setFormulario({ nombre: "", email: "", password: "", rolId: "" });
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "Error al crear usuario");
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios/${deleteUserId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        let errorMsg = "Error al eliminar usuario";
        if (res.status === 401 || res.status === 403) {
          errorMsg = "No autorizado para eliminar usuarios.";
        } else if (res.status === 404) {
          errorMsg = "Usuario no encontrado.";
        }
        setError(errorMsg);
        setShowConfirmModal(false);
        setDeleteUserId(null);
        return;
      }
      setShowConfirmModal(false);
      setDeleteUserId(null);
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "Error al eliminar usuario");
      setShowConfirmModal(false);
      setDeleteUserId(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
            <div className="flex items-center text-gray-600 mt-1">
              <MaterialIcon name="calendar_today" className=" mr-1" />
              <span>{currentDateFormatted}</span>
            </div>
          </div>
          <Button
            variant="primary"
            icon="add"
            onClick={() => setShowForm(!showForm)}
          >
            Nuevo usuario
          </Button>
        </div>
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Nuevo Usuario</h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre:
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario({ ...formulario, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email:
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario({ ...formulario, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña:
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formulario.password}
                  onChange={(e) =>
                    setFormulario({ ...formulario, password: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol:
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formulario.rolId}
                  onChange={(e) =>
                    setFormulario({ ...formulario, rolId: e.target.value })
                  }
                  required
                >
                  <option className="text-gray-700" value="">
                    Selecciona un rol
                  </option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.rol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2 mt-2">
                <Button type="submit" variant="success">
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
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
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        title="Editar"
                        className="p-2 rounded hover:bg-gray-200"
                      >
                        <MaterialIcon name="edit" className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(Number(usuario.id))}
                        title="Eliminar"
                        className="p-2 rounded hover:bg-red-100"
                      >
                        <MaterialIcon name="delete" className="text-red-500" />
                      </button>
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
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
              <div className="p-5 text-center">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-red-100 mb-3">
                  <MaterialIcon
                    name="delete"
                    className="h-5 w-5 text-red-600"
                  />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Confirmar eliminación
                </h3>
                <p className="text-gray-600 mb-2 text-sm">
                  ¿Está seguro de que desea eliminar este usuario?
                </p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setDeleteUserId(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button variant="danger" onClick={confirmDeleteUser}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosManager;
