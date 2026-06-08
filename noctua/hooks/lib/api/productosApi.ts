import { supabase } from "../supabaseClient";
import type { Producto, Categoria } from "@/types/producto";

type ProductoRow = {
  id: string | number;
  nombre: string;
  precio: number | string;
  categoria_id: string;
  stock_actual?: number | null;
  disponible?: boolean | null;
  categorias?: { id: string; nombre: string } | { id: string; nombre: string }[] | null;
};

function mapCategoriaRelacion(categorias: ProductoRow["categorias"]): Categoria | undefined {
  const categoria = Array.isArray(categorias) ? categorias[0] : categorias;
  return categoria ? { id: String(categoria.id), nombre: categoria.nombre } : undefined;
}

function mapProducto(producto: ProductoRow): Producto {
  return {
    id: String(producto.id),
    nombre: producto.nombre,
    precio: Number(producto.precio),
    categoria_id: producto.categoria_id,
    categoria: mapCategoriaRelacion(producto.categorias),
    stock: producto.stock_actual ?? 0,
    disponible: producto.disponible ?? true,
  };
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, color')
    .order('nombre');

  if (error) {
    console.error("Error al obtener categorías de Supabase:", error);
    throw new Error(error.message);
  }

  // Deduplicación por nombre ignorando mayúsculas/minúsculas
  const unicas = new Map<string, Categoria>();
  (data || []).forEach((cat) => {
    const nameLower = cat.nombre.trim().toLowerCase();
    if (!unicas.has(nameLower)) {
      unicas.set(nameLower, cat);
    }
  });

  return Array.from(unicas.values());
}

export async function obtenerProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, categoria_id, stock_actual, disponible, categorias(id, nombre)');

  if (error) {
    console.error("Error al obtener productos de Supabase:", error);
    throw new Error(error.message);
  }

  return ((data || []) as ProductoRow[]).map(mapProducto);
}

export async function crearProducto(data: {
  nombre: string;
  precio: number;
  categoria_id: string;
  stock: number;
  disponible: boolean;
}) {
  const { data: nuevoProducto, error } = await supabase
    .from('productos')
    .insert([
      {
        nombre: data.nombre,
        precio: data.precio,
        categoria_id: data.categoria_id,
        stock_actual: data.stock,
        disponible: data.disponible,
      }
    ])
    .select('id, nombre, precio, categoria_id, stock_actual, disponible, categorias(id, nombre)')
    .maybeSingle();

  if (error) {
    console.error("Error al crear producto en Supabase:", error);
    throw new Error(error.message);
  }

  if (!nuevoProducto) {
    throw new Error("No se pudo crear el producto");
  }

  return { 
    success: true, 
    producto: mapProducto(nuevoProducto as ProductoRow)
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
