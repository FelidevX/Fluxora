"use client";

import { useState, useEffect } from "react";
import { useProductos } from "@/hooks/useProductos";
import { useMaterias } from "@/hooks/useMaterias";
import { formatCLP } from "@/utils/currency";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Badge from "@/components/ui/Badge";

export default function DashboardEstadisticas() {
  const { productos } = useProductos();
  const { materias, cargarMaterias } = useMaterias();

  const [estadisticas, setEstadisticas] = useState({
    totalProductos: 0,
    totalMaterias: 0,
    valorTotalInventario: 0,
    stockBajo: 0,
    productosDisponibles: 0,
  });

  // Cargar materias primas al montar el componente
  useEffect(() => {
    cargarMaterias();
  }, []); // Sin dependencias para evitar loops infinitos

  useEffect(() => {
    const totalProductos = productos.length;
    const totalMaterias = materias.length;
    const valorTotalInventario = productos.reduce(
      (total, p) => total + (p.precioVenta || 0) * (p.stockTotal || 0),
      0
    );
    const stockBajo =
      materias.filter((m) => (m.cantidad || 0) < 5).length +
      productos.filter((p) => (p.stockTotal || 0) < 5).length;
    const productosDisponibles = productos.filter(
      (p) => p.estado === "Disponible" || p.estado === "activo"
    ).length;

    setEstadisticas({
      totalProductos,
      totalMaterias,
      valorTotalInventario,
      stockBajo,
      productosDisponibles,
    });
  }, [productos, materias]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MaterialIcon name="analytics" className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Dashboard de Estadísticas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Productos
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {estadisticas.totalProductos}
              </p>
            </div>
            <MaterialIcon
              name="shopping_bag"
              className="w-8 h-8 text-blue-500"
            />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">
                Materias Primas
              </p>
              <p className="text-2xl font-bold text-green-900">
                {estadisticas.totalMaterias}
              </p>
            </div>
            <MaterialIcon name="inventory" className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Valor Total</p>
              <p className="text-lg font-bold text-purple-900">
                {formatCLP(estadisticas.valorTotalInventario)}
              </p>
            </div>
            <MaterialIcon
              name="attach_money"
              className="w-8 h-8 text-purple-500"
            />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-orange-900">
                {estadisticas.stockBajo}
              </p>
            </div>
            <MaterialIcon name="warning" className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Disponibles
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                {estadisticas.productosDisponibles}
              </p>
            </div>
            <MaterialIcon
              name="check_circle"
              className="w-8 h-8 text-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de productos más vendidos (simulada por ahora) */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Resumen por Categoría
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Estimado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {["Panadería", "Pastelería"].map(
                (categoria) => {
                  const productosCategoria = productos.filter(
                    (p) => p.categoria === categoria
                  );
                  const stockTotal = productosCategoria.reduce(
                    (sum, p) => sum + (p.stockTotal || 0),
                    0
                  );
                  const valorTotal = productosCategoria.reduce(
                    (sum, p) => sum + (p.precioVenta || 0) * (p.stockTotal || 0),
                    0
                  );

                  return (
                    <tr key={categoria} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Badge variant="info">{categoria}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {productosCategoria.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stockTotal.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCLP(valorTotal)}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
