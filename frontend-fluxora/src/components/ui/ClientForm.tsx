"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AddressAutocomplete from "./AddressAutoComplete";
import Badge from "@/components/ui/Badge";
import MaterialIcon from "@/components/ui/MaterialIcon";

// Importación dinámica del mapa para evitar problemas de SSR
const MapSelector = dynamic(() => import("./MapSelector"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
      Cargando mapa...
    </div>
  ),
});

interface ClientFormData {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
  isLoading?: boolean;
  submitButtonText?: string;
  title?: string;
}

const ClientForm: React.FC<ClientFormProps> = ({
  onSubmit,
  initialData = {},
  isLoading = false,
  submitButtonText = "Registrar cliente",
  title = "Registrar nuevo cliente",
}) => {
  const [formData, setFormData] = useState<ClientFormData>({
    businessName: initialData.businessName || "",
    contactPerson: initialData.contactPerson || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    address: initialData.address || "",
    latitude: initialData.latitude || undefined,
    longitude: initialData.longitude || undefined,
  });

  const [showMap, setShowMap] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (address: string) => {
    setFormData((prev) => ({
      ...prev,
      address,
    }));
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  };

  const getCurrentLocation = () => {
    setIsGeolocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude);
          setIsGeolocating(false);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
          alert("No se pudo obtener la ubicación actual");
          setIsGeolocating(false);
        }
      );
    } else {
      alert("La geolocalización no está soportada en este navegador");
      setIsGeolocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error(
          "No se encontró token de autenticación. Por favor, inicie sesión de nuevo."
        );
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const clientData = {
        nombreNegocio: formData.businessName,
        nombre: formData.contactPerson,
        contacto: formData.phone,
        direccion: formData.address,
        latitud: formData.latitude,
        longitud: formData.longitude,
        email: formData.email,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/clientes/clientes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(clientData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      onSubmit(formData);
      alert("Cliente registrado exitosamente");
      resetForm();
    } catch (error) {
      alert(
        `Error al registrar cliente: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      businessName: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MaterialIcon name="person_add" className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <Badge variant="info">Nuevo</Badge>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Ingrese los nuevos datos del cliente
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="businessName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre del negocio
          </label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            placeholder="Ej: Juan Perez"
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="contactPerson"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Persona de contacto
          </label>
          <input
            type="text"
            id="contactPerson"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleInputChange}
            placeholder="Ej: Juan Perez"
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+569 0000 0000"
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Correo
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="cliente@gmail.com"
              className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Dirección
          </label>
          <div className="space-y-2">
            <AddressAutocomplete
              value={formData.address}
              onChange={handleAddressChange}
              onLocationSelect={handleLocationSelect}
              placeholder="Ej: Av. Argentina 203, Chillán"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showMap ? "Ocultar mapa" : "Seleccionar en mapa"}
              </button>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGeolocating}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isGeolocating ? "Obteniendo..." : "Mi ubicación"}
              </button>
            </div>
            {formData.latitude && formData.longitude && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <MaterialIcon
                  name="location_on"
                  className="text-green-600 mr-1"
                />
                Coordenadas: {formData.latitude.toFixed(6)},{" "}
                {formData.longitude.toFixed(6)}
              </div>
            )}
            {showMap && (
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <MapSelector
                  onLocationSelect={handleLocationSelect}
                  initialPosition={
                    formData.latitude && formData.longitude
                      ? [formData.latitude, formData.longitude]
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Procesando..." : submitButtonText}
        </button>
      </form>
    </div>
  );
};

export default ClientForm;
