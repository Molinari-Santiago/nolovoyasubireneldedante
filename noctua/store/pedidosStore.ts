"use client";

import { create } from "zustand";
import type { Pedido, ItemPedido, EstadoCocina } from "@/types/pedido";
import { generateId } from "@/hooks/lib/utils";

interface PedidosState {
  pedidos: Pedido[];
  pedidoActual: Pedido | null;
  mesaActivaId: string | null;

  // Pedido actual (en construcción)
  iniciarPedido: (mesaId: string, numeroMesa: number, zona: string, personas: number) => void;
  setMesaActiva: (mesaId: string | null) => void;
  agregarItem: (item: Omit<ItemPedido, 'subtotal'>) => void;
  quitarItem: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  cancelarPedido: () => void;

  // Enviar a cocina
  enviarPedido: () => Pedido | null;

  // Actualizar estado (desde cocina)
  actualizarEstadoCocina: (pedidoId: string, estado: EstadoCocina) => void;

  // Getters
  getPedidoPorMesa: (mesaId: string) => Pedido | undefined;
}

export const usePedidosStore = create<PedidosState>((set, get) => ({
  pedidos: [],
  pedidoActual: null,
  mesaActivaId: null,
  iniciarPedido: (mesaId, numeroMesa, zona, personas) => {
    const existente = get().pedidos.find((p) => p.mesaId === mesaId && p.estado !== 'entregado');
    if (existente) {
      set({ pedidoActual: existente, mesaActivaId: mesaId });
      return;
    }
    set({
      pedidoActual: {
        id: generateId(),
        mesaId,
        numeroMesa,
        zona,
        items: [],
        total: 0,
        estado: 'pendiente',
        creadoEn: new Date(),
        actualizadoEn: new Date(),
        personas,
      },
      mesaActivaId: mesaId,
    });
  },

  setMesaActiva: (mesaId) => set({ mesaActivaId: mesaId }),

  agregarItem: (item) =>
    set((state) => {
      if (!state.pedidoActual) return {};
      const existIdx = state.pedidoActual.items.findIndex((i) => i.productoId === item.productoId);
      let newItems: ItemPedido[];
      if (existIdx >= 0) {
        newItems = state.pedidoActual.items.map((i, idx) =>
          idx === existIdx
            ? { ...i, cantidad: i.cantidad + item.cantidad, subtotal: (i.cantidad + item.cantidad) * i.precioUnitario }
            : i
        );
      } else {
        newItems = [...state.pedidoActual.items, { ...item, subtotal: item.cantidad * item.precioUnitario }];
      }
      const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
      return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
    }),

  quitarItem: (productoId) =>
    set((state) => {
      if (!state.pedidoActual) return {};
      const newItems = state.pedidoActual.items.filter((i) => i.productoId !== productoId);
      const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
      return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
    }),

  cambiarCantidad: (productoId, cantidad) =>
    set((state) => {
      if (!state.pedidoActual) return {};
      if (cantidad <= 0) {
        const newItems = state.pedidoActual.items.filter((i) => i.productoId !== productoId);
        const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
        return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
      }
      const newItems = state.pedidoActual.items.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad, subtotal: cantidad * i.precioUnitario }
          : i
      );
      const total = newItems.reduce((acc, i) => acc + i.subtotal, 0);
      return { pedidoActual: { ...state.pedidoActual, items: newItems, total } };
    }),

  cancelarPedido: () => set({ pedidoActual: null }),

  enviarPedido: () => {
    const { pedidoActual, pedidos } = get();
    if (!pedidoActual || pedidoActual.items.length === 0) return null;
    const pedido: Pedido = { ...pedidoActual, estado: 'pendiente', actualizadoEn: new Date() };
    const existIdx = pedidos.findIndex((p) => p.id === pedido.id);
    const newPedidos = existIdx >= 0
      ? pedidos.map((p) => (p.id === pedido.id ? pedido : p))
      : [...pedidos, pedido];
    set({ pedidos: newPedidos, pedidoActual: null });
    return pedido;
  },

  actualizarEstadoCocina: (pedidoId, estado) =>
    set((state) => ({
      pedidos: state.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, estado, actualizadoEn: new Date() } : p
      ),
    })),

  getPedidoPorMesa: (mesaId) =>
    get().pedidos.find((p) => p.mesaId === mesaId && p.estado !== 'entregado'),
}));
