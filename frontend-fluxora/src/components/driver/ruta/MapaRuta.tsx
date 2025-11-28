"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

interface MapaRutaProps {
  clientes: Cliente[];
  rutaGeometry: any;
  origen?: Origen;
}

interface Origen {
  latitud: number;
  longitud: number;
}

export default function MapaRuta({ clientes, rutaGeometry, origen }: MapaRutaProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || clientes.length === 0) return;

    // Limpiar mapa existente
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Crear mapa
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Añadir tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Crear icono para el origen (base/almacén)
    const createOrigenIcon = () => L.divIcon({
      html: `
        <div style="
          background-color: #a3a3a3ff; 
          color: white; 
          border-radius: 50%; 
          width: 36px; 
          height: 36px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          font-size: 16px; 
          border: 3px solid white; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
        ">🏁</div>
      `,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Crear iconos para los clientes
    const createIcon = (number: number, bgColor: string) => L.divIcon({
      html: `
        <div style="
          background-color: ${bgColor}; 
          color: white; 
          border-radius: 50%; 
          width: 32px; 
          height: 32px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          font-size: 14px; 
          border: 3px solid white; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
        ">${number}</div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Añadir marcador del origen
    if (origen) {
      const origenMarker = L.marker([origen.latitud, origen.longitud], { 
        icon: createOrigenIcon() 
      }).addTo(map);

      origenMarker.bindPopup(`
        <div style="
          font-size: 14px; 
          max-width: 250px; 
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
          line-height: 1.5;
        ">
          
          <div style="color: #F97316; font-size: 11px; margin-top: 4px; font-weight: 500;">
            Punto de partida y retorno
          </div>
        </div>
      `, { 
        maxWidth: 280,
        offset: [0, -10]
      });
    }

    // Añadir marcadores de los clientes
    clientes.forEach((cliente, index) => {
      let icon;
      const number = index + 1;
      
      if (index === 0) {
        // Verde para primer cliente
        icon = createIcon(number, '#10B981');
      } else if (index === clientes.length - 1) {
        // Rojo para último cliente
        icon = createIcon(number, '#EF4444');
      } else {
        // Azul para puntos intermedios
        icon = createIcon(number, '#3B82F6');
      }

      const marker = L.marker([cliente.latitud, cliente.longitud], { icon })
        .addTo(map);

      marker.bindPopup(`
        <div style="
          font-size: 14px; 
          max-width: 250px; 
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
          line-height: 1.5;
        ">
          <div style="font-weight: 600; margin-bottom: 4px; color: #1F2937;">
            ${number}. ${cliente.nombre}
          </div>
          <div style="color: #6B7280; font-size: 12px; line-height: 1.4;">
            ${cliente.direccion}
          </div>
        </div>
      `, { 
        maxWidth: 280,
        offset: [0, -10]
      });
    });

    // Dibujar la ruta si existe
    if (rutaGeometry?.routes?.[0]?.geometry?.coordinates) {
      const coordinates = rutaGeometry.routes[0].geometry.coordinates;
      const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      
      L.polyline(latLngs, {
        color: '#3B82F6',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // Ajustar vista para mostrar todos los puntos incluyendo el origen
    const allPoints = [
      ...(origen ? [[origen.latitud, origen.longitud]] : []),
      ...clientes.map(cliente => [cliente.latitud, cliente.longitud])
    ];

    const latLngPoints = allPoints.map(point => L.latLng(point[0], point[1]));
    const bounds = L.latLngBounds(latLngPoints);
    const padding: [number, number] = window.innerWidth < 768 ? [30, 30] : [40, 40];
    map.fitBounds(bounds, { padding });

    // Personalizar controles para móvil
    const zoomControl = map.zoomControl;
    if (zoomControl) {
      zoomControl.remove();
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
    }

    // Agregar evento para mejorar la experiencia en móvil
    map.on('popupopen', () => {
      // Pequño delay para permitir que el popup se renderice completamente
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clientes, rutaGeometry, origen]); // Añadir origen a las dependencias

  return (
    <div className="relative z-0">
      <div 
        ref={mapRef} 
        className="w-full h-80 md:h-96 bg-gray-100 rounded-lg shadow-inner z-0"
        style={{ minHeight: '320px' }}
      />
      
      {/* Leyenda actualizada */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
          <span className="text-gray-700">Base</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          <span className="text-gray-700">Inicio</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
          <span className="text-gray-700">Ruta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
          <span className="text-gray-700">Final</span>
        </div>
      </div>

      {/* Indicador de carga */}
      {clientes.length === 0 && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm">Cargando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
}