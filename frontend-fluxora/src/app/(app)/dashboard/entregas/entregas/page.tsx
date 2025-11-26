import { HistorialEntregas } from "@/components/admin/entregas/historial/HistorialEntregas";
import Link from "next/dist/client/link";
import MaterialIcon from "@/components/ui/MaterialIcon";

export default function EntregasPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center font-bold cursor-pointer"
          href={"/dashboard/entregas"}
        >
          <MaterialIcon name="arrow_back" className="mr-1" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div>
        <HistorialEntregas />
      </div>
    </div>
  );
}
