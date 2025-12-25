"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AddressSearchInput from "@/components/ui/AddressSearchInput";
import { AddressResult } from "@/hooks/useAddressSearch";
import Badge from "@/components/ui/Badge";
import MaterialIcon from "@/components/ui/MaterialIcon";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

// Importación dinámica del mapa para evitar problemas de SSR
const MapSelector = dynamic(() => import("../ui/MapSelector"), {
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
  precioCorriente?: number;
  precioEspecial?: number;
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
    precioCorriente: initialData.precioCorriente || 1200,
    precioEspecial: initialData.precioEspecial || 1500,
  });

  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook para notificaciones
  const { toasts, removeToast, warning, error: showError } = useToast();

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

  const handleAddressSelect = (result: AddressResult) => {
    setFormData((prev) => ({
      ...prev,
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
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
        (err) => {
          console.error("Error obteniendo ubicación:", err);
          showError("No se pudo obtener la ubicación actual", "Error de Geolocalización");
          setIsGeolocating(false);
        }
      );
    } else {
      warning("La geolocalización no está soportada en este navegador", "Geolocalización No Disponible");
      setIsGeolocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Llamar al callback pasando los datos del formulario
      // El componente padre (page.tsx) se encarga de transformarlos y enviarlos
      onSubmit(formData);
      resetForm();
    } catch (err) {
      console.error("Error al procesar el formulario:", err);
      showError(
        err instanceof Error ? err.message : "Error desconocido al procesar el formulario",
        "Error en el Formulario"
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
      precioCorriente: 1200,
      precioEspecial: 1500,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <MaterialIcon name="person_add" className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="self-start sm:self-auto">
          <Badge variant="info">Nuevo</Badge>
        </div>
      </div>

      <p className="text-xs md:text-sm text-gray-500 mb-4">
        Ingrese los nuevos datos del cliente
      </p>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
      >
        {/* Left: datos del cliente */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="businessName"
              className="block text-xs md:text-sm font-medium text-gray-700 mb-1"
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
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="contactPerson"
              className="block text-xs md:text-sm font-medium text-gray-700 mb-1"
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
              className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs md:text-sm font-medium text-gray-700 mb-1"
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
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-xs md:text-sm font-medium text-gray-700 mb-1"
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
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="precioCorriente"
                className="block text-xs md:text-sm font-medium text-gray-700 mb-1"
              >
                Precio Pan Corriente ($)
              </label>
              <input
                type="number"
                id="precioCorriente"
                name="precioCorriente"
                value={formData.precioCorriente}
                onChange={handleInputChange}
                placeholder="1300"
                min="0"
                step="100"
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="precioEspecial"
                className="block text-xs md:text-sm font-medium text-gray-700 mb-1"
              >
                Precio Pan Especial ($)
              </label>
              <input
                type="number"
                id="precioEspecial"
                name="precioEspecial"
                value={formData.precioEspecial}
                onChange={handleInputChange}
                placeholder="1500"
                min="0"
                step="100"
                className="w-full px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Aquí se pueden añadir campos adicionales del cliente si se necesitan */}
        </div>

        {/* Right: dirección y mapa */}
        <div className="space-y-4">
          <AddressSearchInput
            value={formData.address}
            onChange={handleAddressChange}
            onSelectAddress={handleAddressSelect}
            placeholder="Buscar dirección... Ej: Av. Argentina 203, Chillán"
            label="Dirección"
            required
          />

          <div className="space-y-3 mt-3">

            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGeolocating}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 md:py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 font-medium text-sm"
            >
              <MaterialIcon name={isGeolocating ? "refresh" : "my_location"} className={isGeolocating ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{isGeolocating ? "Obteniendo ubicación..." : "Obtener mi ubicación actual"}</span>
              <span className="sm:hidden">{isGeolocating ? "Obteniendo..." : "Mi ubicación"}</span>
            </button>

            <div className="border border-gray-300 rounded-md overflow-hidden h-48 md:h-64">
              <MapSelector
                onLocationSelect={handleLocationSelect}
                initialPosition={
                  formData.latitude && formData.longitude
                    ? [formData.latitude, formData.longitude]
                    : undefined
                }
              />
            </div>

            <div className="text-xs md:text-sm text-blue-700 bg-blue-50 p-2 md:p-3 rounded-lg flex items-start gap-2 border border-blue-200">
              <MaterialIcon name="info" className="text-blue-600 flex-shrink-0 mt-0.5 text-base md:text-xl" />
              <span className="leading-relaxed">
                Selecciona en el mapa la ubicación exacta del cliente
              </span>
            </div>
          </div>
        </div>

        {/* Submit en el footer ocupando ambas columnas */}
        <div className="lg:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Procesando..." : submitButtonText}
          </button>
        </div>
      </form>

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
};

export default ClientForm;
