import { TipoReporte } from "@/types/reportes";
import MaterialIcon from "../ui/MaterialIcon";

interface ReportCardProps {
  tipo: TipoReporte;
  titulo: string;
  descripcion: string;
  icono: string;
  onClick: () => void;
  isSelected: boolean;
}

export default function ReportCard({
  tipo,
  titulo,
  descripcion,
  icono,
  onClick,
  isSelected,
}: ReportCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 md:p-6 rounded-xl border-2 transition-all duration-200
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-lg"
            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
        }
      `}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div
          className={`
          p-2 md:p-3 rounded-lg
          ${isSelected ? "bg-blue-500" : "bg-blue-100"}
        `}
        >
          <MaterialIcon
            name={icono}
            className={`text-xl md:text-2xl ${
              isSelected ? "text-white" : "text-blue-600"
            }`}
          />
        </div>
        <div className="flex-1 text-left">
          <h3
            className={`text-base md:text-lg font-semibold mb-1 ${
              isSelected ? "text-blue-700" : "text-gray-900"
            }`}
          >
            {titulo}
          </h3>
          <p className="text-xs md:text-sm text-gray-600">{descripcion}</p>
        </div>
        {isSelected && (
          <MaterialIcon
            name="check_circle"
            className="text-xl md:text-2xl text-blue-500 flex-shrink-0"
          />
        )}
      </div>
    </button>
  );
}
