'use client'

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSelectorProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialPosition?: [number, number];
}

//Componente para manejar clicks en el mmapa
function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, address?: string) => void }) {
    const [position, setPosition] = useState<[number, number] | null>(null);

    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onLocationSelect(lat, lng);

            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data.display_name) {
                    onLocationSelect(lat, lng, data.display_name);
                }
            })
            .catch(error => {
                console.error('Error al obtener la dirección:', error);
            });
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}

const MapSelector: React.FC<MapSelectorProps> = ({
    onLocationSelect,
    initialPosition
}) => {
    const [center, setCenter] = useState <[number, number]>(
        initialPosition || [-36.60664, -72.10344] // Chillán, Chile
    );

    useEffect(() => {
        if (initialPosition) {
            setCenter(initialPosition);
        }
    }, [initialPosition]);

    return (
        <div className='h-64 w-full'>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className='z-0'
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {initialPosition && <Marker position={initialPosition} />}

                <LocationMarker onLocationSelect={onLocationSelect} />
            </MapContainer>

            <div className='text-xs text-gray-500 mt-2 p-2 bg-gray-50'>
                💡 Haz clic en el mapa para seleccionar una ubicación
            </div>
        </div>
    );
};

export default MapSelector;
