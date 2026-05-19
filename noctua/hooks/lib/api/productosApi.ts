import { supabase } from "../supabaseClient";
import type { Producto, CategoriaProducto } from "@/types/producto";

function normalizarCategoria(categoria?: string | null): CategoriaProducto {
  if (categoria === "cafeteria") return "cafeteria";
  if (categoria === "restaurante") return "restaurante";
  if (categoria === "bebidas") return "bebidas";
  if (categoria === "combos") return "combos";

  return "restaurante";
}

export async function obtenerProductos(): Promise<Producto[]> {
  const { data, error } = await supabase.from('productos').select('*');

  if (error) {
    console.error("Error al obtener productos de Supabase:", error);
    throw new Error(error.message);
  }

  return (data || []).map((producto) => ({
    id: String(producto.id),
    nombre: producto.nombre,
    precio: Number(producto.precio),
    categoria: normalizarCategoria(producto.categoria),
    stock: producto.stock ?? 0,
    disponible: producto.disponible ?? true,
  }));
}

export async function crearProducto(data: {
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
  stock: number;
  disponible: boolean;
}) {
  const { data: nuevoProducto, error } = await supabase
    .from('productos')
    .insert([
      {
        nombre: data.nombre,
        precio: data.precio,
        categoria: data.categoria,
        stock: data.stock,
        disponible: data.disponible,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error al crear producto en Supabase:", error);
    throw new Error(error.message);
  }

  return { 
    success: true, 
    producto: {
      id: String(nuevoProducto.id),
      nombre: nuevoProducto.nombre,
      precio: Number(nuevoProducto.precio),
      categoria: normalizarCategoria(nuevoProducto.categoria),
      stock: nuevoProducto.stock ?? 0,
      disponible: nuevoProducto.disponible ?? true,
    } 
  };
}

export async function eliminarProducto(id: string) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error al eliminar producto en Supabase:", error);
    throw new Error(error.message);
  }

  return { success: true };
}