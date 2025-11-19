"use client";

import React, { useEffect, useState } from "react";
import { FormularioEntrega } from "@/interfaces/entregas/driver";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

interface AgendarVisitaData {
  fecha: string;
  [key: string]: string;
}

interface Lote {
  id: number;
  numeroLote: string;
  stockActual: number;
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

interface ProductoAgendado {
  id_producto: number;
  id_lote: number;
  nombreProducto: string;
  tipoProducto: string;
  cantidad_kg: number;
}

interface PantallaAgendarVisitaProps {
  formularioData: FormularioEntrega;
  clienteId: number;
  pedidoId: number;
  clienteNombre: string;
  rutaId: number;
  onComplete: (agendarData: AgendarVisitaData, clienteId: number) => void;
  onBack: () => void;
}

export default function PantallaAgendarVisita({
  formularioData,
  clienteId,
  clienteNombre,
  rutaId,
  pedidoId,
  onComplete,
  onBack,
}: PantallaAgendarVisitaProps) {
  const [agendarData, setAgendarData] = useState<AgendarVisitaData>({
    fecha: "",
  });

  const [datosFormulario, setDatosFormulario] = useState<any[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<
    ProductoConLotes[]
  >([]);
  const [productosAgendados, setProductosAgendados] = useState<
    ProductoAgendado[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarSelectProducto, setMostrarSelectProducto] = useState(false);

  // Hook para notificaciones
  const { toasts, removeToast, success, error: showError, warning } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const obtenerDatosFormulario = async () => {
    try {
      let today = new Date();

      const day = today.getDate().toString().padStart(2, "0");
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const year = today.getFullYear();
      const fechaFormateada = `${day}-${month}-${year}`;

      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-por-fecha/${fechaFormateada}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener las entregas del día.");
      }

      const data = await response.json();
      setDatosFormulario(data);
    } catch (err) {
      console.error("Error al obtener datos:", err);
      showError("Error al obtener las entregas del día", "Error de Carga");
    } finally {
      setLoading(false);
    }
  };

  const obtenerProductosDisponibles = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const productosResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/productos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!productosResponse.ok) {
        throw new Error(
          `Error al obtener productos: ${productosResponse.status}`
        );
      }

      const productos = await productosResponse.json();

