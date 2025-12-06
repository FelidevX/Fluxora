"use client";

import { useState, useEffect } from "react";
import { RutaActiva } from "@/interfaces/entregas/entregas";
import { Driver } from "@/interfaces/entregas/driver";
import { TarjetaRuta } from "@/components/admin/entregas/gestion/components/TarjetaRuta";
import { CrearRutaModal } from "@/components/admin/entregas/gestion/components/CrearRutaModal";
import { AsignarDriverModal } from "@/components/admin/entregas/gestion/components/AsignarDriverModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface GestionRutasProps {
  rutas: RutaActiva[];
  loading: boolean;
  onRefresh: () => void;
  onVerDetalle: (ruta: RutaActiva) => void;
}

export function GestionRutas({
  rutas,
  loading,
  onRefresh,
  onVerDetalle,
}: GestionRutasProps) {
  // Hook para notificaciones toast
  const { toasts, removeToast, success, error: showError, warning } = useToast();

  // Estados para el modal de creación
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [nuevaRuta, setNuevaRuta] = useState({
    nombre: "",
    descripcion: "",
    origen_coordenada: "-36.612523, -72.082921",
    id_driver: "",
  });

  // Estados para asignar driver
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaActiva | null>(
    null
  );
  const [driverId, setDriverId] = useState("");

  // Estados para eliminar ruta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rutaAEliminar, setRutaAEliminar] = useState<RutaActiva | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Función para obtener todos los drivers
  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios?rol=DRIVER`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener drivers:", error);
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Cargar drivers al montar el componente
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Función para actualizar la ruta a crear
  const crearNuevaRuta = (rutaData: {
    nombre: string;
    descripcion: string;
    origen_coordenada: string;
    id_driver: string;
  }) => {
    if (!rutaData.nombre.trim()) {
      warning("El nombre de la ruta es obligatorio", "Campo Requerido");
      return;
    }

    setLoadingCreate(true);
    crearRutaReal(rutaData);
  };

  // Función real para crear nueva ruta
  const crearRutaReal = async (rutaData: {
    nombre: string;
    descripcion: string;
    origen_coordenada: string;
    id_driver: string;
  }) => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/crear-ruta`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: rutaData.nombre,
            descripcion: rutaData.descripcion,
            origen_coordenada: rutaData.origen_coordenada,
            id_driver: rutaData.id_driver ? parseInt(rutaData.id_driver) : null,
          }),
        }
      );

      if (response.ok) {
        success("La ruta ha sido creada exitosamente", "¡Ruta Creada!");
        setShowCrearModal(false);
        setNuevaRuta({
          nombre: "",
          descripcion: "",
          origen_coordenada: "-36.612523, -72.082921",
          id_driver: "",
        });
        onRefresh();
      } else {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error("Error al crear ruta:", error);
      showError(
        error instanceof Error ? error.message : "Error desconocido al crear la ruta",
        "Error al Crear Ruta"
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  // Función para abrir modal de asignar driver
  const abrirModalAsignar = (ruta: RutaActiva) => {
    setRutaSeleccionada(ruta);
    setDriverId(ruta.id_driver?.toString() || "");
    setShowAsignarModal(true);
  };

  // Función para asignar driver
  const handleAsignarDriver = async (driverId: string) => {
    if (!rutaSeleccionada || !driverId) return;

    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/asignar-driver`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_ruta: rutaSeleccionada.id,
            id_driver: parseInt(driverId),
          }),
        }
      );

      if (response.ok) {
        success("El driver ha sido asignado exitosamente a la ruta", "¡Driver Asignado!");
        setShowAsignarModal(false);
        setRutaSeleccionada(null);
        setDriverId("");
        onRefresh();
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al asignar driver:", error);
      showError(
        error instanceof Error ? error.message : "Error desconocido al asignar el driver",
        "Error al Asignar Driver"
      );
    }
  };

  // Función para abrir modal de eliminar
  const handleEliminarRuta = (ruta: RutaActiva) => {
    setRutaAEliminar(ruta);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!rutaAEliminar) return;

    setLoadingDelete(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/${rutaAEliminar.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        success("La ruta ha sido eliminada correctamente", "Ruta Eliminada");
        setShowDeleteModal(false);
        setRutaAEliminar(null);
        onRefresh();
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al eliminar ruta:", error);
      showError(
        error instanceof Error ? error.message : "Error desconocido al eliminar la ruta",
        "Error al Eliminar Ruta"
      );
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Gestión de Rutas
          </h2>
          <p className="text-sm text-gray-500">
            Administra las rutas existentes, crea nuevas rutas y asigna drivers
          </p>
        </div>
        <button
          onClick={() => setShowCrearModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto whitespace-nowrap"
        >
          <MaterialIcon name="add" className="mr-2" />
          Crear Nueva Ruta
        </button>
      </div>

      {/* Lista de rutas existentes */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando rutas...</span>
        </div>
      )}

      {!loading && rutas.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay rutas creadas
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando tu primera ruta usando el botón "Crear Nueva Ruta".
          </p>
        </div>
      )}

      {/* Lista de rutas usando TarjetaRuta */}
      {!loading && rutas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rutas.map((ruta) => (
            <TarjetaRuta
              key={ruta.id}
              ruta={ruta}
              onEliminar={handleEliminarRuta}
              onVerDetalle={onVerDetalle}
              onAsignarDriver={abrirModalAsignar}
              drivers={drivers}
            />
          ))}
        </div>
      )}

      {/* Modal CrearRuta */}
      <CrearRutaModal
        isOpen={showCrearModal}
        onClose={() => {
          setShowCrearModal(false);
          setNuevaRuta({
            nombre: "",
            descripcion: "",
            origen_coordenada: "-36.612523, -72.082921",
            id_driver: "",
          });
        }}
        onCrear={crearNuevaRuta}
        drivers={drivers}
        loadingDrivers={loadingDrivers}
        loadingCreate={loadingCreate}
      />

      {/* Modal AsignarDriver */}
      <AsignarDriverModal
        isOpen={showAsignarModal}
        onClose={() => {
          setShowAsignarModal(false);
          setRutaSeleccionada(null);
          setDriverId("");
        }}
        onAsignar={handleAsignarDriver}
        ruta={rutaSeleccionada}
        drivers={drivers}
        loadingDrivers={loadingDrivers}
        driverId={driverId}
        setDriverId={setDriverId}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRutaAEliminar(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Ruta"
        message="¿Estás seguro de que deseas eliminar esta ruta? Se eliminarán todos los clientes asociados y las entregas programadas."
        itemName={rutaAEliminar?.nombre}
        isLoading={loadingDelete}
      />

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}

export default GestionRutas;
