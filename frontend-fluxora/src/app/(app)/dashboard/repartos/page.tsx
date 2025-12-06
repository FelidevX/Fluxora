"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const RepartosPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"clientes" | "repartos">(
    "repartos"
  );

  const handleTabClick = (tab: "clientes" | "repartos") => {
    setActiveTab(tab);
    if (tab === "clientes") {
      router.push("/dashboard/clientes");
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50 mt-12 md:mt-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Gestión de repartos
          </h1>
          <p className="text-sm text-gray-600">
            📅{" "}
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3"></div>
      </div>
    </div>
  );
};

export default RepartosPage;
