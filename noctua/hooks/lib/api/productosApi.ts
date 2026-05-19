import { apiFetch } from "./client";
import type { Producto, CategoriaProducto } from "@/types/producto";

interface ProductoBackend {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string;
  stock?: number;
  disponible?: boolean;
}

type RespuestaProductos =
  | ProductoBackend[]
  | {
      productos?: ProductoBackend[];
      data?: ProductoBackend[];
      results?: ProductoBackend[];
    };

function normalizarCategoria(categoria?: string): CategoriaProducto {
  if (categoria === "cafeteria") return "cafeteria";
  if (categoria === "restaurante") return "restaurante";
  if (categoria === "bebidas") return "bebidas";
  if (categoria === "combos") return "combos";

  return "restaurante";
}

function mapProductoBackendToFrontend(producto: ProductoBackend): Producto {
  return {
    id: String(producto.id),
    nombre: producto.nombre,
    precio: Number(producto.precio),
    categoria: normalizarCategoria(producto.categoria),
    stock: producto.stock ?? 0,
    disponible: producto.disponible ?? true,
  };
}

export async function obtenerProductos(): Promise<Producto[]> {
  const respuesta = await apiFetch<RespuestaProductos>("/productos");

  let productosBackend: ProductoBackend[] = [];

  if (Array.isArray(respuesta)) {
    productosBackend = respuesta;
  } else if (Array.isArray(respuesta.productos)) {
    productosBackend = respuesta.productos;
  } else if (Array.isArray(respuesta.data)) {
    productosBackend = respuesta.data;
  } else if (Array.isArray(respuesta.results)) {
    productosBackend = respuesta.results;
  } else {
    console.error("Respuesta inesperada del backend:", respuesta);
    throw new Error("El backend no devolvió una lista de productos");
  }

  return productosBackend.map(mapProductoBackendToFrontend);
}

export async function crearProducto(data: {
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
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