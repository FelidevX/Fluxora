"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Usuario } from "@/types/usuario";
import { Rol } from "@/types/rol";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Badge from "@/components/ui/Badge";
import Button from "../../ui/Button";
import DataTable from "@/components/ui/DataTable";
import UsuarioModal from "./UsuarioModal";

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);

  const handleDeleteUser = (id: number) => {
    setDeleteUserId(id);
    setShowConfirmModal(true);
  };

  const handleUpdateUser = (id: number) => {
    const usuario = usuarios.find((u) => Number(u.id) === id);
    if (usuario) {
      setUsuarioAEditar(usuario);
      setEditModalOpen(true);
    }
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

  const handleEditSubmit = async (form: {
    nombre: string;
    email: string;
    password?: string;
    rolId: string;
  }) => {
    if (!usuarioAEditar) return;
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios/${usuarioAEditar.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre: form.nombre,
            email: form.email,
            rolId: Number(form.rolId),
            password: form.password,
          }),
        }
      );
      if (!res.ok) {
        let errorMsg = "Error al actualizar usuario";
        if (res.status === 401 || res.status === 403) {
          errorMsg = "Este correo ya está en uso.";
        } else if (res.status === 404) {
          errorMsg = "Usuario no encontrado.";
        } else if (res.status === 400 || res.status === 409) {
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
          } catch {
            // Si la respuesta está vacía, mantener el mensaje por defecto
          }
        }
        setError(errorMsg);
        setEditModalOpen(false);
        setUsuarioAEditar(null);
        return;
      }
      setEditModalOpen(false);
      setUsuarioAEditar(null);
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "Error al actualizar usuario");
      setEditModalOpen(false);
      setUsuarioAEditar(null);
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
            <div className="flex items-center text-gray-600 mt-1 text-sm">
              <MaterialIcon name="calendar_today" className="mr-1 text-lg" />
              <span>{currentDateFormatted}</span>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {!showForm ? (
              <Button
                variant="primary"
                icon="add"
                onClick={() => setShowForm(!showForm)}
                className="w-full sm:w-auto"
              >
                <span className="sm:inline">Nuevo usuario</span>
              </Button>
            ) : (
              <Button
                variant="danger"
                icon="close"
                onClick={() => setShowForm(!showForm)}
                className="w-full sm:w-auto"
              >
                <span className="sm:inline">Cerrar formulario</span>
              </Button>
            )}
          </motion.div>
        </motion.div>

        {/* Formulario con animación */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-700">
                  Nuevo Usuario
                </h2>
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
                  className="w-full px-3 py-2 border rounded-lg text-gray-500"
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
                  className="w-full px-3 py-2 border rounded-lg text-gray-500"
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
                  className="w-full px-3 py-2 border rounded-lg text-gray-500"
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
                  className="w-full px-3 py-2 border rounded-lg text-gray-500"
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
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 mt-2">
                <Button type="submit" variant="success" className="w-full sm:w-auto">
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Mensajes de error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <DataTable
              data={usuarios.filter((u) => {
                return true;
              })}
              columns={[
                {
                  key: "nombre",
                  label: "Nombre",
                  render: (u: any) => (
                    <span className="text-xs md:text-sm font-medium text-gray-900">
                      {u.nombre}
                    </span>
                  ),
                },
                {
                  key: "email",
                  label: "Email",
                  render: (u: any) => (
                    <span className="text-xs md:text-sm text-gray-600">{u.email}</span>
                  ),
                },
                {
                  key: "rol",
                  label: "Rol",
                  render: (u: any) => (
                    <Badge variant="info">{u.rol?.rol}</Badge>
                  ),
                },
              ]}
              actions={[
                {
                  label: "Editar",
                  icon: "edit",
                  variant: "primary",
                  onClick: (u: any) => handleUpdateUser(Number(u.id)),
                },
                {
                  label: "Eliminar",
                  icon: "delete",
                  variant: "danger",
                  onClick: (u: any) => handleDeleteUser(Number(u.id)),
                },
              ]}
              loading={isLoading}
              emptyMessage={
                isLoading
                  ? "Cargando usuarios..."
                  : "No se encontraron usuarios."
              }
              pagination={{ enabled: true, defaultPageSize: 10 }}
            />
          </motion.div>
        </div>

        {/* Modal de confirmación con animación */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowConfirmModal(false);
                setDeleteUserId(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-xl max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="p-4 md:p-5 text-center">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-red-100 mb-3">
                  <MaterialIcon
                    name="delete"
                    className="h-5 w-5 text-red-600"
                  />
                </div>
                <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2">
                  Confirmar eliminación
                </h3>
                <p className="text-gray-600 mb-2 text-xs md:text-sm">
                  ¿Está seguro de que desea eliminar este usuario?
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setDeleteUserId(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button variant="danger" onClick={confirmDeleteUser} className="w-full sm:w-auto">
                    Eliminar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de edición con animación */}
      <AnimatePresence>
        {editModalOpen && usuarioAEditar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
            onClick={() => {
              setEditModalOpen(false);
              setUsuarioAEditar(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <UsuarioModal
                open={editModalOpen}
                onClose={() => {
                  setEditModalOpen(false);
                  setUsuarioAEditar(null);
                }}
                onSubmit={handleEditSubmit}
                roles={roles}
                initialValues={
                  usuarioAEditar
                    ? {
                        nombre: usuarioAEditar.nombre,
                        email: usuarioAEditar.email,
                        password: "",
                        rolId: usuarioAEditar.rol.id.toString(),
                      }
                    : undefined
                }
                isEdit={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsuariosManager;
