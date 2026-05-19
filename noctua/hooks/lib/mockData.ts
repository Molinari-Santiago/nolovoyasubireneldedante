import { apiFetch } from "./api/client";
import type { Producto } from "@/types/producto";

interface ProductoBackend {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
  disponible: boolean;
}

function mapProductoBackendToFrontend(producto: ProductoBackend): Producto {
  return {
    id: String(producto.id),
    nombre: producto.nombre,
    precio: producto.precio,
    categoria: producto.categoria,
    stock: producto.stock,
    disponible: producto.disponible,
  };
}

export async function obtenerProductos(): Promise<Producto[]> {
  const productos = await apiFetch<ProductoBackend[]>("/productos");
  return productos.map(mapProductoBackendToFrontend);
}

export async function crearProducto(data: {
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
  disponible: boolean;
}) {
  return apiFetch("/productos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function eliminarProducto(id: string) {
  return apiFetch(`/productos/${id}`, {
    method: "DELETE",
  });
}