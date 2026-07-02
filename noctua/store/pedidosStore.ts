"use client";

import { create } from "zustand";
import type { Pedido, ItemPedido, EstadoCocina } from "@/types/pedido";
import type { Dish } from "@/types/dishes";
import { generateId } from "@/hooks/lib/utils";
import { crearPedido, obtenerPedidos, obtenerPedidosActivos, actualizarEstadoPedido, eliminarPedido as eliminarPedidoApi } from "@/hooks/lib/api/pedidosApi";
import { useMesasStore } from "@/store/mesasStore";
import { buildInitialDishes } from "@/hooks/lib/dishesMockData";
import { calculateAllDishesAvailability, calculateMaxAvailable } from "@/lib/recipeCalculator";
import type { Ingredient } from "@/types/stock";
import { useStockStore } from "./stockStore";

interface PedidosState {
  pedidos: Pedido[];
  pedidoActual: Pedido | null;
  mesaActivaId: string | null;
  dishes: Dish[];

  cargarPedidos: () => Promise<void>;
  cargarPedidosActivos: () => Promise<void>;
  cargarDishes: () => void;

  // Pedido actual (en construcción)
  iniciarPedido: (mesaId: string, numeroMesa: number, zona: string, personas: number) => void;
  setMesaActiva: (mesaId: string | null) => void;
  agregarItem: (item: Omit<ItemPedido, 'subtotal'>) => void;
  quitarItem: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  cancelarPedido: () => void;

  // Enviar a cocina
  enviarPedido: () => Promise<Pedido | null>;

  // Actualizar estado (desde cocina)
  actualizarEstadoCocina: (pedidoId: string, estado: EstadoCocina) => Promise<void>;

  // Eliminar pedido
  eliminarPedido: (pedidoId: string) => Promise<void>;

  // Getters
  getPedidoPorMesa: (mesaId: string) => Pedido | undefined;
  
  // Dishes
  updateDishesAvailability: (ingredients: Ingredient[]) => void;
  addDish: (dish: Dish) => void;
  updateDish: (dishId: string, updates: Partial<Dish>) => void;
  deleteDish: (dishId: string) => void;
}

