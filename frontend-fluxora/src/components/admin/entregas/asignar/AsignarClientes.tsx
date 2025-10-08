"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PendingClientList from "@/components/ui/PendingClientList";

export function AsignarClientes() {
  return <PendingClientList />;
}
