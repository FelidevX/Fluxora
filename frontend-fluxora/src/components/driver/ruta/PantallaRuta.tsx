"use client";

export default function PantallaRuta() {
  return (
    <div className="p-4">
      <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center mb-4">
        <div className="text-center text-gray-500">
          <span className="material-symbols-outlined text-4xl mb-2 block">
            map
          </span>
          <p>Mapa de ruta</p>
          <p className="text-sm">Aquí va el mapa lol</p>
        </div>
      </div>
      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
        VER CLIENTES
      </button>
    </div>
  );
}
