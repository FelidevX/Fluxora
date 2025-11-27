import { useState, useCallback } from 'react';

export interface AddressResult {
    display_name: string;
    lat: string;
    lon: string;
    address: {
        road?: string;
        house_number?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
        postcode?: string;
    };
    place_id: number;
}

export function useAddressSearch() {
    const [results, setResults] = useState<AddressResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchAddress = useCallback(async (query: string, countryCode: string = 'cl') => {
        if (!query || query.trim().length < 3) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Coordenadas aproximadas de Chillán para priorizar resultados
            // Viewbox: [min_lon, min_lat, max_lon, max_lat]
            // Chillán está aproximadamente en: -36.6067° S, -72.1028° W
            const chillanViewbox = '-72.3,-36.8,-71.9,-36.4'; // Área de ~40km alrededor de Chillán

            // Usar Nominatim API de OpenStreetMap
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                new URLSearchParams({
                    q: query,
                    format: 'json',
                    addressdetails: '1',
                    countrycodes: countryCode,
                    limit: '10',
                    // Priorizar calles y direcciones
                    'accept-language': 'es',
                    // Priorizar resultados en Chillán
                    viewbox: chillanViewbox,
                    bounded: '0', // 0 = prioriza pero no limita, 1 = solo resultados dentro del viewbox
                }),
                {
                    headers: {
                        'User-Agent': 'Fluxora-App/1.0', // Personaliza esto con tu app
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Error al buscar direcciones');
            }

            const data: AddressResult[] = await response.json();

            // Deduplicar resultados que están muy cerca (mismo lugar)
            const deduplicatedResults = deduplicateResults(data);

            setResults(deduplicatedResults);
        } catch (err) {
            console.error('Error searching address:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para deduplicar resultados basándose en proximidad de coordenadas Y similitud de dirección
    const deduplicateResults = (results: AddressResult[]): AddressResult[] => {
        const uniqueResults: AddressResult[] = [];
        const DISTANCE_THRESHOLD = 0.0001; // ~11 metros

        for (const result of results) {
            const isDuplicate = uniqueResults.some((existing) => {
                // Comparar coordenadas
                const latDiff = Math.abs(parseFloat(result.lat) - parseFloat(existing.lat));
                const lonDiff = Math.abs(parseFloat(result.lon) - parseFloat(existing.lon));
                const coordsAreSame = latDiff < DISTANCE_THRESHOLD && lonDiff < DISTANCE_THRESHOLD;

                // Comparar dirección (calle y número)
                const resultAddress = `${result.address.road || ''} ${result.address.house_number || ''}`.trim().toLowerCase();
                const existingAddress = `${existing.address.road || ''} ${existing.address.house_number || ''}`.trim().toLowerCase();
                const addressIsSame = resultAddress === existingAddress && resultAddress !== '';

                // Es duplicado si las coordenadas son muy cercanas O si la dirección es exactamente la misma
                return coordsAreSame || addressIsSame;
            });

            if (!isDuplicate) {
                uniqueResults.push(result);
            }
        }

        return uniqueResults;
    };

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return {
        results,
        loading,
        error,
        searchAddress,
        clearResults,
    };
}
