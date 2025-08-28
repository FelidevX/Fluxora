'use client'
import React, { useState, useEffect, useRef } from 'react';

interface AddressResult {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
}

interface AddressAutoCompleteProps {
    value: string;
    onChange: (value: string) => void;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    placeholder?: string;
    className?: string;
}

const AddressAutocomplete: React.FC<AddressAutoCompleteProps> = ({
    value,
    onChange,
    onLocationSelect,
    placeholder = 'Ingrese dirección...',
    className = '',
}) => {
    const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const searchAddresses = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const searchQuery = query.includes('Chile') ? query : `${query}, Chile`;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=cl&addressdetails=1`
            );
            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }

    // Debounce para evitar muchas peticiones
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            if (value) {
                searchAddresses
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setShowSuggestions(true);
    };

    const handleSuggestionClick = (suggestion: AddressResult) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);

        onChange(suggestion.display_name);
        onLocationSelect(lat, lng, suggestion.display_name);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleInputBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false);
        }, 200);
    };

    const handleInputFocus = () => {
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    return (
        <div className="relative">
            <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={`w-full px-3 py-2 text-black border border-gray-300 rounded-md   focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoComplete="off"
        />

        {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md    shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
                <div
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100    last:border-b-0"
                >
                <div className="text-sm text-gray-800 truncate">
                    {suggestion.display_name}
                </div>
                </div>
            ))}
            </div>
        )}

        {showSuggestions && suggestions.length === 0 && value.length >= 3 && !isLoading && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md    shadow-lg">
            <div className="px-3 py-2 text-sm text-gray-500">
                No se encontraron direcciones
            </div>
            </div>
        )}
        </div>
    );
};

export default AddressAutocomplete;