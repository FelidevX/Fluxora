"use client";

import { CompraMateriaPrimaResponse } from "@/types/inventario";
import Modal from "./Modal";
import MaterialIcon from "./MaterialIcon";

interface ModalPagoCompraProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  compra: CompraMateriaPrimaResponse | null;
  loading?: boolean;
}

export default function ModalPagoCompra({
  isOpen,
  onClose,
  onConfirm,
  compra,
  loading = false,
}: ModalPagoCompraProps) {
  if (!compra) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirmar Pago de Factura"
      confirmText={loading ? "Procesando..." : "Marcar como Pagado"}
      cancelText="Cancelar"
      confirmVariant="success"
      size="md"
    >
      <div className="space-y-4">
        {/* Icono */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <MaterialIcon name="payments" className="h-6 w-6 text-green-600" />
        </div>

        {/* Mensaje */}
        <p className="text-center text-gray-600">
          ¿Está seguro que desea marcar esta factura como pagada?
        </p>

        {/* Detalles de la compra */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">N° Documento:</span>
            <span className="text-gray-900">{compra.numDoc}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Tipo:</span>
            <span className="text-gray-900">{compra.tipoDoc}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Proveedor:</span>
            <span className="text-gray-900">{compra.proveedor}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Monto Total:</span>
            <span className="text-gray-900 font-semibold">
              ${compra.montoTotal.toLocaleString("es-CL")}
            </span>
          </div>
          {compra.fechaPago && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Fecha de Pago:</span>
              <span className="text-gray-900">
                {new Date(compra.fechaPago).toLocaleDateString("es-ES")}
              </span>
            </div>
          )}
        </div>

        {/* Advertencia */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <MaterialIcon name="info" className="w-5 h-5 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800">
            Esta acción marcará la factura como saldada.
          </p>
        </div>
      </div>
    </Modal>
  );
}
