"use client";

import dynamic from 'next/dynamic';

// Importación dinámica para evitar problemas de SSR
const MapaRuta = dynamic(() => import('./MapaRuta'), { 
  ssr: false,
  loading: () => (
    <div className="bg-gray-200 rounded-lg h-64 sm:h-80 md:h-96 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm">Cargando mapa...</p>
      </div>
    </div>
  )
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
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Ruta del Día</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base text-gray-600">
              {rutaData.orderedClients.length} {rutaData.orderedClients.length === 1 ? 'cliente' : 'clientes'} programados
            </p>
            <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              Optimizada
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <MapaRuta 
            clientes={rutaData.orderedClients}
            rutaGeometry={JSON.parse(rutaData.osrmRoute)}
            origen={rutaData.origen}
          />
        </div>

        {/* Lista de clientes */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Orden de Visitas</h3>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {rutaData.orderedClients.map((cliente, index) => (
              <div 
                key={cliente.id} 
                className="bg-gray-50 hover:bg-gray-100 active:bg-gray-200 p-3 sm:p-4 rounded-lg border transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Número de orden */}
                  <div className={`
                    flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold
                    ${index === 0 ? 'bg-green-500' : 
                      index === rutaData.orderedClients.length - 1 ? 'bg-red-500' : 'bg-blue-500'}
                  `}>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
