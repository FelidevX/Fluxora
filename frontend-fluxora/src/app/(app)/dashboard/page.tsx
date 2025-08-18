export default function DashboardHome() {
  // pt-14: deja espacio para el botón flotante del menú en móviles
  return (
    <div className="px-4 sm:px-6 md:px-8 pt-14 md:pt-6 pb-8">
      {/* Header del módulo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inicio</h1>
          <p className="text-sm text-gray-500 font-semibold">Resumen de hoy</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 cursor-pointer">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="1.6"/></svg>
            Actualizar
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Generar hoja
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Entregas del día', value: '24', trend: '+12% vs ayer', trendColor: 'text-emerald-600' },
          { title: 'Productos vendidos', value: '1,240', trend: '+8% vs ayer', trendColor: 'text-emerald-600' } ,
          { title: 'Inventario bajo', value: '5', trend: '-8% vs ayer', trendColor: 'text-rose-600' },
          { title: 'Discrepancia', value: '3.2 %', trend: '-1.5% vs ayer', trendColor: 'text-rose-600' },
        ].map((kpi) => (
          <div key={kpi.title} className="rounded-xl border-3 border-blue-500 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500">{kpi.title}</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-semibold text-gray-900">{kpi.value}</span>
              <span className={`text-xs ${kpi.trendColor}`}>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Paneles */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border-3 border-blue-500 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Ventas de la semana</h2>
          <p className="text-sm text-gray-500">Resumen de los últimos 7 días</p>
          <div className="mt-4 h-56 w-full rounded-md bg-gradient-to-br from-gray-50 to-white ring-1 ring-gray-100" />
        </div>

        <div className="rounded-xl border-3 border-blue-500 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Alerta de inventario bajo</h2>
            <span className="text-xs rounded-full bg-rose-50 px-2 py-1 text-rose-700">5 productos</span>
          </div>
          <div className="mt-3 divide-y divide-gray-100">
            {[
              { p: 'Harina de trigo', a: '15 Kg', m: '50 Kg', e: '30%' },
              { p: 'Azúcar', a: '8 Kg', m: '25 Kg', e: '32%' },
              { p: 'Levadura', a: '2 Kg', m: '10 Kg', e: '20%' },
              { p: 'Mantequilla', a: '5 Kg', m: '20 Kg', e: '25%' },
              { p: 'Huevos', a: '24 U', m: '100 U', e: '24%' },
            ].map((row) => (
              <div key={row.p} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{row.p}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">A: {row.a}</span>
                  <span className="text-gray-500">M: {row.m}</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">{row.e}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}