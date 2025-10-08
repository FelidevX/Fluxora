import { HistorialEntregas } from "@/components/admin/entregas/historial/HistorialEntregas";

export default function EntregasPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
        <p className="text-gray-600">Historial y control de entregas realizadas.</p>
      </div>

      <div>
        <HistorialEntregas />
      </div>
    </div>
  );
}
