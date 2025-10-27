"use client";

import { useEffect, useState } from "react";
import { Entrega, FormularioEntrega } from "@/interfaces/entregas/driver";

interface PantallaFormularioProps {
  entrega: Entrega;
  onContinue: (formData: FormularioEntrega) => void;
  onCancel: () => void;
}

export default function PantallaFormulario({
  entrega,
  onContinue,
  onCancel,
}: PantallaFormularioProps) {
  const [formData, setFormData] = useState<FormularioEntrega>({
    corriente: "",
    especial: "",
    comentario: "",
  });

  const [datosFormulario, setDatosFormulario] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const corrienteTotal = clienteActual.productosProgramados
      .filter((p: any) => p.tipoProducto === "CORRIENTE")
      .reduce(
        (sum: number, p: any) =>
          sum + parseFloat(formData[p.nombreProducto] || "0"),
        0
      );

    const especialTotal = clienteActual.productosProgramados
      .filter((p: any) => p.tipoProducto === "ESPECIAL")
      .reduce(
        (sum: number, p: any) =>
          sum + parseFloat(formData[p.nombreProducto] || "0"),
        0
      );

    const productoConCantidad = clienteActual.productosProgramados.some(
      (producto: any) => {
        const cantidad = parseFloat(
          formData[producto.nombreProducto] ?? producto.cantidad_kg ?? 0
        );
        return cantidad > 0;
      }
    );

    if (!productoConCantidad) {
      alert("Por favor, ingrese al menos una cantidad para algún producto.");
      return;
    }

    // Crear array de productos con toda la información
    const productosEntregados = clienteActual.productosProgramados.map(
      (producto: any) => ({
        id_producto: producto.id_producto,
        id_lote: producto.id_lote,
        nombreProducto: producto.nombreProducto,
        tipoProducto: producto.tipoProducto,
        cantidad_kg: parseFloat(formData[producto.nombreProducto] || "0"),
      })
    );

    onContinue({
      ...formData,
      corriente: corrienteTotal.toString(),
      especial: especialTotal.toString(),
      productos: productosEntregados,
    });
  };

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
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDatosFormulario();
  }, []);

  const clienteActual = datosFormulario
    .flatMap((ruta) => ruta.clientes)
    .find((clienteData) => clienteData.cliente.id === entrega.id_cliente);

  useEffect(() => {
    if (clienteActual) {
      const productosForm: { [key: string]: string } = {};
      clienteActual.productosProgramados.forEach((producto: any) => {
        productosForm[producto.nombreProducto] =
          producto.cantidad_kg?.toString() || "";
      });

      setFormData({
        corriente:
          clienteActual.productosProgramados
            .find((p: any) => p.tipoProducto === "CORRIENTE")
            ?.cantidad_kg?.toString() || "",
        especial:
          clienteActual.productosProgramados
            .find((p: any) => p.tipoProducto === "ESPECIAL")
            ?.cantidad_kg?.toString() || "",
        comentario: "",
        ...productosForm,
      });
      console.log("Formulario prellenado con datos del cliente:", formData);
    }
  }, [clienteActual]);

  const calcularTotal = () => {
    if (!clienteActual?.productosProgramados) return "0";

    const total = clienteActual.productosProgramados.reduce(
      (sum: number, producto: any) => {
        const cantidad = parseFloat(
          formData[producto.nombreProducto] ?? producto.cantidad_kg ?? 0
        );
        let precio = 0;

        // Usar precios personalizados del cliente o valores por defecto
        if (producto.tipoProducto === "CORRIENTE") {
          precio = clienteActual.cliente.precioCorriente ?? 1200;
        }
        if (producto.tipoProducto === "ESPECIAL") {
          precio = clienteActual.cliente.precioEspecial ?? 1500000;
        }

        return sum + (isNaN(cantidad) ? 0 : cantidad * precio);
      },
      0
    );

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
          {clienteActual?.cliente.nombreNegocio || entrega.cliente}
        </h3>
        <p className="text-gray-600">
          {clienteActual?.cliente.direccion || entrega.direccion}
        </p>
        {clienteActual && (
          <div className="text-sm text-gray-500 mt-2">
            <p>Programado - Corriente: {formData.corriente} KG</p>
            <p>
              Programado - Especial:{" "}
              {formData.especial === "" ? 0 : formData.especial} KG
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {clienteActual?.productosProgramados.map(
          (producto: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-blue-500 rounded-lg p-4 mb-2"
            >
              <span className="text-white font-bold">
                {producto.nombreProducto}:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={formData[producto.nombreProducto] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [producto.nombreProducto]: e.target.value,
                    }))
                  }
                  className="w-32 px-3 py-1 border bg-gray-100 border-gray-300 rounded text-center text-gray-700"
                  placeholder={producto.cantidad_kg?.toString() || "0"}
                />
                <span className="text-white font-medium">KG</span>
                <button
                  type="button"
                  className="text-white hover:text-blue-800"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
          )
        )}

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Observaciones:
          </label>
          <textarea
            value={formData.comentario}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                comentario: e.target.value,
              }))
            }
            placeholder="Ingrese sus observaciones..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-gray-600"
          />
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            Corriente = ${" "}
            {clienteActual?.cliente.precioCorriente?.toLocaleString() ??
              "0,000"}
          </p>
          <p>
            Especial = ${" "}
            {clienteActual?.cliente.precioEspecial?.toLocaleString() ?? "0,000"}
          </p>
          <p className="font-medium">Monto total: $ {calcularTotal()}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium"
          >
            CONTINUAR
          </button>
        </div>
      </form>
    </div>
  );
}
