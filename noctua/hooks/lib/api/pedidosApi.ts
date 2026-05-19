import { apiFetch } from "./client";
import type { Pedido, EstadoCocina } from "@/types/pedido";

interface ItemPedidoBackend {
  productoId: number | string;
  nombre?: string;
  cantidad: number;
  precioUnitario?: number;
  precio?: number;
  subtotal?: number;
  notas?: string;
}

interface PedidoBackend {
  id: number | string;
  mesaId: number | string;
  numeroMesa?: number;
  zona?: string;
  items?: ItemPedidoBackend[];
  total?: number;
  estado?: EstadoCocina;
  creadoEn?: string;
  actualizadoEn?: string;
  personas?: number;
}

type RespuestaPedidos =
  | PedidoBackend[]
  | {
      pedidos?: PedidoBackend[];
      data?: PedidoBackend[];
      results?: PedidoBackend[];
    };

function mapPedidoBackendToFrontend(pedido: PedidoBackend): Pedido {
  return {
    id: String(pedido.id),
    mesaId: String(pedido.mesaId),
    numeroMesa: pedido.numeroMesa ?? 0,
    zona: pedido.zona ?? "SALÓN PRINCIPAL",
    items: (pedido.items ?? []).map((item) => ({
      productoId: String(item.productoId),
      nombre: item.nombre ?? "Producto",
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario ?? item.precio ?? 0,
      subtotal:
        item.subtotal ??
        item.cantidad * (item.precioUnitario ?? item.precio ?? 0),
      notas: item.notas,
    })),
    total: pedido.total ?? 0,
    estado: pedido.estado ?? "pendiente",
    creadoEn: pedido.creadoEn ? new Date(pedido.creadoEn) : new Date(),
    actualizadoEn: pedido.actualizadoEn
      ? new Date(pedido.actualizadoEn)
      : new Date(),
    personas: pedido.personas ?? 1,
  };
}

export async function obtenerPedidos(): Promise<Pedido[]> {
  const respuesta = await apiFetch<RespuestaPedidos>("/pedidos");

  let pedidosBackend: PedidoBackend[] = [];

  if (Array.isArray(respuesta)) {
    pedidosBackend = respuesta;
  } else if (Array.isArray(respuesta.pedidos)) {
    pedidosBackend = respuesta.pedidos;
  } else if (Array.isArray(respuesta.data)) {
    pedidosBackend = respuesta.data;
  } else if (Array.isArray(respuesta.results)) {
    pedidosBackend = respuesta.results;
  } else {
    console.error("Respuesta inesperada del backend:", respuesta);
    throw new Error("El backend no devolvió una lista de pedidos");
  }

  return pedidosBackend.map(mapPedidoBackendToFrontend);
}

export async function crearPedido(data: {
  mesaId: number;
  personas: number;
  items: {
    productoId: number;
    cantidad: number;
    notas?: string;
  }[];
}) {
  return apiFetch("/pedidos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: EstadoCocina
) {
  return apiFetch(`/pedidos/${pedidoId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}