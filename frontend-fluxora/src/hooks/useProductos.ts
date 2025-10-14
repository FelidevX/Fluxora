import { useState, useEffect } from "react";
import { Producto, ProductoDTO } from "@/types/inventario";

interface UseProductosResult {
  productos: Producto[];
  loading: boolean;
  error: string | null;
  cargarProductos: () => Promise<void>;
  crearProducto: (producto: ProductoDTO) => Promise<void>;
  actualizarStockProducto: (id: number, nuevaCantidad: number) => Promise<void>;
  eliminarProducto: (id: number) => Promise<void>;
  clearError: () => void;
}

export function useProductos(): UseProductosResult {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8080/api/inventario/productos"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Asegurarse de que cada producto tenga los campos necesarios
      const productosLimpios = Array.isArray(data)
        ? data.map((producto) => ({
            id: producto.id || 0,
            nombre: producto.nombre || "Sin nombre",
            cantidad: producto.cantidad || 0,
            precio: producto.precio || 0,
            estado: producto.estado || "Disponible",
            categoria: producto.categoria || "Sin categoría",
            descripcion: producto.descripcion || "Sin descripción",
            fecha: producto.fecha || new Date().toISOString().split("T")[0],
            receta: producto.receta || [], // ¡Preservar la receta!
            costoProduccion: producto.costoProduccion || 0, // Costo de producción
            ganancia: producto.ganancia || 0, // Ganancia
          }))
        : [];

      setProductos(productosLimpios);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setError("No se pudo conectar con el servidor.");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const crearProducto = async (producto: ProductoDTO) => {
    try {
      setLoading(true);
      setError(null);

      // Si el producto tiene receta, enviar al endpoint especial que maneja descuentos
      const endpoint =
        (producto as any).receta && (producto as any).receta.length > 0
          ? "http://localhost:8080/api/inventario/productos/con-receta"
          : "http://localhost:8080/api/inventario/productos";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(producto),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error del servidor:", errorData);
        throw new Error(
          `Error al crear producto: ${response.status} - ${errorData}`
        );
      }

      const result = await response.json();

      await cargarProductos(); // Recargar la lista después de crear
    } catch (err) {
      console.error("Error al crear producto:", err);
      setError(
        err instanceof Error ? err.message : "Error al crear el producto"
      );
      throw err; // Re-lanzar el error para que el componente lo pueda manejar
    } finally {
      setLoading(false);
    }
  };

  const actualizarStockProducto = async (id: number, nuevaCantidad: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/inventario/productos/${id}/stock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cantidad: nuevaCantidad }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error al actualizar stock: ${response.status}`);
      }

      await cargarProductos(); // Recargar la lista después de actualizar
    } catch (err) {
      console.error("Error al actualizar stock del producto:", err);
      setError("Error al actualizar el stock del producto");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8080/api/inventario/productos/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar producto: ${response.status}`);
      }

      await cargarProductos(); // Recargar la lista después de eliminar
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      setError("Error al eliminar el producto");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Cargar datos al montar el hook
  useEffect(() => {
    cargarProductos();
  }, []);

  return {
    productos,
    loading,
    error,
    cargarProductos,
    crearProducto,
    actualizarStockProducto,
    eliminarProducto,
    clearError,
  };
}
