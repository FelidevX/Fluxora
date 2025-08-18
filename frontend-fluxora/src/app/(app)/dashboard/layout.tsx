import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50 md:grid md:grid-cols-[260px_1fr]">
      <Sidebar />
      <main className="min-h-dvh w-full">
        {/* Cada módulo renderiza su propio header/contenido */}
        {children}
      </main>
    </div>
  );
}