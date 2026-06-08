import { supabase } from "@/hooks/lib/supabaseClient";
import type { Pedido, EstadoCocina } from "@/types/pedido";

interface DBItem {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
}

interface DBPedido {
  id: string;
  mesa_id: string;
  numero_mesa: number;
  zona: string;
  personas: number;
  total: number;
  estado: string;
  created_at: string;
  pedido_items?: DBItem[];
}

function mapDBPedido(p: DBPedido): Pedido {
  return {
    id: p.id,
    mesaId: p.mesa_id,
    numeroMesa: p.numero_mesa,
    zona: p.zona,
    items: (p.pedido_items || []).map((i) => ({
      productoId: i.producto_id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precio_unitario,
      subtotal: i.subtotal,
      notas: i.notas,
    })),
    total: p.total,
    estado: p.estado as EstadoCocina,
    creadoEn: new Date(p.created_at || new Date().toISOString()),
    actualizadoEn: new Date(), // Usamos la fecha local
    personas: p.personas,
  };
}

export async function obtenerPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, mesa_id, numero_mesa, zona, personas, total, estado, created_at, pedido_items(producto_id, nombre, cantidad, precio_unitario, subtotal, notas)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error al obtener pedidos:", error);
    throw new Error(error.message);
  }

  return (data as DBPedido[]).map(mapDBPedido);
}

export async function obtenerPedidosPorFecha(inicio: string, fin: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, mesa_id, numero_mesa, zona, personas, total, estado, created_at, pedido_items(producto_id, nombre, cantidad, precio_unitario, subtotal, notas)")
    .gte("created_at", inicio)
    .lte("created_at", fin)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener pedidos por fecha:", error);
    throw new Error(error.message);
  }

  return (data as DBPedido[]).map(mapDBPedido);
}

export async function crearPedido(data: {
  mesaId: string;
  numeroMesa: number;
  zona: string;
  personas: number;
  total: number;
  items: {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    notas?: string;
  }[];
}): Promise<{ success: boolean; pedido: Pedido }> {
  // 1. Crear el pedido
  const { data: pedidoData, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      mesa_id: data.mesaId,
      numero_mesa: data.numeroMesa,
      zona: data.zona,
      personas: data.personas,
      total: data.total,
      estado: "pendiente",
    })
    .select("id, mesa_id, numero_mesa, zona, personas, total, estado, created_at")
    .single();

  if (pedidoError) {
    console.error("Error al crear pedido:", pedidoError);
    throw new Error(pedidoError.message);
  }

  // 2. Insertar los items
  const itemsToInsert = data.items.map((i) => ({
    pedido_id: pedidoData.id,
    producto_id: i.productoId,
    nombre: i.nombre,
    cantidad: i.cantidad,
    precio_unitario: i.precioUnitario,
    subtotal: i.subtotal,
    notas: i.notas,
  }));

  const { error: itemsError } = await supabase.from("pedido_items").insert(itemsToInsert);

  if (itemsError) {
    console.error("Error al crear items del pedido:", itemsError);
    throw new Error(itemsError.message);
  }

  // 3. Devolver el pedido completo con los items
  const { data: fullPedido, error: fetchError } = await supabase
    .from("pedidos")
    .select("id, mesa_id, numero_mesa, zona, personas, total, estado, created_at, pedido_items(producto_id, nombre, cantidad, precio_unitario, subtotal, notas)")
    .eq("id", pedidoData.id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  return { success: true, pedido: mapDBPedido(fullPedido as DBPedido) };
}

export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: EstadoCocina
) {
  const { error } = await supabase
    .from("pedidos")
    .update({ estado }) // Omitimos actualizado_en para no requerir esa columna en la DB si no existe
    .eq("id", pedidoId);

  if (error) {
    console.error("Error al actualizar estado del pedido:", error);
    throw new Error(error.message);
  }

  return { success: true };
}
