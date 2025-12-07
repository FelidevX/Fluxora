import MaterialIcon from "@/components/ui/MaterialIcon";

interface EmptyStateProps {
  fechaMostrar: string;
}

export default function EmptyState({ fechaMostrar }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="text-center py-8 md:py-12 px-4">
        <MaterialIcon
          name="event_busy"
          className="text-gray-400 text-5xl md:text-6xl mb-4"
        />
        <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
          Sin Programación
        </h3>
        <p className="text-sm md:text-base text-gray-500">
          No hay entregas programadas para mañana
        </p>
        <p className="text-xs md:text-sm text-gray-400 mt-2 capitalize">
          {fechaMostrar}
        </p>
      </div>
    </div>
  );
}
