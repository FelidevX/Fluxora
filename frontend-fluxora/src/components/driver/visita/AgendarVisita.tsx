"use client";

import React, { useEffect, useState } from "react";
import { FormularioEntrega } from "@/interfaces/entregas/driver";

interface AgendarVisitaData {
  fecha: string;
  [key: string]: string; // Para almacenar dinámicamente cada producto
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
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const obtenerDatosFormulario = async () => {
    try {
      let today = new Date();
      
      // Formatear la fecha como dd-mm-yyyy
      const day = today.getDate().toString().padStart(2, '0');
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear();
      const fechaFormateada = `${day}-${month}-${year}`;

      let token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/rutas-por-fecha/${fechaFormateada}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Error al obtener las entregas del día.");
      }

      const data = await response.json();
      setDatosFormulario(data);
      console.log("Datos del formulario obtenidos:", data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    obtenerDatosFormulario();
  }, []);

  const clienteActual = datosFormulario
    .flatMap(ruta => ruta.clientes)
    .find(clienteData => clienteData.cliente.id === clienteId);

  useEffect(() => {
    if (clienteActual) {
      const productosAgendados: { [key: string]: string } = {
        fecha: tomorrow.toISOString().split('T')[0],
      };

      clienteActual.productosProgramados.forEach((producto: any) => {
        productosAgendados[producto.nombreProducto] = formularioData[producto.nombreProducto] || producto.cantidad_kg?.toString() || "";
      });

      setAgendarData(productosAgendados);
      console.log("Datos precargados para agendar:", productosAgendados);
    }
  }, [clienteActual, formularioData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agendarData.fecha) {
      alert("Por favor, complete la fecha para la próxima visita.");
      return;
    }

    const productoConCantidad = clienteActual.productosProgramados.some(
      (producto: any) => {
        const cantidad = parseFloat(agendarData[producto.nombreProducto] || "0");
        return cantidad > 0;
      }
    );

    if (!productoConCantidad) {
      alert("Por favor, ingrese al menos una cantidad para algún producto de la próxima visita.");
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

      console.log("rutaId recibido:", rutaId);
      console.log("pedidoId recibido:", pedidoId);
      console.log("clienteId:", clienteId);

      // 1. POST para registrar la entrega actual
      const corriente = clienteActual.productosProgramados
        .filter((p: any) => p.tipoProducto === "CORRIENTE")
        .reduce((sum: number, p: any) => sum + parseFloat(formularioData[p.nombreProducto] || "0"), 0);

      const especial = clienteActual.productosProgramados
        .filter((p: any) => p.tipoProducto === "ESPECIAL")
        .reduce((sum: number, p: any) => sum + parseFloat(formularioData[p.nombreProducto] || "0"), 0);

      const entregaPayload = {
        id_pedido: pedidoId,
        id_cliente: clienteId,
        comentario: formularioData.comentario || "",
        corriente_entregado: corriente,
        especial_entregado: especial,
        hora_entregada: new Date().toISOString(),
      };

      console.log("Registrando entrega:", entregaPayload);

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

      // Calcular totales por tipo para la próxima visita
      const corrienteTotal = clienteActual.productosProgramados
        .filter((p: any) => p.tipoProducto === "CORRIENTE")
        .reduce((sum: number, p: any) => sum + parseFloat(agendarData[p.nombreProducto] || "0"), 0);

      const especialTotal = clienteActual.productosProgramados
        .filter((p: any) => p.tipoProducto === "ESPECIAL")
        .reduce((sum: number, p: any) => sum + parseFloat(agendarData[p.nombreProducto] || "0"), 0);

      // 2. POST para agendar la próxima entrega
      const productos = clienteActual.productosProgramados.map((producto: any) => ({
        id_producto: producto.id_producto,
        id_lote: producto.id_lote,
        nombreProducto: producto.nombreProducto,
        tipoProducto: producto.tipoProducto,
        cantidad_kg: parseFloat(agendarData[producto.nombreProducto] || "0"),
      }));

      const programacionPayload = {
        idRuta: rutaId,
        idCliente: clienteId,
        fechaProgramacion: agendarData.fecha,
        productos,
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

      alert("Entrega registrada y próxima visita agendada correctamente.");
      onComplete(agendarData, clienteId);
    } catch (error) {
      console.error("Error al procesar:", error);
      alert("Hubo un error al procesar la información. Por favor, inténtelo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const calcularTotalEntrega = () => {
    if (!clienteActual?.productosProgramados) return "0";

    const total = clienteActual.productosProgramados.reduce((sum: number, producto: any) => {
      const cantidad = parseFloat(formularioData[producto.nombreProducto] ?? 0);
      let precio = 0;
      if (producto.tipoProducto === "CORRIENTE") precio = 7500;
      if (producto.tipoProducto === "ESPECIAL") precio = 8000;
      return sum + (isNaN(cantidad) ? 0 : cantidad * precio);
    }, 0);

    return total.toLocaleString();
  };

  const calcularTotalProgramado = () => {
    if (!clienteActual?.productosProgramados) return "0";

    const total = clienteActual.productosProgramados.reduce((sum: number, producto: any) => {
      const cantidad = parseFloat(agendarData[producto.nombreProducto] ?? 0);
      let precio = 0;
      if (producto.tipoProducto === "CORRIENTE") precio = 7500;
      if (producto.tipoProducto === "ESPECIAL") precio = 8000;
      return sum + (isNaN(cantidad) ? 0 : cantidad * precio);
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
        <h3 className="font-semibold text-gray-800 mb-1">Agendar Próxima Visita</h3>
        <p className="text-gray-600">{clienteNombre}</p>
      </div>

      {/* Resumen de la entrega actual */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-800 mb-2">Resumen de Entrega Actual</h4>
        <div className="text-sm text-blue-700 space-y-1">
          {clienteActual?.productosProgramados.map((producto: any, idx: number) => {
            const cantidad = parseFloat(formularioData[producto.nombreProducto] || "0");
            if (cantidad > 0) {
              return (
                <p key={idx}>
                  {producto.nombreProducto}: {cantidad} KG
                </p>
              );
            }
            return null;
          })}
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
            <h4 className="font-medium text-green-800 mb-3">Cantidades Programadas para la Próxima Visita</h4>
            
            {clienteActual?.productosProgramados.map((producto: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2">
                <span className="text-gray-700 font-medium">{producto.nombreProducto}:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={agendarData[producto.nombreProducto] || ""}
                    onChange={(e) =>
                      setAgendarData((prev) => ({
                        ...prev,
                        [producto.nombreProducto]: e.target.value,
                      }))
                    }
                    className="w-32 px-3 py-1 border border-gray-300 rounded text-center text-gray-600"
                    placeholder={producto.cantidad_kg?.toString() || "0"}
                  />
                  <span className="text-gray-600 font-medium">KG</span>
                </div>
              </div>
            ))}

            <div className="text-sm text-green-700 mt-3">
              <p>Corriente = $ 7500</p>
              <p>Especial = $ 8000</p>
              <p className="font-medium pt-2">Total programado: $ {calcularTotalProgramado()}</p>
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
    </div>
  );
}