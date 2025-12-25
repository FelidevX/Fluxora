import MaterialIcon from "@/components/ui/MaterialIcon";

interface EstadisticasHeaderProps {
  fechaMostrar: string;
  totalKg: number;
  totalProductos: number;
}

export default function EstadisticasHeader({
  fechaMostrar,
  totalKg,
  totalProductos,
}: EstadisticasHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="space-y-4">
        {/* Título y fecha */}
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MaterialIcon
              name="calendar_today"
              className="text-lg md:text-2xl text-blue-600"
            />
            <span>Plan de Producción</span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1 capitalize">
            {fechaMostrar}
          </p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Producción Total */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MaterialIcon
                  name="factory"
                  className="text-white text-xl md:text-2xl"
                />
              </div>
              <div className="flex-1">
                <div className="text-xs md:text-sm text-gray-600">
                  Producción Total
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800">
                  {totalKg.toLocaleString()} Kg
                </div>
              </div>
            </div>
          </div>

          {/* Productos a producir */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MaterialIcon
                  name="bakery_dining"
                  className="text-white text-xl md:text-2xl"
                />
              </div>
              <div className="flex-1">
                <div className="text-xs md:text-sm text-gray-600">
                  {totalProductos === 1 ? "Producto" : "Productos"}
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800">
                  {totalProductos}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
