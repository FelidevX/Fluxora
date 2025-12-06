"use client";
import { useState } from "react";
import { TipoReporte, FiltrosReporte } from "@/types/reportes";
import { useReportes } from "@/hooks/useReportes";
import ReportCard from "@/components/reportes/ReportCard";
import ReportFilters from "@/components/reportes/ReportFilters";
import ReportTable from "@/components/reportes/ReportTable";
import ReportSummary from "@/components/reportes/ReportSummary";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function ReportesContent() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoReporte | null>(
    null
  );
  const [datosReporte, setDatosReporte] = useState<any | null>(null);
  const { loading, error, generarReporte } = useReportes();

  // Hook para notificaciones toast
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    warning,
    info,
  } = useToast();

  // Tipos de reportes disponibles
  const tiposReportes = [
    {
      tipo: "entregas" as TipoReporte,
      titulo: "Reporte de Entregas",
      descripcion:
        "Análisis detallado de entregas realizadas y pendientes por periodo",
      icono: "local_shipping",
    },
    {
      tipo: "ventas" as TipoReporte,
      titulo: "Reporte de Ventas",
      descripcion: "Estadísticas de ventas, ingresos y productos vendidos",
      icono: "monetization_on",
    },
    {
      tipo: "inventario" as TipoReporte,
      titulo: "Reporte de Inventario",
      descripcion: "Movimientos de stock, entradas y salidas de productos",
      icono: "inventory",
    },
    {
      tipo: "clientes" as TipoReporte,
      titulo: "Reporte de Clientes",
      descripcion:
        "Análisis de comportamiento y frecuencia de compra de clientes",
      icono: "groups",
    },
  ];

  // Manejar generación de reporte
  const handleGenerarReporte = async (filtros: FiltrosReporte) => {
    console.log("handleGenerarReporte llamado con:", filtros);
    try {
      const resultado = await generarReporte(filtros);
      console.log("Resultado del reporte:", resultado);
      if (resultado) {
        setDatosReporte(resultado);
        success("El reporte se ha generado correctamente", "Reporte Generado");
      }
    } catch (err) {
      console.error("Error en handleGenerarReporte:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al generar el reporte",
        "Error al Generar Reporte"
      );
    }
  };

  // Exportar a Excel
  const exportarAExcel = async () => {
    if (!datosReporte || !datosReporte.datos || !tipoSeleccionado) {
      warning("No hay datos disponibles para exportar", "Sin Datos");
      return;
    }

    try {
      console.log("Exportando a Excel...");
      info("Preparando exportación a Excel...", "Exportando");

      const { ExcelExportService } = await import(
        "@/services/exportacion/excelExportService"
      );

      await ExcelExportService.exportarCompleto({
        tipo: tipoSeleccionado,
        datos: datosReporte.datos,
        resumen: datosReporte.resumen,
        columnas: getColumnas(),
        fechaInicio: datosReporte.fechaInicio,
        fechaFin: datosReporte.fechaFin,
      });

      console.log("Excel exportado exitosamente");
      success(
        "El reporte se ha exportado a Excel correctamente",
        "Exportación Exitosa"
      );
    } catch (err) {
      console.error("Error al exportar:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al exportar el reporte",
        "Error al Exportar"
      );
    }
  };

  // Exportar a PDF
  const exportarAPDF = async () => {
    if (!datosReporte || !datosReporte.datos || !tipoSeleccionado) {
      warning("No hay datos disponibles para exportar", "Sin Datos");
      return;
    }

    try {
      console.log("Exportando a PDF...");
      info("Preparando exportación a PDF...", "Exportando");

      const { PDFExportService } = await import(
        "@/services/exportacion/pdfExportService"
      );

      await PDFExportService.exportar({
        tipo: tipoSeleccionado,
        datos: datosReporte.datos,
        resumen: datosReporte.resumen,
        columnas: getColumnas(),
        fechaInicio: datosReporte.fechaInicio,
        fechaFin: datosReporte.fechaFin,
      });

      console.log("PDF exportado exitosamente");
      success(
        "El reporte se ha exportado a PDF correctamente",
        "Exportación Exitosa"
      );
    } catch (err) {
      console.error("Error al exportar:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Error desconocido al exportar el reporte",
        "Error al Exportar"
      );
    }
  };

  // Obtener columnas según el tipo de reporte
  const getColumnas = () => {
    switch (tipoSeleccionado) {
      case "entregas":
        return [
          { key: "fecha", label: "Fecha" },
          { key: "entregasProgramadas", label: "Programadas" },
          { key: "totalEntregas", label: "Realizadas" },
          {
            key: "kgCorriente",
            label: "Kg Corriente",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          {
            key: "kgEspecial",
            label: "Kg Especial",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          {
            key: "kgTotal",
            label: "Kg Total",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          {
            key: "porcentajeCompletado",
            label: "% Completado",
            format: (v: number) => `${v?.toFixed(1)}%`,
          },
        ];
      case "ventas":
        return [
          { key: "fecha", label: "Fecha" },
          {
            key: "totalVentas",
            label: "Total Ventas",
            format: (v: number) => `$${v?.toLocaleString()}`,
          },
          {
            key: "totalKilos",
            label: "Kg Vendidos",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          { key: "numeroClientes", label: "Nº Clientes" },
          {
            key: "ventaPromedio",
            label: "Venta promedio",
            format: (v: number) => `$${v?.toLocaleString()}`,
          },
        ];
      case "inventario":
        return [
          { key: "producto", label: "Producto" },
          { key: "tipo", label: "Tipo" },
          {
            key: "stockInicial",
            label: "Stock Inicial",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          {
            key: "entradas",
            label: "Entradas",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          {
            key: "salidas",
            label: "Salidas (Mermas)",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          {
            key: "stockFinal",
            label: "Stock Final",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          {
            key: "valorTotal",
            label: "Valor Total",
            format: (v: number) => `$${v?.toLocaleString()}`,
          },
          {
            key: "rotacion",
            label: "Rotación %",
            format: (v: number) => (v ? `${v?.toFixed(1)}%` : "-"),
          },
          {
            key: "porcentajeMerma",
            label: "% Merma",
            format: (v: number) => (v ? `${v?.toFixed(1)}%` : "-"),
          },
          { key: "estadoStock", label: "Estado" },
        ];
      case "clientes":
        return [
          { key: "nombreCliente", label: "Cliente" },
          { key: "totalCompras", label: "Nº Compras" },
          {
            key: "totalKilos",
            label: "Kg Totales",
            format: (v: number) => `${v?.toFixed(1)} kg`,
          },
          { key: "ultimaCompra", label: "Última Compra" },
          {
            key: "valorTotal",
            label: "Valor Total",
            format: (v: number) => `$${v?.toLocaleString()}`,
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-full overflow-x-hidden mx-auto mt-12 md:mt-0">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Reportes</h1>
        <p className="text-sm text-gray-600">
          Genera reportes detallados de entregas, ventas, inventario y clientes
        </p>
      </div>

      {/* Selección de tipo de reporte */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
          Selecciona el tipo de reporte
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {tiposReportes.map((reporte) => (
            <ReportCard
              key={reporte.tipo}
              tipo={reporte.tipo}
              titulo={reporte.titulo}
              descripcion={reporte.descripcion}
              icono={reporte.icono}
              onClick={() => setTipoSeleccionado(reporte.tipo)}
              isSelected={tipoSeleccionado === reporte.tipo}
            />
          ))}
        </div>
      </div>

      {/* Filtros */}
      {tipoSeleccionado && (
        <div className="mb-6 md:mb-8">
          <ReportFilters
            onGenerar={handleGenerarReporte}
            tipoSeleccionado={tipoSeleccionado}
            loading={loading}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 md:mb-8 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <p className="text-sm md:text-base text-red-800 font-medium">❌ {error}</p>
        </div>
      )}

      {/* Resultados */}
      {datosReporte && datosReporte.datos && datosReporte.datos.length > 0 && (
        <div className="space-y-6">
          {/* Resumen */}
          <ReportSummary
            resumen={datosReporte.resumen}
            tipo={tipoSeleccionado || ""}
          />

          {/* Tabla */}
          <ReportTable
            data={datosReporte.datos}
            columns={getColumnas()}
            titulo={`Resultados del Reporte - ${tipoSeleccionado?.toUpperCase()}`}
            onExportarExcel={exportarAExcel}
            onExportarPDF={exportarAPDF}
          />
        </div>
      )}

      {/* Sin datos */}
      {datosReporte &&
        datosReporte.datos &&
        datosReporte.datos.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 md:p-8 text-center">
            <p className="text-sm md:text-base text-yellow-800">
              ℹ️ No se encontraron datos para el periodo seleccionado
            </p>
          </div>
        )}

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}

export default function ReportesPage() {
  return (
    <ProtectedRoute requiredModule="reportes">
      <ReportesContent />
    </ProtectedRoute>
  );
}
