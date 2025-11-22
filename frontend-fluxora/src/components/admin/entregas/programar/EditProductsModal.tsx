import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

// Interfaces
interface Lote {
  id: number;
  productoId: number;
  cantidadProducida: number;
  stockActual: number;
  costoProduccionTotal: number;
  costoUnitario: number;
  fechaProduccion: string;
  fechaVencimiento: string;
  estado: string;
}

interface ProductoConLotes {
  id: number;
  nombre: string;
  categoria: string;
  tipoProducto: string;
  precio: number;
  lotes: Lote[];
  stockTotal: number;
}

interface ProductoProgramado {
  id_producto: number;
  id_lote: number;
  nombreProducto: string;
  categoria: string;
  tipoProducto: string;
  cantidad_kg: number;
}

interface EditProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteData: any;
  productosConLotes: ProductoConLotes[];
  onGuardar: (productos: ProductoProgramado[]) => void;
}

export function EditProductsModal({
  isOpen,
  onClose,
  clienteData,
  productosConLotes,
  onGuardar,
}: EditProductsModalProps) {
  const [productosProgramados, setProductosProgramados] = useState<ProductoProgramado[]>(
    clienteData.productosProgramados || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  
  // Hook para notificaciones
  const { toasts, removeToast, warning } = useToast();

  if (!isOpen) return null;

  const productosDisponibles = productosConLotes.filter(
    (p) =>
      p.lotes.some(
        lote =>
          !productosProgramados.some(pp => pp.id_lote === lote.id)
          && lote.stockActual > 0
      )
  );

  const productosFiltrados = searchTerm 
    ? productosDisponibles.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : productosDisponibles;

  const handleSeleccionarProducto = (producto: ProductoConLotes) => {
    if (producto.lotes.length > 0) {
      const primerLote = producto.lotes[0];
      setProductosProgramados([
        ...productosProgramados,
        {
          id_producto: producto.id,
          id_lote: primerLote.id,
          nombreProducto: producto.nombre,
          categoria: producto.categoria,
          tipoProducto: producto.tipoProducto,
          cantidad_kg: 0,
        },
      ]);
      setSearchTerm("");
    }
  };

  const handleCantidadChange = (idProducto: number, cantidad: number) => {
    setProductosProgramados(
      productosProgramados.map((p) =>
        p.id_producto === idProducto ? { ...p, cantidad_kg: cantidad } : p
      )
    );
  };

  const handleLoteChange = (idProducto: number, nuevoIdLote: number) => {
    setProductosProgramados(
      productosProgramados.map((p) =>
        p.id_producto === idProducto ? { ...p, id_lote: nuevoIdLote } : p
      )
    );
  };

  const handleEliminarProducto = (idProducto: number) => {
    setProductosProgramados(
      productosProgramados.filter((p) => p.id_producto !== idProducto)
    );
  };

  const handleGuardar = () => {
    const productosValidos = productosProgramados.filter((p) => p.cantidad_kg > 0);
    if (productosValidos.length === 0) {
      warning("Debes agregar al menos un producto con cantidad mayor a 0", "Productos Requeridos");
      return;
    }
    onGuardar(productosValidos);
    onClose();
  };

  const totalKgCorriente = productosProgramados
    .filter((p) => {
      const producto = productosConLotes.find(prod => prod.id === p.id_producto);
      return producto?.tipoProducto === "CORRIENTE";
    })
    .reduce((sum, p) => sum + p.cantidad_kg, 0);

  const totalKgEspecial = productosProgramados
    .filter((p) => {
      const producto = productosConLotes.find(prod => prod.id === p.id_producto);
      return producto?.tipoProducto === "ESPECIAL";
    })
    .reduce((sum, p) => sum + p.cantidad_kg, 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold text-white">{clienteData.cliente.nombre}</h4>
            <p className="text-blue-100 text-sm">{clienteData.cliente.nombreNegocio}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded p-1.5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Columna izquierda: Productos disponibles */}
            <div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Productos Disponibles ({productosDisponibles.length})
                </label>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((producto) => (
                    <button
                      key={producto.id}
                      onClick={() => handleSeleccionarProducto(producto)}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center justify-between border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          producto.tipoProducto === "CORRIENTE" ? "bg-blue-600" : "bg-purple-600"
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">{producto.nombre}</span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          producto.tipoProducto === "CORRIENTE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {producto.categoria}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{producto.stockTotal}kg</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 px-3">
                    <svg className="mx-auto w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? "No se encontraron productos" : "No hay productos disponibles"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha: Productos asignados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Productos Asignados ({productosProgramados.length})
              </label>

              {/* Resumen */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-200">
                  <div className="text-xs text-blue-600 font-medium">Corriente</div>
                  <div className="text-lg font-bold text-blue-900">{totalKgCorriente.toFixed(1)} kg</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-200">
                  <div className="text-xs text-purple-600 font-medium">Especial</div>
                  <div className="text-lg font-bold text-purple-900">{totalKgEspecial.toFixed(1)} kg</div>
                </div>
              </div>

              {productosProgramados.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {productosProgramados.map((productoProg) => {
                    const producto = productosConLotes.find((p) => p.lotes.find((l) => Number(l.id) === Number(productoProg.id_lote)));
                    const loteSeleccionado = producto?.lotes.find((l) => Number(l.id) === Number(productoProg.id_lote));

                    return (
                      <div
                        key={productoProg.id_producto}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              productoProg.categoria === "corriente" ? "bg-blue-600" : "bg-purple-600"
                            }`}></div>
                            <span className="text-sm font-medium text-gray-900">
                              {productoProg.nombreProducto}
                            </span>
                          </div>
                          <button
                            onClick={() => handleEliminarProducto(productoProg.id_producto)}
                            type="button"
                            className="text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Selector de lote */}
                        {producto && producto.lotes.length > 0 && (
                          <select
                            value={productoProg.id_lote}
                            onChange={(e) =>
                              handleLoteChange(productoProg.id_producto, parseInt(e.target.value))
                            }
                            className="w-full text-xs text-black border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 py-1.5 mb-2"
                          >
                            {producto.lotes.map((lote) => (
                              <option key={lote.id} value={lote.id}>
                                Lote #{lote.id} • {lote.stockActual}kg disponibles • Vence: {new Date(lote.fechaVencimiento).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Input de cantidad */}
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={loteSeleccionado?.stockActual || 0}
                              value={productoProg.cantidad_kg == 0 ? "" : productoProg.cantidad_kg}
                              onChange={(e) =>
                                handleCantidadChange(
                                  productoProg.id_producto,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-2 text-black border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="0.0"
                            />
                            <span className="absolute right-3 top-2 text-xs text-gray-500">kg</span>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            de {loteSeleccionado?.stockActual || 0} kg
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-1.5 rounded-full ${
                              productoProg.categoria === "corriente" ? "bg-blue-600" : "bg-purple-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                ((productoProg.cantidad_kg || 0) / (loteSeleccionado?.stockActual || 1)) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg className="mx-auto w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm text-gray-500">No hay productos asignados</p>
                  <p className="text-xs text-gray-400 mt-1">Selecciona productos de la izquierda</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
