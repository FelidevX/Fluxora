/**
 * Script de verificación de configuración del API
 * Ejecuta: node verify-api-config.js
 */

console.log("🔍 Verificando configuración del API...\n");

// Simular las variables de entorno
const env = {
  local: {
    NEXT_PUBLIC_API_URL: "http://localhost:8080",
    NEXT_PUBLIC_API_BASE: "http://localhost:8080",
  },
  production: {
    NEXT_PUBLIC_API_URL: "https://fluxora-i000.onrender.com",
    NEXT_PUBLIC_API_BASE: "https://fluxora-i000.onrender.com",
  },
};

function verificarConfiguracion(nombre, variables) {
  console.log(`📦 Entorno: ${nombre}`);
  console.log("─".repeat(50));

  const API_BASE_URL =
    variables.NEXT_PUBLIC_API_URL ||
    variables.NEXT_PUBLIC_API_BASE ||
    "http://localhost:8080";

  console.log(`✓ API_BASE_URL: ${API_BASE_URL}`);

  if (API_BASE_URL === "undefined" || API_BASE_URL.includes("undefined")) {
    console.log('❌ ERROR: La URL contiene "undefined"');
    return false;
  }

  // Generar URLs de ejemplo
  const endpoints = {
    login: `${API_BASE_URL}/api/usuarios/auth/login`,
    clientes: `${API_BASE_URL}/api/clientes/clientes`,
    materias: `${API_BASE_URL}/api/inventario/materias-primas`,
    productos: `${API_BASE_URL}/api/inventario/productos`,
  };

  console.log("\n📍 Endpoints generados:");
  Object.entries(endpoints).forEach(([key, url]) => {
    console.log(`  ${key}: ${url}`);
    if (url.includes("undefined")) {
      console.log(`  ❌ ERROR: URL contiene "undefined"`);
    }
  });

  console.log("\n✅ Configuración OK\n");
  return true;
}

// Verificar local
verificarConfiguracion("Local (Desarrollo)", env.local);

// Verificar producción
verificarConfiguracion("Producción (Render)", env.production);

console.log("🎯 Resumen:");
console.log("─".repeat(50));
console.log("Para que funcione en Render, asegúrate de configurar:");
console.log("");
console.log("Settings → Environment → Environment Variables:");
console.log("");
console.log("  NEXT_PUBLIC_API_URL=https://fluxora-i000.onrender.com");
console.log("  NEXT_PUBLIC_API_BASE=https://fluxora-i000.onrender.com");
console.log("");
console.log("⚠️  Sin barra / al final");
console.log("⚠️  Sin espacios");
console.log("⚠️  Con NEXT_PUBLIC_ (obligatorio)");
console.log("");
