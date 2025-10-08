"use client";

import { useState } from "react";
import PantallaFormulario from "../formulario/PantallaFormulario";
import PantallaAgendarVisita from "../visita/AgendarVisita";
import { Entrega, FormularioEntrega } from "@/interfaces/entregas/driver";

interface FormularioContainerProps {
  entrega: Entrega;
  onComplete: () => void;
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
    console.log("Datos entrega", entrega);
    setCurrentStep('agendar');
  };

  const handleBack = () => {
    setCurrentStep('formulario');
  };

  const handleAgendarComplete = () => {
    console.log("Proceso completado");
    onComplete();
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
        onComplete={handleAgendarComplete}
        onBack={handleBack}
      />
    );
  }

  return null;
}