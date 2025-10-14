"use client";

import { useState } from "react";
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

  if (currentStep === 'formulario') {
    return (
      <PantallaFormulario
        entrega={entrega}
        onContinue={handleContinue}
        onCancel={onCancel}
      />
    );
  }

  if (currentStep === 'agendar' && formularioData) {
    return (
      <PantallaAgendarVisita
        formularioData={formularioData}
        clienteId={entrega.id_cliente}
        clienteNombre={entrega.cliente}
        rutaId={entrega.id_ruta}
        pedidoId={entrega.id_pedido}
        onComplete={handleAgendarComplete}
        onBack={handleBack}
      />
    );
  }

  return null;
}