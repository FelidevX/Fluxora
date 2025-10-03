"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MaterialIcon from "@/components/ui/MaterialIcon";
import Image from "next/image";

// Utilidad para decodificar el JWT y extraer usuario
function getUserFromToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Pie del sidebar con usuario real y logout
function SidebarUserFooter() {
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(
    null
  );

  useEffect(() => {
    const u = getUserFromToken();
    console.log("JWT sidebar", u);
    setUser(u);
  }, []);

  return (
    <div className="mt-auto px-4 py-4 border-t border-white/10 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-col flex-1">
          <span className="text-sm font-semibold text-white">
            {user?.email || "Usuario"}
          </span>
          <span className="text-xs text-blue-100">{user?.role || "Rol"}</span>
        </div>
        <button
          title="Cerrar sesión"
          onClick={() => {
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
          }}
          className="p-2 rounded-full hover:bg-white/10 transition"
        >
          <MaterialIcon name="logout" className="text-xl text-white" />
        </button>
      </div>
      <div className="text-xs text-white/60 mt-2">v1.0</div>
    </div>
  );
}

type Item = { href: string; label: string; icon: string };

const items: Item[] = [
  { href: "/dashboard", label: "Inicio", icon: "home" },
  { href: "/dashboard/inventario", label: "Inventario", icon: "inventory_2" },
  { href: "/dashboard/entregas", label: "Pedidos y Entregas", icon: "local_shipping" },
  { href: "/dashboard/clientes", label: "Clientes y Rutas", icon: "groups" },

  {
    href: "/dashboard/facturacion",
    label: "Facturación",
    icon: "receipt_long",
  },
  { href: "/dashboard/reportes", label: "Reportes", icon: "assessment" },
  { href: "/dashboard/admin", label: "Administración", icon: "settings" },
];

// Sidebar responsive con off-canvas en móvil y fijo en md+
export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Cerrar al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cerrar con ESC y hacer foco al abrir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    if (open) setTimeout(() => firstLinkRef.current?.focus(), 0);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Evitar scroll del body cuando está abierto en móvil
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      {/* Botón flotante solo en móvil */}
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="sidebar"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/90 shadow backdrop-blur hover:bg-white"
      >
        <MaterialIcon name="menu" className="text-gray-700 text-xl" />
      </button>

      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <aside
        id="sidebar"
        ref={panelRef}
        className={[
          "z-50 md:z-0",
          "fixed md:static inset-y-0 left-0",
          "w-72 md:w-[260px]",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "transition-transform duration-200 ease-out",
          "bg-gradient-to-b from-blue-700 via-blue-600 to-blue-700",
          "text-white",
          "shadow-lg md:shadow-none",
          "flex flex-col",
        ].join(" ")}
      >
        {/* Branding */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/images/logos/fluxora-logo.svg"
              alt="Fluxora Logo"
              width={32}
              height={32}
              className="mr-3 brightness-0 invert"
            />
            <span className="text-lg font-semibold">Fluxora</span>
          </Link>
          {/* Cerrar en móvil */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="md:hidden ml-auto inline-flex h-8 w-8 items-center justify-center rounded hover:bg-white/10"
          >
            <MaterialIcon name="close" className="text-white text-xl" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-1">
            {items.map((item, idx) => {
              const active =
                pathname === item.href;
              const base =
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";
              const classes = active
                ? `${base} bg-white/15 text-white`
                : `${base} text-white/90 hover:bg-white/10 hover:text-white`;

              return (
                <li key={item.href}>
                  <Link
                    ref={idx === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    className={classes}   
                  >
                    <MaterialIcon
                      name={item.icon}
                      className="text-xl opacity-90"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pie del sidebar: usuario y logout */}
        <SidebarUserFooter />
      </aside>
    </>
  );
}