      const productosConLotesData: ProductoConLotes[] = await Promise.all(
        productos.map(async (producto: any) => {
          try {
            const lotesResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/inventario/productos/${producto.id}/lotes`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            let lotes: Lote[] = [];
            if (lotesResponse.ok) {
              const lotesData = await lotesResponse.json();
              lotes = lotesData.filter(
                (lote: Lote) =>
                  lote.estado === "disponible" && lote.stockActual > 0
              );
            }

            const stockTotal = lotes.reduce(
              (sum, lote) => sum + lote.stockActual,
              0
            );

            return {
              id: producto.id,
              nombre: producto.nombre,
              categoria: producto.categoria,
              tipoProducto: producto.tipoProducto,
              precio: producto.precio,
              lotes: lotes,
              stockTotal: stockTotal,
            };
          } catch (error) {
            console.error(
              `Error al obtener lotes del producto ${producto.id}:`,
              error
            );
            return {
              id: producto.id,
              nombre: producto.nombre,
              categoria: producto.categoria,
              tipoProducto: producto.tipoProducto,
              precio: producto.precio,
              lotes: [],
              stockTotal: 0,
            };
          }
        })
      );

      setProductosDisponibles(
        productosConLotesData.filter((p) => p.stockTotal > 0)
      );
    } catch (err) {
      console.error("Error al obtener productos disponibles:", err);
      showError("Error al cargar productos disponibles", "Error de Carga");
    }
  };

  useEffect(() => {
    obtenerDatosFormulario();
    obtenerProductosDisponibles();
  }, []);

  const clienteActual = datosFormulario
    .flatMap((ruta) => ruta.clientes)
    .find((clienteData) => clienteData.cliente.id === clienteId);

  useEffect(() => {
    if (clienteActual) {
      const productosAgendadosIniciales: ProductoAgendado[] =
        clienteActual.productosProgramados.map((producto: any) => ({
          id_producto: producto.id_producto,
          id_lote: producto.id_lote,
          nombreProducto: producto.nombreProducto,
          tipoProducto: producto.tipoProducto,
          cantidad_kg: parseFloat(
            formularioData[producto.nombreProducto] ||
              producto.cantidad_kg?.toString() ||
              "0"
          ),
        }));

      setProductosAgendados(productosAgendadosIniciales);
      setAgendarData({ fecha: tomorrow.toISOString().split("T")[0] });
    }
  }, [clienteActual, formularioData]);

  const agregarProducto = (productoId: number, loteId: number) => {
    const producto = productosDisponibles.find((p) => p.id === productoId);
    if (!producto) return;

    const yaExiste = productosAgendados.some(
      (p) => p.id_producto === productoId && p.id_lote === loteId
    );

    if (yaExiste) {
      warning("Este producto con este lote ya está en la lista.", "Producto Duplicado");
      return;
    }

    const nuevoProducto: ProductoAgendado = {
      id_producto: productoId,
      id_lote: loteId,
      nombreProducto: producto.nombre,
      tipoProducto: producto.tipoProducto,
      cantidad_kg: 0,
    };

    setProductosAgendados([...productosAgendados, nuevoProducto]);
    setMostrarSelectProducto(false);
  };

  const eliminarProducto = (index: number) => {
    setProductosAgendados(productosAgendados.filter((_, i) => i !== index));
  };

  const actualizarCantidad = (index: number, cantidad: number) => {
    const nuevosProductos = [...productosAgendados];
    nuevosProductos[index].cantidad_kg = cantidad;
    setProductosAgendados(nuevosProductos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agendarData.fecha) {
      warning("Por favor, complete la fecha para la próxima visita.", "Fecha Requerida");
      return;
    }

    const productoConCantidad = productosAgendados.some(
      (p) => p.cantidad_kg > 0
    );

    if (!productoConCantidad) {
      warning(
        "Por favor, ingrese al menos una cantidad para algún producto de la próxima visita.",
        "Cantidades Requeridas"
      );
      return;
    }

    setIsLoading(true);
    try {
      let token = localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      // 1. POST para registrar la entrega actual
      const productosEntregados =
        formularioData.productos ||
        clienteActual.productosProgramados.map((p: any) => ({
          id_producto: p.id_producto,
          id_lote: p.id_lote,
          nombreProducto: p.nombreProducto,
          tipoProducto: p.tipoProducto,
          cantidad_kg: parseFloat(formularioData[p.nombreProducto] || "0"),
        }));

      const corriente = productosEntregados
        .filter((p: any) => p.tipoProducto === "CORRIENTE")
        .reduce((sum: number, p: any) => sum + (p.cantidad_kg || 0), 0);

      const especial = productosEntregados
        .filter((p: any) => p.tipoProducto === "ESPECIAL")
        .reduce((sum: number, p: any) => sum + (p.cantidad_kg || 0), 0);

      const entregaPayload = {
        id_pedido: pedidoId,
        id_ruta: rutaId,
        fecha_programada: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
        id_cliente: clienteId,
        comentario: formularioData.comentario || "",
        corriente_entregado: corriente,
        especial_entregado: especial,
        hora_entregada: new Date().toISOString(),
        productos: productosEntregados.filter((p: any) => p.cantidad_kg > 0),
      };

      const entregaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/registrar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(entregaPayload),
        }
      );

      if (!entregaResponse.ok) {
        throw new Error("Error al registrar la entrega.");
      }

      // 2. POST para agendar la próxima entrega
      const programacionPayload = {
        idRuta: rutaId,
        idCliente: clienteId,
        fechaProgramacion: agendarData.fecha,
        productos: productosAgendados.filter((p) => p.cantidad_kg > 0),
      };

      console.log("Agendando entrega:", programacionPayload);

      const programarResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/programar-entrega`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(programacionPayload),
        }
      );

      if (!programarResponse.ok) {
        throw new Error("Error al agendar la entrega.");
      }

      success("Entrega registrada y próxima visita agendada correctamente.", "¡Operación Exitosa!");
      onComplete(agendarData, clienteId);
    } catch (err) {
      console.error("Error al procesar:", err);
      showError(
        "Hubo un error al procesar la información. Por favor, inténtelo de nuevo.",
        "Error al Procesar"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotalEntrega = () => {
    if (!clienteActual?.productosProgramados) return "0";

    const total = clienteActual.productosProgramados.reduce(
      (sum: number, producto: any) => {
        const cantidad = parseFloat(
          formularioData[producto.nombreProducto] ?? 0
        );
        let precio = 0;

        // Usar precios personalizados del cliente o valores por defecto
        if (producto.tipoProducto === "CORRIENTE") {
          precio = clienteActual.cliente.precioCorriente ?? 1200;
        }
        if (producto.tipoProducto === "ESPECIAL") {
          precio = clienteActual.cliente.precioEspecial ?? 1500;
        }

        return sum + (isNaN(cantidad) ? 0 : cantidad * precio);
      },
      0
    );

    return total.toLocaleString();
  };

  const calcularTotalProgramado = () => {
    const total = productosAgendados.reduce((sum: number, producto) => {
      let precio = 0;

      // Usar precios personalizados del cliente o valores por defecto
      if (producto.tipoProducto === "CORRIENTE") {
        precio = clienteActual?.cliente.precioCorriente ?? 1200;
      }
      if (producto.tipoProducto === "ESPECIAL") {
        precio = clienteActual?.cliente.precioEspecial ?? 1500;
      }

      return sum + producto.cantidad_kg * precio;
    }, 0);

    return total.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-1">
          Agendar Próxima Visita
        </h3>
        <p className="text-gray-600">{clienteNombre}</p>
      </div>

      {/* Resumen de la entrega actual */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-800 mb-2">
          Resumen de Entrega Actual
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          {clienteActual?.productosProgramados.map(
            (producto: any, idx: number) => {
              const cantidad = parseFloat(
                formularioData[producto.nombreProducto] || "0"
              );
              if (cantidad > 0) {
                return (
                  <p key={idx}>
                    {producto.nombreProducto}: {cantidad} KG
                  </p>
                );
              }
              return null;
            }
          )}
          <p className="font-medium pt-2">Total: $ {calcularTotalEntrega()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Fecha de próxima visita:
            </label>
            <input
              type="date"
              min={minDate}
              value={agendarData.fecha}
              onChange={(e) =>
                setAgendarData((prev) => ({ ...prev, fecha: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600"
              required
            />
          </div>

          {/* Cantidades programadas por producto */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-green-800">
                Productos para la Próxima Visita
              </h4>
              <button
                type="button"
                onClick={() => setMostrarSelectProducto(!mostrarSelectProducto)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium"
              >
                + Agregar Producto
              </button>
            </div>

            {mostrarSelectProducto && (
              <div className="bg-white rounded-lg p-3 mb-3 border-2 border-green-300">
                <label className="block text-gray-700 font-medium mb-2">
                  Seleccionar Producto:
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 mb-2"
                  onChange={(e) => {
                    const [productoId, loteId] = e.target.value
                      .split("-")
                      .map(Number);
                    if (productoId && loteId) {
                      agregarProducto(productoId, loteId);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">-- Seleccione un producto --</option>
                  {productosDisponibles.map((producto) =>
                    producto.lotes.map((lote) => (
                      <option
                        key={`${producto.id}-${lote.id}`}
                        value={`${producto.id}-${lote.id}`}
                      >
                        {producto.nombre} - Lote {lote.numeroLote} (Stock:{" "}
                        {lote.stockActual} KG)
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {productosAgendados.map((producto, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-white rounded-lg p-3 mb-2"
              >
                <span className="text-gray-700 font-medium flex-1">
                  {producto.nombreProducto}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={producto.cantidad_kg || ""}
                    onChange={(e) =>
                      actualizarCantidad(idx, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-gray-600"
                    placeholder="0"
                  />
                  <span className="text-gray-600 font-medium">KG</span>
                  <button
                    type="button"
                    onClick={() => eliminarProducto(idx)}
                    className="text-red-600 hover:text-red-800 ml-2"
                    title="Eliminar producto"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <div className="text-sm text-green-700 mt-3 pt-3 border-t border-green-200">
              <p>
                Corriente = ${" "}
                {clienteActual?.cliente.precioCorriente?.toLocaleString() ??
                  "7,500"}
              </p>
              <p>
                Especial = ${" "}
                {clienteActual?.cliente.precioEspecial?.toLocaleString() ??
                  "8,000"}
              </p>
              <p className="font-medium pt-2">
                Total programado: $ {calcularTotalProgramado()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            Atrás
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {isLoading ? "Procesando..." : "FINALIZAR"}
          </button>
        </div>
      </form>

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="bottom-right"
      />
    </div>
  );
}
