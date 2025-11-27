import { useState, useEffect } from "react";
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

interface AsignarProductosModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: any;
  rutaId: number;
  productosConLotes: ProductoConLotes[];
  loadingProductos: boolean;
  onActualizar: (
    idRuta: number,
    idCliente: number,
    productos: ProductoProgramado[]
  ) => void;
}

export function AsignarProductosModal({
  isOpen,
  onClose,
  cliente,
  rutaId,
  productosConLotes,
  loadingProductos,
  onActualizar,
}: AsignarProductosModalProps) {
  const [productosProgramados, setProductosProgramados] = useState<
    ProductoProgramado[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { toasts, removeToast, warning } = useToast();

  // Sincronizar productos cuando cambie el cliente o se abra el modal
  useEffect(() => {
    if (isOpen && cliente) {
      setProductosProgramados(cliente.productos || []);
    }
  }, [isOpen, cliente]);

  if (!isOpen) return null;

  const productosDisponibles = productosConLotes.filter((p) =>
    p.lotes.some(
      (lote) =>
        !productosProgramados.some((pp) => pp.id_lote === lote.id) &&
        lote.stockActual > 0
    )
  );

  const productosFiltrados = searchTerm
    ? productosDisponibles.filter((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : productosDisponibles;

  const handleSeleccionarProducto = (producto: ProductoConLotes) => {
    if (producto.lotes.length > 0) {
      // Seleccionar el lote más antiguo disponible (FIFO - First In, First Out)
      const lotesDisponibles = producto.lotes
        .filter((lote) => lote.stockActual > 0)
        .sort((a, b) => new Date(a.fechaProduccion).getTime() - new Date(b.fechaProduccion).getTime());

      if (lotesDisponibles.length > 0) {
        const loteSeleccionado = lotesDisponibles[0];
        
        setProductosProgramados([
          ...productosProgramados,
          {
            id_producto: producto.id,
            id_lote: loteSeleccionado.id,
            nombreProducto: producto.nombre,
            categoria: producto.categoria,
            tipoProducto: producto.tipoProducto,
            cantidad_kg: 0,
          },
        ]);
        setSearchTerm("");
      }
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
    // Función deshabilitada - el lote se asigna automáticamente
    return;
  };

  const handleEliminarProducto = (idProducto: number) => {
    setProductosProgramados(
      productosProgramados.filter((p) => p.id_producto !== idProducto)
    );
  };

  const handleGuardar = () => {
    const productosValidos = productosProgramados.filter(
      (p) => p.cantidad_kg > 0
    );
    if (productosValidos.length === 0) {
      warning("Debes agregar al menos un producto con cantidad mayor a 0");
      return;
    }
    onActualizar(rutaId, cliente.id_cliente, productosValidos);
  };

  const totalKg = productosProgramados.reduce(
    (sum, p) => sum + p.cantidad_kg,
    0
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold text-white">
              {cliente.nombre_cliente || `Cliente #${cliente.id_cliente}`}
            </h4>
            <p className="text-blue-100 text-sm">
              Asignar productos para entrega
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded p-1.5 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loadingProductos ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando productos...</span>
            </div>
          ) : (
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
                          <span className="text-sm font-medium text-gray-900">
                            {producto.nombre}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                            {producto.categoria}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {producto.stockTotal}kg
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 px-3">
                      <p className="text-sm text-gray-500">
                        {searchTerm
                          ? "No se encontraron productos"
                          : "No hay productos disponibles"}
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
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Total
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {totalKg.toFixed(2)} kg
                    </span>
                  </div>
                </div>

                {/* Lista de productos asignados */}
                <div className="border border-gray-200 rounded-md max-h-80 overflow-y-auto">
                  {productosProgramados.length > 0 ? (
                    <div className="divide-y">
                      {productosProgramados.map((prod) => {
                        const producto = productosConLotes.find(
                          (p) => p.id === prod.id_producto
                        );
                        const loteAsignado = producto?.lotes.find(
                          (l) => l.id === prod.id_lote
                        );
                        return (
                          <div
                            key={prod.id_producto}
                            className="p-3 hover:bg-gray-50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900 block">
                                  {prod.nombreProducto}
                                </span>
                                {loteAsignado && (
                                  <span className="text-xs text-gray-500">
                                    Lote #{loteAsignado.id} - {loteAsignado.stockActual}kg disponible
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  handleEliminarProducto(prod.id_producto)
                                }
                                className="text-red-600 hover:text-red-700 ml-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Input de cantidad */}
                            <input
                              type="number"
                              min="0"
                              max={loteAsignado?.stockActual || 0}
                              step="1"
                              value={prod.cantidad_kg || ""}
                              onChange={(e) =>
                                handleCantidadChange(
                                  prod.id_producto,
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1 text-black border border-gray-300 rounded text-sm"
                              placeholder="Cantidad en kg"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-3">
                      <svg
                        className="mx-auto w-12 h-12 text-gray-300 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-sm text-gray-500">
                        No hay productos asignados
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Selecciona productos de la lista de la izquierda
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={productosProgramados.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Contenedor de notificaciones toast */}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
