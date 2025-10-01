"use client";

import { useState, useEffect } from "react";
import { RutaActiva } from "@/interfaces/entregas/entregas";
import { Driver } from "@/interfaces/entregas/driver";
import { TarjetaRuta } from "@/components/admin/entregas/gestion/components/TarjetaRuta";
import { CrearRutaModal } from "@/components/admin/entregas/gestion/components/CrearRutaModal";
import { AsignarDriverModal } from "@/components/admin/entregas/gestion/components/AsignarDriverModal";
import { ProgramacionEntregasModal } from "@/components/admin/entregas/gestion/components/ProgramacionEntregasModal";

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

  // Estados para programación de entregas por fecha
  const [showProgramacionModal, setShowProgramacionModal] = useState(false);
  const [fechaProgramacion, setFechaProgramacion] = useState("");
  const [rutasProgramadas, setRutasProgramadas] = useState<any[]>([]);
  const [loadingProgramacion, setLoadingProgramacion] = useState(false);
  const [rutaParaProgramar, setRutaParaProgramar] = useState<RutaActiva | null>(
    null
  );

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
      alert("El nombre de la ruta es obligatorio");
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
        alert("Ruta creada exitosamente");
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
      alert(
        "Error al crear ruta: " +
          (error instanceof Error ? error.message : "Error desconocido")
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
        setShowAsignarModal(false);
        setRutaSeleccionada(null);
        setDriverId("");
        onRefresh();
        alert("Driver asignado exitosamente");
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al asignar driver:", error);
      alert(
        "Error al asignar driver: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  // Función para abrir modal de programación
  const handleProgramarEntregas = () => {
    setRutaParaProgramar(null); // Sin ruta específica
    const today = new Date().toISOString().split("T")[0];
    setFechaProgramacion(today);
    setShowProgramacionModal(true);
  };

  // Función para obtener rutas programadas por fecha
  const fetchRutasProgramadas = async (fecha: string) => {
    if (!fecha) return;

    setLoadingProgramacion(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-por-fecha/${fecha}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRutasProgramadas(data);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al obtener rutas programadas:", error);
      alert(
        "Error al obtener rutas programadas: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      setLoadingProgramacion(false);
    }
  };

  // Función para actualizar kg de un cliente específico
  const handleActualizarKg = async (
    idRuta: number,
    idCliente: number,
    kgCorriente: number,
    kgEspecial: number
  ) => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/actualizar-programacion-cliente`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idRuta,
            idCliente,
            fecha: fechaProgramacion,
            kgCorriente,
            kgEspecial,
          }),
        }
      );

      if (response.ok) {
        // Refrescar los datos
        await fetchRutasProgramadas(fechaProgramacion);
        alert("Programación actualizada exitosamente");
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error al actualizar programación:", error);
      alert(
        "Error al actualizar programación: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  };

  // Efecto para cargar datos cuando cambie la fecha
  useEffect(() => {
    if (fechaProgramacion && showProgramacionModal) {
      fetchRutasProgramadas(fechaProgramacion);
    }
  }, [fechaProgramacion, showProgramacionModal]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Gestión de Rutas
          </h2>
          <p className="text-sm text-gray-500">
            Administra las rutas existentes, crea nuevas rutas y asigna drivers
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleProgramarEntregas}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Programar Entregas
          </button>
          <button
            onClick={() => setShowCrearModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear Nueva Ruta
          </button>
        </div>
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
              onVerDetalle={onVerDetalle}
              onAsignarDriver={abrirModalAsignar}
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

      {/* Modal ProgramacionEntregas */}
      <ProgramacionEntregasModal
        isOpen={showProgramacionModal}
        onClose={() => {
          setShowProgramacionModal(false);
          setRutaParaProgramar(null);
          setRutasProgramadas([]);
        }}
        ruta={rutaParaProgramar}
        fechaProgramacion={fechaProgramacion}
        setFechaProgramacion={setFechaProgramacion}
        rutasProgramadas={rutasProgramadas}
        loadingProgramacion={loadingProgramacion}
        onActualizarKg={handleActualizarKg}
      />
    </div>
  );
}

export default GestionRutas;