export const usePedidosStore = create<PedidosState>((set, get) => ({
  pedidos: [],
  pedidoActual: null,
  mesaActivaId: null,
  dishes: buildInitialDishes(),

  cargarPedidos: async () => {
    try {
      const pedidos = await obtenerPedidos();
      set({ pedidos });
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    }
  },

  cargarPedidosActivos: async () => {
    try {
      const pedidos = await obtenerPedidosActivos();
      // Merge: conservar pedidos no-activos ya en el store (ej. para facturas)
      set((state) => {
        const activosIds = new Set(pedidos.map((p) => p.id));
        const otrosPedidos = state.pedidos.filter(
          (p) => !activosIds.has(p.id) && !["pendiente", "preparando", "listo", "entregado"].includes(p.estado)
        );
        return { pedidos: [...otrosPedidos, ...pedidos] };
      });
    } catch (error) {
      console.error("Error cargando pedidos activos:", error);
    }
  },

  cargarDishes: () => {
    const dishes = buildInitialDishes();
    const stockIngredients = useStockStore.getState().categories.flatMap(cat => cat.ingredients);
    const dishesWithAvailability = calculateAllDishesAvailability(dishes, stockIngredients);
    set({ dishes: dishesWithAvailability });
  },

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

  enviarPedido: async () => {
    const { pedidoActual, pedidos } = get();
    if (!pedidoActual || pedidoActual.items.length === 0) return null;

    // Si el pedido ya tiene un UUID de Supabase (es decir, ya existía en la DB)
    // idealmente aquí haríamos una actualización en la base de datos (UPDATE).
    // Si no lo tiene (es un generateId() temporal), creamos uno nuevo.
    const isNew = pedidoActual.id.length < 20; 

    let pedidoFinal: Pedido;

    if (isNew) {
      const res = await crearPedido({
        mesaId: pedidoActual.mesaId,
        numeroMesa: pedidoActual.numeroMesa,
        zona: pedidoActual.zona,
        personas: pedidoActual.personas,
        total: pedidoActual.total,
        items: pedidoActual.items.map(i => ({
          productoId: i.productoId,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.subtotal,
          notas: i.notas
        }))
      });
      pedidoFinal = res.pedido;
    } else {
      // (Si hubiera una API de actualización de items, iría aquí)
      // Por ahora para este alcance, solo le devolvemos su estado a pendiente si se edita.
      await actualizarEstadoPedido(pedidoActual.id, 'pendiente');
      pedidoFinal = { ...pedidoActual, estado: 'pendiente', actualizadoEn: new Date() };
    }

    const existIdx = pedidos.findIndex((p) => p.id === pedidoFinal.id);
    const newPedidos = existIdx >= 0
      ? pedidos.map((p) => (p.id === pedidoFinal.id ? pedidoFinal : p))
      : [...pedidos, pedidoFinal];

    set({ pedidos: newPedidos, pedidoActual: null });

    // Sincronización con el store de mesas
    // (el backend abrirPedido ya pone la mesa en esperando_pedido → realtime propaga)
    useMesasStore.getState().asignarPedido(pedidoFinal.mesaId, pedidoFinal.id);
    useMesasStore.getState().setEstadoMesa(pedidoFinal.mesaId, 'esperando_pedido');

    return pedidoFinal;
  },

  actualizarEstadoCocina: async (pedidoId, estado) => {
    try {
      await actualizarEstadoPedido(pedidoId, estado);
      set((state) => ({
        pedidos: state.pedidos.map((p) =>
          p.id === pedidoId ? { ...p, estado, actualizadoEn: new Date() } : p
        ),
      }));
    } catch (e) {
      console.error("Error al actualizar en BD:", e);
    }
  },

  eliminarPedido: async (pedidoId) => {
    try {
      // Capturar mesaId y mesas unidas antes de eliminar
      const pedido = get().pedidos.find((p) => p.id === pedidoId);
      const mesaId = pedido?.mesaId;

      await eliminarPedidoApi(pedidoId);

      set((state) => ({
        pedidos: state.pedidos.filter((p) => p.id !== pedidoId),
      }));

      // Liberar la mesa y sus unidas en el store local
      if (mesaId) {
        const mesasStore = useMesasStore.getState();
        const mesa = mesasStore.mesas.find((m) => m.id === mesaId);
        if (mesa?.mesasUnidas && mesa.mesasUnidas.length > 0) {
          mesa.mesasUnidas.forEach((id) => mesasStore.cerrarMesa(id));
        }
        mesasStore.cerrarMesa(mesaId);
      }
    } catch (e) {
      console.error("Error al eliminar pedido:", e);
      throw e;
    }
  },

  getPedidoPorMesa: (mesaId) =>
    get().pedidos.find((p) => p.mesaId === mesaId),

  updateDishesAvailability: (ingredients: Ingredient[]) => {
    set((state) => ({
      dishes: calculateAllDishesAvailability(state.dishes, ingredients)
    }));
  },

  addDish: (dish: Dish) => {
    set((state) => {
      const stockIngredients = useStockStore.getState().categories.flatMap(cat => cat.ingredients);
      const stockMap = new Map<string, Ingredient>();
      stockIngredients.forEach(ing => stockMap.set(ing.id, ing));
      
      const dishWithAvailability = {
        ...dish,
        maxAvailable: calculateMaxAvailable(dish.recipe, stockMap),
        isAvailable: calculateMaxAvailable(dish.recipe, stockMap) > 0
      };
      return { dishes: [...state.dishes, dishWithAvailability] };
    });
  },

  updateDish: (dishId: string, updates: Partial<Dish>) => {
    set((state) => {
      const stockIngredients = useStockStore.getState().categories.flatMap(cat => cat.ingredients);
      const stockMap = new Map<string, Ingredient>();
      stockIngredients.forEach(ing => stockMap.set(ing.id, ing));
      
      return {
        dishes: state.dishes.map(dish => {
          if (dish.id === dishId) {
            const updatedDish = { ...dish, ...updates };
            return {
              ...updatedDish,
              maxAvailable: calculateMaxAvailable(updatedDish.recipe, stockMap),
              isAvailable: calculateMaxAvailable(updatedDish.recipe, stockMap) > 0
            };
          }
          return dish;
        })
      };
    });
  },

  deleteDish: (dishId: string) => {
    set((state) => ({
      dishes: state.dishes.filter(dish => dish.id !== dishId)
    }));
  },
}));
