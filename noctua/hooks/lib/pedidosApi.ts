import { apiFetch } from "./api/client";
import type { Pedido, EstadoCocina } from "@/types/pedido";

interface CrearPedidoDTO {
  mesaId: number;
  personas: number;
  items: {
    productoId: number;
    cantidad: number;
    notas?: string;
  }[];
}

export async function obtenerPedidos(): Promise<Pedido[]> {
  return apiFetch<Pedido[]>("/pedidos");
}

export async function crearPedido(data: CrearPedidoDTO) {
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