"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PantallaFormulario from "../formulario/PantallaFormulario";
import PantallaAgendarVisita from "../visita/AgendarVisita";
import { Entrega, FormularioEntrega } from "@/interfaces/entregas/driver";

interface FormularioContainerProps {
  entrega: Entrega;
  onComplete: (clienteId: number) => void;
  onCancel: () => void;
}

export default function FormularioContainer({
  entrega,
  onComplete,
  onCancel,
}: FormularioContainerProps) {
  const [currentStep, setCurrentStep] = useState<'formulario' | 'agendar'>('formulario');
  const [formularioData, setFormularioData] = useState<FormularioEntrega | null>(null);

  const handleContinue = (formData: FormularioEntrega) => {
    setFormularioData(formData);
    setCurrentStep('agendar');
  };

  const handleBack = () => {
    setCurrentStep('formulario');
  };

  const handleAgendarComplete = (agendarData: any, clienteId: number) => {
    console.log("Proceso completado para cliente:", clienteId);
    onComplete(clienteId); // Pasar clienteId al padre
  };

  return (
    <AnimatePresence mode="wait">
      {currentStep === 'formulario' && (
        <motion.div
          key="formulario"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <PantallaFormulario
            entrega={entrega}
            onContinue={handleContinue}
            onCancel={onCancel}
          />
        </motion.div>
      )}

      {currentStep === 'agendar' && formularioData && (
        <motion.div
          key="agendar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <PantallaAgendarVisita
            formularioData={formularioData}
            clienteId={entrega.id_cliente}
            clienteNombre={entrega.cliente}
            rutaId={entrega.id_ruta}
            pedidoId={entrega.id_pedido}
            onComplete={handleAgendarComplete}
            onBack={handleBack}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}