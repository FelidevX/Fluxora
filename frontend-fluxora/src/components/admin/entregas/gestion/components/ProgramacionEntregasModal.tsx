import { useState } from "react";
import { RutaActiva } from "@/interfaces/entregas/entregas";

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

interface ProgramacionEntregasModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruta: RutaActiva | null;
  fechaProgramacion: string;
  setFechaProgramacion: (fecha: string) => void;
  rutasProgramadas: any[];
  loadingProgramacion: boolean;
  productosConLotes: ProductoConLotes[];
  loadingProductos: boolean;
  onActualizarProductos: (
    idRuta: number,
    idCliente: number,
    productos: ProductoProgramado[]
  ) => void;
}

export function ProgramacionEntregasModal({
  isOpen,
  onClose,
  ruta,
  fechaProgramacion,
  setFechaProgramacion,
  rutasProgramadas,
  loadingProgramacion,
  productosConLotes,
  loadingProductos,
  onActualizarProductos,
}: ProgramacionEntregasModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="relative mx-auto bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden w-full max-w-7xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">
              {ruta ? `${ruta.nombre}` : "Programación de Entregas"}
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Asigna productos específicos a cada cliente de la ruta
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selector de fecha */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <label className="text-sm font-medium text-gray-700">
                Fecha de Entrega:
              </label>
            </div>
            <input
              type="date"
              value={fechaProgramacion}
              onChange={(e) => setFechaProgramacion(e.target.value)}
              className="px-3 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-6">
          {loadingProgramacion || loadingProductos ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">
                {loadingProductos ? "Cargando productos disponibles..." : "Cargando programación..."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {rutasProgramadas.length > 0 ? (
                rutasProgramadas.map((rutaProg) => (
                  <div
                    key={rutaProg.ruta.id}
                    className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-600 rounded-lg p-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">
                              {rutaProg.ruta.nombre}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {rutaProg.totalClientes} clientes en esta ruta
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                                {rutaProg.totalKgCorriente || 0}kg Corriente
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                                {rutaProg.totalKgEspecial || 0}kg Especial
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {rutaProg.clientes.map((clienteData: any) => (
                          <ClienteProgramacionCard
                            key={clienteData.cliente.id}
                            clienteData={clienteData}
                            productosConLotes={productosConLotes}
                            onActualizarProductos={onActualizarProductos}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay programación para esta fecha
                  </h3>
                  <p className="text-gray-500">
                    Selecciona otra fecha para ver las entregas programadas
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal de edición de productos del cliente
interface EditProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteData: any;
  productosConLotes: ProductoConLotes[];
  onGuardar: (productos: ProductoProgramado[]) => void;
}

function EditProductsModal({
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

  if (!isOpen) return null;

  const productosDisponibles = productosConLotes.filter(
    (p) =>
      p.lotes.some(
        lote =>
          !productosProgramados.some(pp => pp.id_lote === lote.id)
          && lote.stockActual > 0
      )
  );

  const lotesDisponibles = productosConLotes.flatMap(p =>
    p.lotes
      .filter(lote =>
        !productosProgramados.some(pp => pp.id_lote === lote.id) && lote.stockActual > 0
      )
      .map(lote => ({
        producto: p,
        lote,
      }))
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
      alert("Debes agregar al menos un producto con cantidad mayor a 0");
      return;
    }
    onGuardar(productosValidos);
    onClose();
  };


  console.log('productosProgramados', productosProgramados);
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
    </div>
  );
}

// Componente simplificado para cada cliente
interface ClienteProgramacionCardProps {
  clienteData: any;
  productosConLotes: ProductoConLotes[];
  onActualizarProductos: (
    idRuta: number,
    idCliente: number,
    productos: ProductoProgramado[]
  ) => void;
}

function ClienteProgramacionCard({
  clienteData,
  productosConLotes,
  onActualizarProductos,
}: ClienteProgramacionCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const productosProgramados = clienteData.productosProgramados || [];
  
  const totalKgCorriente = productosProgramados
    .filter((p: ProductoProgramado) => p.tipoProducto === "CORRIENTE")
    .reduce((sum: number, p: ProductoProgramado) => sum + p.cantidad_kg, 0);

  const totalKgEspecial = productosProgramados
    .filter((p: ProductoProgramado) => p.tipoProducto === "ESPECIAL")
    .reduce((sum: number, p: ProductoProgramado) => sum + p.cantidad_kg, 0);

  const handleGuardar = (productos: ProductoProgramado[]) => {
    onActualizarProductos(
      clienteData.rutaCliente.id_ruta,
      clienteData.rutaCliente.id_cliente,
      productos
    );
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2.5 border-b border-gray-200">
          <div className="flex items-start justify-between mb-1">
            <h5 className="font-semibold text-gray-900 text-sm">
              {clienteData.cliente.nombre}
            </h5>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              clienteData.rutaCliente.estado === "completado" 
                ? "bg-green-100 text-green-800" 
                : clienteData.rutaCliente.estado === "en_proceso"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}>
              {clienteData.rutaCliente.estado || "Pendiente"}
            </div>
          </div>
          <p className="text-xs text-gray-600">{clienteData.cliente.nombreNegocio}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{clienteData.cliente.direccion}</span>
          </p>
        </div>

        <div className="p-3">
          {productosProgramados.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                  <div className="text-xs text-blue-600">Corriente</div>
                  <div className="text-sm font-bold text-blue-900">{totalKgCorriente.toFixed(1)}kg</div>
                </div>
                <div className="bg-purple-50 rounded p-2 border border-purple-200">
                  <div className="text-xs text-purple-600">Especial</div>
                  <div className="text-sm font-bold text-purple-900">{totalKgEspecial.toFixed(1)}kg</div>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-3">
                {productosProgramados.length} producto{productosProgramados.length !== 1 ? 's' : ''} asignado{productosProgramados.length !== 1 ? 's' : ''}
              </div>
            </>
          ) : (
            <div className="text-center py-4 mb-3">
              <svg className="mx-auto w-8 h-8 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-xs text-gray-500">Sin productos</p>
            </div>
          )}

          <button
            onClick={() => setShowEditModal(true)}
            className="w-full px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-md transition-colors"
          >
            {productosProgramados.length > 0 ? 'Editar Productos' : 'Asignar Productos'}
          </button>
        </div>
      </div>

      <EditProductsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        clienteData={clienteData}
        productosConLotes={productosConLotes}
        onGuardar={handleGuardar}
      />
    </>
  );
}
