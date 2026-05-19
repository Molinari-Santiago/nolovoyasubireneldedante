"use client";

import { create } from "zustand";
import type { Producto, CategoriaProducto } from "@/types/producto";
import { obtenerProductos } from "@/hooks/lib/api/productosApi";

interface StockState {
  productos: Producto[];
  categoriaActiva: CategoriaProducto;
  isLoading: boolean;
  error: string | null;

  cargarProductos: () => Promise<void>;
  setCategoriaActiva: (cat: CategoriaProducto) => void;
  modificarStock: (id: string, delta: number) => void;
  toggleDisponibilidad: (id: string) => void;
  getProductosPorCategoria: (cat: CategoriaProducto) => Producto[];
  getTotalValorizado: () => number;
  getTotalPorCategoria: (cat: CategoriaProducto) => number;
}

export const useStockStore = create<StockState>((set, get) => ({
  productos: [],
  categoriaActiva: "cafeteria",
  isLoading: false,
  error: null,

  cargarProductos: async () => {
    try {
      set({ isLoading: true, error: null });

      const productos = await obtenerProductos();

      set({
        productos,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error cargando productos:", error);

      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los productos desde el backend",
      });
    }
  },

  setCategoriaActiva: (cat) => set({ categoriaActiva: cat }),

  modificarStock: (id, delta) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id
          ? { ...p, stock: Math.max(0, (p.stock ?? 0) + delta) }
          : p
      ),
    })),

  toggleDisponibilidad: (id) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, disponible: !p.disponible } : p
      ),
    })),

  getProductosPorCategoria: (cat) =>
    get().productos.filter((p) => p.categoria === cat),

  getTotalValorizado: () =>
    get().productos.reduce((acc, p) => acc + p.precio * (p.stock ?? 0), 0),

  getTotalPorCategoria: (cat) =>
    get()
      .productos.filter((p) => p.categoria === cat)
      .reduce((acc, p) => acc + p.precio * (p.stock ?? 0), 0),
}));