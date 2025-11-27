"use client";

import { useState, useEffect, useRef } from "react";
import { useAddressSearch, AddressResult } from "@/hooks/useAddressSearch";
import MaterialIcon from "@/components/ui/MaterialIcon";

interface AddressSearchInputProps {
    value: string;
    onChange: (address: string) => void;
    onSelectAddress?: (result: AddressResult) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

export default function AddressSearchInput({
    value,
    onChange,
    onSelectAddress,
    placeholder = "Buscar dirección...",
    label = "Dirección",
    required = false,
    disabled = false,
}: AddressSearchInputProps) {
    const { results, loading, searchAddress, clearResults } = useAddressSearch();
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState(value);
    const [userHasTyped, setUserHasTyped] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sincronizar searchQuery con value cuando cambia desde fuera
    useEffect(() => {
        if (value !== searchQuery) {
            setSearchQuery(value);
        }
    }, [value]);

    // Debounce para la búsqueda
    useEffect(() => {
        // Solo buscar si el usuario ha escrito algo
        if (!userHasTyped) return;

        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 3) {
                searchAddress(searchQuery);
                setShowDropdown(true);
            } else {
                clearResults();
                setShowDropdown(false);
            }
        }, 300); // 300ms de debounce

        return () => clearTimeout(timer);
    }, [searchQuery, searchAddress, clearResults, userHasTyped]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchQuery(newValue);
        onChange(newValue);
        setUserHasTyped(true); // Marcar que el usuario ha empezado a escribir
    };

    const handleSelectResult = (result: AddressResult) => {
        const formattedAddress = result.display_name;
        setSearchQuery(formattedAddress);
        onChange(formattedAddress);
        setShowDropdown(false);
        setUserHasTyped(false); // Reset para que no busque automáticamente después de seleccionar

        if (onSelectAddress) {
            onSelectAddress(result);
        }
    };

    const formatAddressPreview = (result: AddressResult) => {
        const { address } = result;
        const parts = [];

        // Construir dirección principal con más detalles
        if (address.road) {
            parts.push(address.road);
        }
        if (address.house_number) {
            parts.push(`#${address.house_number}`);
        }

        const mainAddress = parts.join(" ") || result.display_name.split(",")[0];

        // Construir información secundaria más detallada
        const secondaryParts = [];

        // Agregar barrio/vecindario si existe
        if (address.neighbourhood || address.suburb) {
            secondaryParts.push(address.neighbourhood || address.suburb);
        }

        // Agregar ciudad
        const city = address.city || address.town || address.village;
        if (city) {
            secondaryParts.push(city);
        }

        const secondary = secondaryParts.join(", ");

        // Coordenadas para diferenciar segmentos de la misma calle
        const coordinates = `${parseFloat(result.lat).toFixed(5)}, ${parseFloat(result.lon).toFixed(5)}`;

        return {
            main: mainAddress,
            secondary: secondary || address.state || "",
            coordinates: coordinates,
            hasHouseNumber: !!address.house_number,
        };
    };

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                        <MaterialIcon name="search" className="text-gray-400" />
                    )}
                </div>
            </div>

            {/* Dropdown de resultados */}
            {showDropdown && results.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                >
                    {results.map((result) => {
                        const preview = formatAddressPreview(result);
                        return (
                            <button
                                key={result.place_id}
                                type="button"
                                onClick={() => handleSelectResult(result)}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                            >
                                <div className="flex items-start gap-3">
                                    <MaterialIcon
                                        name={preview.hasHouseNumber ? "home" : "location_on"}
                                        className={`${preview.hasHouseNumber ? "text-green-600" : "text-blue-600"} mt-0.5 flex-shrink-0`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {preview.main}
                                        </p>
                                        {preview.secondary && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {preview.secondary}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {showDropdown && !loading && searchQuery.length >= 3 && results.length === 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4"
                >
                    <div className="flex items-center gap-2 text-gray-500">
                        <MaterialIcon name="search_off" className="text-gray-400" />
                        <p className="text-sm">No se encontraron direcciones</p>
                    </div>
                </div>
            )}

            {/* Hint de búsqueda */}
            {searchQuery.length > 0 && searchQuery.length < 3 && (
                <p className="mt-1 text-xs text-gray-500">
                    Escribe al menos 3 caracteres para buscar
                </p>
            )}
        </div>
    );
}
