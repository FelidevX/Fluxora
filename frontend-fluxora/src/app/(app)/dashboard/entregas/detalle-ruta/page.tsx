"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { RutaActiva, ClienteDTO } from "@/interfaces/entregas/entregas";

// Importación dinámica del mapa para evitar SSR
const MapaRuta = dynamic(() => import("@/components/driver/ruta/MapaRuta"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm">Cargando mapa...</p>
      </div>
    </div>
  ),
});

interface RutaDetalleData {
  ruta: RutaActiva;
  orderedClients: ClienteDTO[];
  osrmRoute: string;
  origen: {
    latitud: number;
    longitud: number;
  };
  driver?: {
    id: number;
    nombre: string;
  };
}

function DetalleRutaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rutaId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [rutaData, setRutaData] = useState<RutaDetalleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rutaId) {
      setError("No se proporcionó ID de ruta");
      setLoading(false);
      return;
    }

    fetchRutaDetalle();
  }, [rutaId]);

  const fetchRutaDetalle = async () => {
    setLoading(true);
    setError(null);

    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      // Obtener todas las rutas activas y filtrar por ID
      const rutasResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-activas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!rutasResponse.ok) {
        throw new Error("Error al cargar las rutas activas");
      }

      const rutasActivas = await rutasResponse.json();
      const ruta: RutaActiva | undefined = rutasActivas.find(
        (r: RutaActiva) => r.id === parseInt(rutaId!)
      );

      if (!ruta) {
        throw new Error("Ruta no encontrada");
      }

      // Obtener clientes de la ruta usando el endpoint correcto
      const clientesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/rutas/clientes/${rutaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!clientesResponse.ok) {
        throw new Error("Error al cargar los clientes de la ruta");
      }

      const clientes: ClienteDTO[] = await clientesResponse.json();

      // Obtener información del driver si está asignado
      let driver = null;
      if (ruta.id_driver) {
        try {
          const driverResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/usuarios/${ruta.id_driver}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (driverResponse.ok) {
            driver = await driverResponse.json();
          }
        } catch (err) {
          console.warn("No se pudo cargar la información del driver");
        }
      }

      // Calcular ruta optimizada con OSRM si hay clientes
      let osrmRoute = null;
      const origen = {
        latitud: -36.612523,
        longitud: -72.082921,
      };

      if (clientes.length > 0) {
        try {
          // Construir coordenadas para OSRM
          const coordinates = [
            `${origen.longitud},${origen.latitud}`,
            ...clientes.map((c) => `${c.longitud},${c.latitud}`),
            `${origen.longitud},${origen.latitud}`, // Volver al origen
          ].join(";");

          const osrmResponse = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
          );

          if (osrmResponse.ok) {
            const osrmData = await osrmResponse.json();
            osrmRoute = JSON.stringify(osrmData);
          }
        } catch (err) {
          console.warn("No se pudo calcular la ruta optimizada");
        }
      }

      setRutaData({
        ruta,
        orderedClients: clientes,
        osrmRoute: osrmRoute || JSON.stringify({ routes: [] }),
        origen,
        driver,
      });
    } catch (err) {
      console.error("Error al cargar detalle de ruta:", err);
      setError(err instanceof Error ? err.message : "Error al cargar la ruta");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la ruta...</p>
        </div>
      </div>
    );
  }

  if (error || !rutaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <MaterialIcon name="error" className="text-6xl" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar la ruta
          </h2>
          <p className="text-gray-600 mb-4">{error || "Ruta no encontrada"}</p>
          <Link
            href="/dashboard/entregas/rutas"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MaterialIcon name="arrow_back" className="mr-2" />
            Volver a Rutas
          </Link>
        </div>
      </div>
    );
  }

  const { ruta, orderedClients, osrmRoute, origen, driver } = rutaData;

  // Calcular estadísticas
  const distanciaTotal =
    JSON.parse(osrmRoute)?.routes?.[0]?.distance / 1000 || 0;
  const tiempoEstimado = JSON.parse(osrmRoute)?.routes?.[0]?.duration / 60 || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header con breadcrumb */}
        <div className="mb-2 sm:mb-4">
          <Link
            href="/dashboard/entregas/rutas"
            className="text-blue-600 hover:text-blue-800 flex items-center font-bold cursor-pointer text-sm sm:text-base"
          >
            <MaterialIcon name="arrow_back" className="mr-1" />
            <span className="hidden sm:inline">Volver a Gestión de Rutas</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>

        {/* Título y estadísticas principales */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">
                {ruta.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MaterialIcon name="location_on" className="text-blue-600 text-base sm:text-lg" />
                  <span>{orderedClients.length} clientes</span>
                </div>
                {driver && (
                  <div className="flex items-center gap-1">
                    <MaterialIcon name="person" className="text-green-600 text-base sm:text-lg" />
                    <span className="truncate max-w-[150px] sm:max-w-none">{driver.nombre}</span>
                  </div>
                )}
                {!driver && (
                  <div className="flex items-center gap-1">
                    <MaterialIcon
                      name="person_off"
                      className="text-orange-600 text-base sm:text-lg"
                    />
                    <span>Sin driver</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="bg-blue-100 text-blue-800 px-3 sm:px-4 py-2 rounded-lg text-center flex-1 sm:flex-initial">
                <div className="text-xl sm:text-2xl font-bold">{ruta.progreso || 0}%</div>
                <div className="text-xs">Progreso</div>
              </div>
              <div className="bg-green-100 text-green-800 px-3 sm:px-4 py-2 rounded-lg text-center flex-1 sm:flex-initial">
                <div className="text-xl sm:text-2xl font-bold">
                  {ruta.entregasCompletadas || 0}/{ruta.totalClientes || 0}
                </div>
                <div className="text-xs">Entregas</div>
              </div>
            </div>
          </div>

          {/* Estadísticas de ruta */}
          {distanciaTotal > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <MaterialIcon
                    name="route"
                    className="text-purple-600 text-xl sm:text-2xl"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Distancia Total</div>
                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                    {distanciaTotal.toFixed(1)} km
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <MaterialIcon
                    name="schedule"
                    className="text-orange-600 text-xl sm:text-2xl"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Tiempo Estimado</div>
                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                    {Math.round(tiempoEstimado)} min
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2 md:col-span-1">
                <div className="bg-cyan-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <MaterialIcon
                    name="speed"
                    className="text-cyan-600 text-xl sm:text-2xl"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Velocidad Media</div>
                  <div className="text-base sm:text-lg font-semibold text-gray-900">
                    {tiempoEstimado > 0
                      ? (distanciaTotal / (tiempoEstimado / 60)).toFixed(1)
                      : "0"}{" "}
                    km/h
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MaterialIcon name="map" className="text-blue-600" />
              Visualización de Ruta
            </h2>
          </div>
          <div className="p-3 sm:p-4">
            {orderedClients.length > 0 ? (
              <MapaRuta
                clientes={orderedClients}
                rutaGeometry={JSON.parse(osrmRoute)}
                origen={origen}
              />
            ) : (
              <div className="bg-gray-100 rounded-lg h-64 sm:h-80 md:h-96 flex items-center justify-center">
                <div className="text-center text-gray-500 px-4">
                  <MaterialIcon name="location_off" className="text-4xl sm:text-6xl mb-2" />
                  <p className="text-sm sm:text-base">No hay clientes asignados a esta ruta</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de clientes */}
        {orderedClients.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MaterialIcon name="list" className="text-blue-600" />
                <span className="hidden sm:inline">Orden de Visitas ({orderedClients.length})</span>
                <span className="sm:hidden">Visitas ({orderedClients.length})</span>
              </h2>
            </div>

            <div className="space-y-3">
              {orderedClients.map((cliente, index) => (
                <div
                  key={cliente.id}
                  className="bg-gray-50 hover:bg-gray-100 p-3 sm:p-4 rounded-lg border border-gray-200 transition-all"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Número de orden */}
                    <div
                      className={`
                      flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md
                      ${
                        index === 0
                          ? "bg-green-500"
                          : index === orderedClients.length - 1
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }
                    `}
                    >
                      {index + 1}
                    </div>

                    {/* Información del cliente */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 break-words">
                            {cliente.nombreNegocio || cliente.nombre}
                          </h3>
                          <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-start gap-2">
                              <MaterialIcon
                                name="location_on"
                                className="text-gray-400 text-sm sm:text-base flex-shrink-0 mt-0.5"
                              />
                              <span className="break-words">{cliente.direccion}</span>
                            </div>
                            {cliente.contacto && (
                              <div className="flex items-center gap-2">
                                <MaterialIcon
                                  name="phone"
                                  className="text-gray-400 text-sm sm:text-base flex-shrink-0"
                                />
                                <span className="break-all">{cliente.contacto}</span>
                              </div>
                            )}
                            {cliente.email && (
                              <div className="flex items-start gap-2">
                                <MaterialIcon
                                  name="email"
                                  className="text-gray-400 text-sm sm:text-base flex-shrink-0 mt-0.5"
                                />
                                <span className="break-all">{cliente.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Badges de estado */}
                        <div className="flex flex-row sm:flex-col gap-2">
                          {index === 0 && (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                              <MaterialIcon
                                name="play_arrow"
                                className="text-xs sm:text-sm mr-1"
                              />
                              Inicio
                            </span>
                          )}
                          {index === orderedClients.length - 1 && (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                              <MaterialIcon
                                name="flag"
                                className="text-xs sm:text-sm mr-1"
                              />
                              Final
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MaterialIcon name="info" className="text-blue-600" />
            Información Adicional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-gray-600">ID de Ruta:</span>
              <span className="ml-2 font-medium text-gray-900">#{ruta.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className="ml-2">
                {ruta.progreso === 100 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completada
                  </span>
                ) : ruta.progreso > 0 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    En Progreso
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Pendiente
                  </span>
                )}
              </span>
            </div>
            {driver && (
              <>
                <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-gray-600">Driver Asignado:</span>
                  <span className="ml-2 font-medium text-gray-900 break-words">
                    {driver.nombre}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">ID Driver:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    #{driver.id}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetalleRutaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <DetalleRutaContent />
    </Suspense>
  );
}
