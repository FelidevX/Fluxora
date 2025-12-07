"use client";

import { usePlanProduccion } from "./plan-produccion/usePlanProduccion";
import LoadingState from "./plan-produccion/LoadingState";
import EmptyState from "./plan-produccion/EmptyState";
import EstadisticasHeader from "./plan-produccion/EstadisticasHeader";
import ProductoCard from "./plan-produccion/ProductoCard";

export default function PlanProduccion() {
  const { loading, programaciones, productosAgrupados, totalKg } =
    usePlanProduccion();

  // Calcular fecha de mañana para mostrar
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fechaMostrar = tomorrow.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return <LoadingState />;
  }

  if (programaciones.length === 0) {
    return <EmptyState fechaMostrar={fechaMostrar} />;
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <EstadisticasHeader
        fechaMostrar={fechaMostrar}
        totalKg={totalKg}
        totalProductos={productosAgrupados.length}
      />

      {/* Lista de productos */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {productosAgrupados.map((producto, index) => (
          <ProductoCard key={index} producto={producto} />
        ))}
      </div>
    </div>
  );
}

