import MaterialIcon from "@/components/ui/MaterialIcon";
import Badge from "@/components/ui/Badge";
import type { ProductoAgrupado } from "@/components/inventario/productos/plan-produccion/types";

interface ProductoCardProps {
  producto: ProductoAgrupado;
}

export default function ProductoCard({ producto }: ProductoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-3 md:space-y-4">
        {/* Header del producto */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg text-gray-800 mb-1 truncate">
              {producto.nombreProducto}
            </h3>
            <Badge variant="info">
              {producto.clientes.length}{" "}
              {producto.clientes.length === 1 ? "cliente" : "clientes"}
            </Badge>
          </div>
          <MaterialIcon
            name="bakery_dining"
            className="text-orange-500 text-2xl md:text-3xl flex-shrink-0"
          />
        </div>

        {/* Cantidad total */}
        <div className="bg-blue-50 rounded-lg p-3 md:p-4 text-center">
          <div className="text-xs md:text-sm text-gray-600 mb-1">
            Cantidad Total
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">
            {producto.cantidadTotal.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {producto.unidadMedida}
          </div>
        </div>

        {/* Desglose por cliente */}
        <div>
          <div className="text-xs font-semibold text-gray-600 uppercase mb-2 flex items-center gap-1">
            <MaterialIcon name="list" className="text-sm" />
            Desglose por Cliente
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {producto.clientes.map((cliente: any, idx: number) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs md:text-sm bg-gray-50 rounded p-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700 truncate">
                    {cliente.nombreCliente}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {cliente.ruta}
                  </div>
                </div>
                <div className="sm:ml-2 font-semibold text-blue-600 whitespace-nowrap">
                  {cliente.cantidad.toLocaleString()} {producto.unidadMedida}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
