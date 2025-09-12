import React from "react";
import Button from "../../ui/Button";
import { Rol } from "@/types/rol";

interface UsuarioModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: {
    nombre: string;
    email: string;
    password?: string;
    rolId: string;
  }) => void;
  roles: Rol[];
  initialValues?: {
    nombre: string;
    email: string;
    password?: string;
    rolId: string;
  };
  isEdit?: boolean;
}

const UsuarioModal: React.FC<UsuarioModalProps> = ({
  open,
  onClose,
  onSubmit,
  roles,
  initialValues = { nombre: "", email: "", password: "", rolId: "" },
  isEdit = false,
}) => {
  const [form, setForm] = React.useState(initialValues);

  React.useEffect(() => {
    if (open) {
      setForm(initialValues);
    }
  }, [open, initialValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre:
            </label>
            <input
              name="nombre"
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-gray-500"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email:
            </label>
            <input
              name="email"
              type="email"
              className="w-full px-3 py-2 border rounded-lg text-gray-500"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña:
              </label>
              <input
                name="password"
                type="password"
                className="w-full px-3 py-2 border rounded-lg text-gray-500"
                value={form.password || ""}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol:
            </label>
            <select
              name="rolId"
              className="w-full px-3 py-2 border rounded-lg text-gray-500"
              value={form.rolId}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un rol</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.rol}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="success">
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioModal;
