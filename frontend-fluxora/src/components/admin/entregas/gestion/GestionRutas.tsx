"use client";

import { useState, useEffect } from "react";
import { RutaActiva } from "@/interfaces/entregas/entregas";
import { Driver } from "@/interfaces/entregas/driver";
import { TarjetaRuta } from "@/components/admin/entregas/gestion/components/TarjetaRuta";
import { CrearRutaModal } from "@/components/admin/entregas/gestion/components/CrearRutaModal";
import { AsignarDriverModal } from "@/components/admin/entregas/gestion/components/AsignarDriverModal";
import { ProgramacionEntregasModal } from "@/components/admin/entregas/gestion/components/ProgramacionEntregasModal";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import Alert from "@/components/ui/alert";

// Interfaces para productos y lotes
interface Lote {
  id: number;
  productoId: number;
  cantidadProducida: number;
  stockActual: number;
  costoProduccionTotal: number;
  costoUnitario: number;
  fechaProduccion: string;
  fechaVencimiento: string;
  estado: string;
}

interface ProductoConLotes {
  id: number;
  nombre: string;
  categoria: string;
  tipoProducto: string;
  precio: number;
  lotes: Lote[];
  stockTotal: number;
}

interface ProductoProgramado {
  id_producto: number;
  id_lote: number;
  nombreProducto: string;
  categoria: string;
  cantidad_kg: number;
}

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
  const { toasts, removeToast, success, error, warning, info } = useToast();

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

  // Estados para productos con lotes
  const [productosConLotes, setProductosConLotes] = useState<ProductoConLotes[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

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
    } catch (err) {
      console.error("Error al obtener drivers:", err);
      error("No se pudieron cargar los conductores", "Error de Conexión");
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Función para obtener productos con sus lotes
  const fetchProductosConLotes = async () => {
    setLoadingProductos(true);
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      // Primero obtenemos todos los productos
      const productosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/productos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!productosResponse.ok) {
        throw new Error(`Error al obtener productos: ${productosResponse.status}`);
      }

      const productos = await productosResponse.json();
      console.log("productos:", productos);

      // Ahora obtenemos los lotes de cada producto
      const productosConLotesData: ProductoConLotes[] = await Promise.all(
        productos.map(async (producto: any) => {
          try {
            const lotesResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/productos/${producto.id}/lotes`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            let lotes: Lote[] = [];
            if (lotesResponse.ok) {
              const lotesData = await lotesResponse.json();
              // Filtrar solo lotes disponibles con stock
              lotes = lotesData.filter(
                (lote: Lote) => lote.estado === "disponible" && lote.stockActual > 0
              );
            }

            console.log(`Lotes del producto ${producto.id}:`, lotes);

            const stockTotal = lotes.reduce((sum, lote) => sum + lote.stockActual, 0);

            return {
              id: producto.id,
              nombre: producto.nombre,
              categoria: producto.categoria,
              tipoProducto: producto.tipoProducto,
              precio: producto.precio,
              lotes: lotes,
              stockTotal: stockTotal,
            };
          } catch (err) {
            console.error(`Error al obtener lotes del producto ${producto.id}:`, err);
            return {
              id: producto.id,
              nombre: producto.nombre,
              categoria: producto.categoria,
              tipoProducto: producto.tipoProducto,
              precio: producto.precio,
              lotes: [],
              stockTotal: 0,
            };
          }
        })
      );

      // Filtrar productos que tengan stock disponible
      const productosDisponibles = productosConLotesData.filter(
        (p) => p.stockTotal > 0
      );

      setProductosConLotes(productosDisponibles);
    } catch (err) {
      console.error("Error al obtener productos con lotes:", err);
      error("No se pudieron cargar los productos disponibles", "Error al Cargar Productos");
      setProductosConLotes([]);
    } finally {
      setLoadingProductos(false);
    }
  };

  // Cargar drivers y productos al montar el componente
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
    } catch (err) {
      console.error("Error al crear ruta:", err);
      error(
        err instanceof Error ? err.message : "Error desconocido al crear la ruta",
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
        success("El conductor ha sido asignado a la ruta correctamente", "¡Conductor Asignado!");
        setShowAsignarModal(false);
        setRutaSeleccionada(null);
        setDriverId("");
        onRefresh();
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error al asignar driver:", err);
      error(
        err instanceof Error ? err.message : "Error desconocido al asignar conductor",
        "Error al Asignar Conductor"
      );
    }
  };

  // Función para abrir modal de programación
  const handleProgramarEntregas = () => {
    setRutaParaProgramar(null); // Sin ruta específica
    const today = new Date().toISOString().split("T")[0];
    setFechaProgramacion(today);
    fetchProductosConLotes(); // Cargar productos cuando se abre el modal
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
    } catch (err) {
      console.error("Error al obtener rutas programadas:", err);
      error(
        err instanceof Error ? err.message : "Error desconocido al cargar las rutas",
        "Error al Cargar Rutas Programadas"
      );
    } finally {
      setLoadingProgramacion(false);
    }
  };

  // Función para actualizar productos de un cliente específico
  const handleActualizarProductos = async (
    idRuta: number,
    idCliente: number,
    productos: ProductoProgramado[]
  ) => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }


      console.log("Actualizando productos para cliente:", {
        idRuta,
        idCliente,
        productos,
        fechaProgramacion
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/programar-entrega`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idRuta,
            idCliente,
            fechaProgramacion: fechaProgramacion,
            productos,
          }),
        }
      );

      if (response.ok) {
        // Refrescar los datos
        await fetchRutasProgramadas(fechaProgramacion);
        await fetchProductosConLotes(); // Actualizar stock disponible
        success("Los productos han sido actualizados correctamente", "Productos Actualizados");
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error al actualizar productos:", err);
      error(
        err instanceof Error ? err.message : "Error desconocido al actualizar productos",
        "Error al Actualizar Productos"
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
        productosConLotes={productosConLotes}
        loadingProductos={loadingProductos}
        onActualizarProductos={handleActualizarProductos}
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
