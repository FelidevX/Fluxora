// Servicio para gestión de entregas y movimientos de inventario

const getAuthToken = () => {
  let token = localStorage.getItem("auth_token");
  if (!token) {
    throw new Error("No se encontró el token de autenticación");
  }
  if (token.startsWith("Bearer ")) {
    token = token.substring(7);
  }
  return token;
};

interface RegistrarMermaDTO {
  corriente_entregado: number;
  especial_entregado: number;
  comentario: string;
}

export async function registrarMerma(datos: RegistrarMermaDTO): Promise<void> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/registrar`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "MERMA",
          id_cliente: null,
          hora_entregada: new Date().toISOString(),
          corriente_entregado: datos.corriente_entregado,
          especial_entregado: datos.especial_entregado,
          comentario: datos.comentario,
          productos: [], // No hay productos específicos para merma
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al registrar merma: ${errorData}`);
    }
  } catch (error) {
    console.error("Error en registrarMerma:", error);
    throw error;
  }
}

interface RegistrarAjusteDTO {
  corriente_entregado: number;
  especial_entregado: number;
  comentario: string;
}

export async function registrarAjuste(
  datos: RegistrarAjusteDTO
): Promise<void> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/entregas/entrega/registrar`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "AJUSTE",
          id_cliente: null,
          hora_entregada: new Date().toISOString(),
          corriente_entregado: datos.corriente_entregado,
          especial_entregado: datos.especial_entregado,
          comentario: datos.comentario,
          productos: [],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al registrar ajuste: ${errorData}`);
    }
  } catch (error) {
    console.error("Error en registrarAjuste:", error);
    throw error;
  }
}
