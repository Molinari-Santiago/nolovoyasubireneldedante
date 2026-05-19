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

// Mock local de pedidos
let mockPedidosBackend: PedidoBackend[] = [
  {
    id: 1,
    mesaId: 2,
    numeroMesa: 2,
    zona: "SALÓN PRINCIPAL",
    items: [
      { productoId: 2, nombre: "Hamburguesa Simple", cantidad: 2, precio: 8500, subtotal: 17000 },
      { productoId: 3, nombre: "Agua Mineral", cantidad: 2, precio: 1500, subtotal: 3000 }
    ],
    total: 20000,
    estado: "preparando",
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    personas: 2
  }
];

export async function obtenerPedidos(): Promise<Pedido[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockPedidosBackend.map(mapPedidoBackendToFrontend);
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
  await new Promise((resolve) => setTimeout(resolve, 500));
  const nuevoPedido: PedidoBackend = {
    id: Date.now(),
    mesaId: data.mesaId,
    numeroMesa: data.mesaId, // Mock as mesaId
    zona: "SALÓN PRINCIPAL",
    items: data.items.map(item => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precio: 1000, // mock price
      subtotal: item.cantidad * 1000,
      notas: item.notas
    })),
    total: data.items.reduce((acc, item) => acc + (item.cantidad * 1000), 0),
    estado: "pendiente",
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    personas: data.personas
  };
  mockPedidosBackend.push(nuevoPedido);
  return { success: true, pedido: mapPedidoBackendToFrontend(nuevoPedido) };
}

export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: EstadoCocina
) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const idNum = Number(pedidoId);
  mockPedidosBackend = mockPedidosBackend.map(p => 
    p.id === idNum || p.id === pedidoId ? { ...p, estado, actualizadoEn: new Date().toISOString() } : p
  );
  return { success: true };
}