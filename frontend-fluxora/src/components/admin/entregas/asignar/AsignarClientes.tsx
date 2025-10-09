"use client";
import React, { Fragment } from "react";
import PendingClientList from "@/components/ui/PendingClientList";

export function AsignarClientes() {
  return (
    <Fragment>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Asignar Rutas</h2>
        <p className="text-sm text-gray-500">
          Asigna clientes pendientes a rutas de entrega existentes.
        </p>
      </div>
      <PendingClientList />
    </Fragment>
  );
}
