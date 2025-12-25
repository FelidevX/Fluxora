"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Importación dinámica para evitar problemas de SSR
const MapaRuta = dynamic(() => import("./MapaRuta"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-200 rounded-lg h-64 sm:h-80 md:h-96 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm">Cargando mapa...</p>
      </div>
    </div>
  ),
});

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

interface RutaData {
  orderedClients: Cliente[];
  osrmRoute: string;
  origen?: Origen;
}

interface Origen {
  latitud: number;
  longitud: number;
}

interface PantallaRutaProps {
  rutaData: RutaData;
}

export default function PantallaRuta({ rutaData }: PantallaRutaProps) {
  // Función para abrir en Google Maps
  const abrirEnGoogleMaps = () => {
    if (rutaData.orderedClients.length === 0) return;

    // Construir waypoints para Google Maps
    const origen = rutaData.origen || {
      latitud: -36.612523,
      longitud: -72.082921,
    };
    const destinos = rutaData.orderedClients
      .map((c) => `${c.latitud},${c.longitud}`)
      .join("/");

    // URL de Google Maps con múltiples destinos
    const url = `https://www.google.com/maps/dir/${origen.latitud},${origen.longitud}/${destinos}/${origen.latitud},${origen.longitud}`;

    window.open(url, "_blank");
  };

  // Función para abrir en Waze
  const abrirEnWaze = () => {
    if (rutaData.orderedClients.length === 0) return;

    // Waze solo permite navegar a un destino a la vez, así que abrimos el primero
    const primerCliente = rutaData.orderedClients[0];
    const url = `https://waze.com/ul?ll=${primerCliente.latitud},${primerCliente.longitud}&navigate=yes`;

    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg p-4 shadow-sm"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Ruta del Día
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base text-gray-600">
              {rutaData.orderedClients.length}{" "}
              {rutaData.orderedClients.length === 1 ? "cliente" : "clientes"}{" "}
              programados
            </p>
            <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              Optimizada
            </div>
          </div>
        </motion.div>

        {/* Mapa */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <MapaRuta
            clientes={rutaData.orderedClients}
            rutaGeometry={JSON.parse(rutaData.osrmRoute)}
            origen={rutaData.origen}
          />

          {/* Botones para abrir en apps de navegación */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2 text-center">
              Abrir ruta en:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={abrirEnGoogleMaps}
                disabled={rutaData.orderedClients.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 active:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="text-sm">Google Maps</span>
              </button>

              <button
                onClick={abrirEnWaze}
                disabled={rutaData.orderedClients.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-cyan-500 text-cyan-600 rounded-lg font-medium hover:bg-cyan-50 active:bg-cyan-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                <span className="text-sm">Waze</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Lista de clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
              Orden de Visitas
            </h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {rutaData.orderedClients.map((cliente, index) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                className="bg-gray-50 hover:bg-gray-100 active:bg-gray-200 p-3 sm:p-4 rounded-lg border transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Número de orden */}
                  <div
                    className={`
                    flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold
                    ${
                      index === 0
                        ? "bg-green-500"
                        : index === rutaData.orderedClients.length - 1
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }
                  `}
                  >
                    {index + 1}
                  </div>

                  {/* Información del cliente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {cliente.nombre}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                          {cliente.direccion}
                        </p>
                      </div>

                      {/* Estado/indicador */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {index === 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            Inicio
                          </span>
                        )}
                        {index === rutaData.orderedClients.length - 1 && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                            Final
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
