import { FiltrosReporte, PeriodoReporte, TipoReporte } from "@/types/reportes";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

interface ReportFiltersProps {
  onGenerar: (filtros: FiltrosReporte) => void;
  tipoSeleccionado: TipoReporte | null;
  loading: boolean;
}

export default function ReportFilters({
  onGenerar,
  tipoSeleccionado,
  loading,
}: ReportFiltersProps) {
  const [periodo, setPeriodo] = useState<PeriodoReporte>("diario");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoReporteInventario, setTipoReporteInventario] =
    useState("movimientos");
  const [incluirAnalisis, setIncluirAnalisis] = useState(true);

  // Hook para notificaciones
  const { toasts, removeToast, warning } = useToast();

  // Calcular fechas según el periodo seleccionado
  useEffect(() => {
    const hoy = new Date();
    let inicio = new Date();

    switch (periodo) {
      case "diario":
        // Hoy
        inicio = hoy;
        break;
      case "semanal":
        // Últimos 7 días
        inicio.setDate(hoy.getDate() - 6);
        break;
      case "mensual":
        // Último mes
        inicio.setMonth(hoy.getMonth() - 1);
        break;
      case "personalizado":
        // No hacer nada, el usuario ingresará las fechas
        return;
    }

    setFechaInicio(inicio.toISOString().split("T")[0]);
    setFechaFin(hoy.toISOString().split("T")[0]);
  }, [periodo]);

  const handleGenerar = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevenir recarga de página

    if (!tipoSeleccionado) {
      warning(
        "Por favor selecciona un tipo de reporte",
        "Tipo de Reporte Requerido"
      );
      return;
    }

    if (!fechaInicio || !fechaFin) {
      warning("Por favor selecciona un rango de fechas", "Fechas Requeridas");
      return;
    }

    const filtros: FiltrosReporte = {
      tipo: tipoSeleccionado,
      periodo,
      fechaInicio,
      fechaFin,
      // Opciones específicas para reporte de inventario
      ...(tipoSeleccionado === "inventario" && {
        tipoReporteInventario,
        incluirAnalisis,
      }),
    };

    onGenerar(filtros);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Filtros del Reporte
      </h3>

      <div className="space-y-4">
        {/* Periodo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Periodo
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: "diario", label: "Hoy" },
              { value: "semanal", label: "Última Semana" },
              { value: "mensual", label: "Último Mes" },
              { value: "personalizado", label: "Personalizado" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriodo(opt.value as PeriodoReporte)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    periodo === opt.value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rango de fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={periodo !== "personalizado"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={periodo !== "personalizado"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-gray-700"
            />
          </div>
        </div>

        {/* Opciones específicas para reporte de inventario */}
        {tipoSeleccionado === "inventario" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Análisis
              </label>
              <select
                value={tipoReporteInventario}
                onChange={(e) => setTipoReporteInventario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              >
                <option value="movimientos">Todos los movimientos</option>
                <option value="bajoStock">Productos con bajo stock</option>
                <option value="sinMovimiento">Productos sin movimiento</option>
                <option value="altaMerma">Productos con alta merma</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="incluirAnalisis"
                checked={incluirAnalisis}
                onChange={(e) => setIncluirAnalisis(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="incluirAnalisis"
                className="text-sm font-medium text-gray-700"
              >
                Incluir análisis avanzado (rotación, mermas, estado del stock)
              </label>
            </div>
          </>
        )}

        {/* Botón generar */}
        <button
          type="button"
          onClick={handleGenerar}
          disabled={!tipoSeleccionado || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generando...</span>
            </>
          ) : (
            <>
              <span>Generar Reporte</span>
            </>
          )}
        </button>
      </div>

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
