'use client'
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const RepartosPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'clientes' | 'repartos'>('repartos');

  const handleTabClick = (tab: 'clientes' | 'repartos') => {
    setActiveTab(tab);
    if (tab === 'clientes') {
      router.push('/dashboard/clientes');
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de repartos</h1>
          <p className="text-gray-600">📅 {new Date().toLocaleDateString('es-CL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            🖨️ Imprimir hoja de ruta
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            📊 Exportar a Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 bg-gray-100 rounded-lg w-fit">
        <button
          className={`px-6 py-2 rounded-l-lg font-semibold transition-colors ${
            activeTab === 'clientes' ? 'bg-white text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => handleTabClick('clientes')}
        >
          clientes
        </button>
        <button
          className={`px-6 py-2 rounded-r-lg font-semibold transition-colors ${
            activeTab === 'repartos' ? 'bg-white text-blue-600' : 'text-gray-600'
          }`}
          onClick={() => handleTabClick('repartos')}
        >
          repartos
        </button>
      </div>

      <div>
      </div>
    </div>
  );
};

export default RepartosPage;