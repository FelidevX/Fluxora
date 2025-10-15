"use client";

import { useState } from "react";
import { useHistorialEntregas } from "@/hooks/useHistorialEntregas";
import { TablaRutas } from "./componentes/TablaRutas";
import { DetallesRutaModal } from "./componentes/DetallesRutaModal";

interface Ruta {
  id: number;
  id_driver: number;
  fecha: string;
  kg_corriente: number;
  kg_especial: number;
  corriente_devuelto: number;
  especial_devuelto: number;
  hora_retorno: string | null;
}

export function HistorialEntregas() {
  const {
    entregas,
    clientes,
    loading,
    detallesEntrega,
    loadingDetalles,
    fetchDetallesEntrega,
    getNombreDriver,
  } = useHistorialEntregas();

  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroConductor, setFiltroConductor] = useState("");
  const [search, setSearch] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);

  const entregasFiltradas = entregas.filter((entrega) => {
    const cumpleFecha =
      !filtroFecha ||
      new Date(entrega.fecha).toDateString() ===
        new Date(filtroFecha).toDateString();

    const nombreDriver = getNombreDriver(entrega.id_driver).toLowerCase();
    const cumpleConductor =
      !filtroConductor ||
      nombreDriver.includes(filtroConductor.toLowerCase()) ||
      entrega.id_driver.toString().includes(filtroConductor);

    const cumpleBusqueda =
      !search ||
      nombreDriver.includes(search.toLowerCase()) ||
      new Date(entrega.fecha)
        .toLocaleDateString()
        .includes(search.toLowerCase());

    return cumpleFecha && cumpleConductor && cumpleBusqueda;
  });

  const abrirModal = async (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setModalAbierto(true);
    await fetchDetallesEntrega(ruta.id);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setRutaSeleccionada(null);
  };

  const limpiarFiltros = () => {
    setFiltroFecha("");
    setFiltroConductor("");
    setSearch("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Historial de Rutas
        </h2>
      </div>

      <TablaRutas
        rutas={entregasFiltradas}
        getNombreDriver={getNombreDriver}
        onVerDetalles={abrirModal}
        loading={loading}
        searchValue={search}
        onSearch={setSearch}
      />

      {modalAbierto && (
        <DetallesRutaModal
          ruta={rutaSeleccionada}
          detallesEntrega={detallesEntrega}
          clientes={clientes}
          loading={loadingDetalles}
          onClose={cerrarModal}
          getNombreDriver={getNombreDriver}
        />
      )}
    </div>
  );
}
