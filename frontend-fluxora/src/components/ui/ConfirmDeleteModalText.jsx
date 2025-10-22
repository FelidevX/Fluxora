import React, { useState } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";

const ConfirmDeleteModalText = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Eliminación",
  message,
  itemName,
  isLoading = false,
  requireConfirmation = false,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = !requireConfirmation || confirmText === "CONFIRMAR";

  // Resetear el texto cuando se cierra el modal
  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmValid) {
      setConfirmText("");
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <MaterialIcon name="warning" className="text-red-600 mt-0.5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <MaterialIcon name="close" className="text-red-600 mt-0.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">{message}</p>
          {itemName && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <p className="text-sm text-gray-500 mb-1">Elemento a eliminar:</p>
              <p className="font-medium text-gray-900">{itemName}</p>
            </div>
          )}

          {/* Input de Confirmación */}
          {requireConfirmation && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escribe{" "}
                <span className="font-bold text-red-600">CONFIRMAR</span> para
                continuar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe CONFIRMAR"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700"
                autoComplete="off"
              />
              {confirmText && confirmText !== "CONFIRMAR" && (
                <p className="text-sm text-red-500 mt-1">
                  El texto no coincide
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !isConfirmValid}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-icons animate-spin text-base">
                  refresh
                </span>
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModalText;
