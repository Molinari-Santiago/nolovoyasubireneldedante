"use client";

import { create } from "zustand";
import type { Mesa, EstadoMesa } from "@/types/mesa";
import { obtenerMesas, crearMesa, eliminarMesa } from "@/hooks/lib/api/mesasApi";
interface MesasState {
  mesas: Mesa[];
  mesaSeleccionada: string | null;
  mesasSeleccionadas: string[];
  isLoading: boolean;
  error: string | null;

  cargarMesas: () => Promise<void>;
  crearMesaDesdePanel: (data: {
    numero: number;
    capacidad: number;
    ubicacion: string;
  }) => Promise<void>;
  eliminarMesaDesdePanel: (id: string) => Promise<void>;
  
  seleccionarMesa: (id: string | null) => void;
  toggleSeleccionMesa: (id: string) => void;
  limpiarSeleccion: () => void;

  setEstadoMesa: (id: string, estado: EstadoMesa) => void;
  setPersonasMesa: (id: string, personas: number) => void;

  abrirMesa: (id: string, personas: number) => void;
  cerrarMesa: (id: string) => void;

  moverMesa: (id: string, posicion: { x: number; y: number }) => void;

  unirMesas: (ids: string[]) => void;
  dividirMesas: (id: string) => void;

  asignarPedido: (mesaId: string, pedidoId: string) => void;
}

export const useMesasStore = create<MesasState>((set) => ({
  mesas: [],
  mesaSeleccionada: null,
  mesasSeleccionadas: [],
  isLoading: false,
  error: null,

  cargarMesas: async () => {
    try {
      set({ isLoading: true, error: null });

      const mesas = await obtenerMesas();

      set({
        mesas,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error cargando mesas:", error);

      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las mesas desde el backend",
      });
    }
  },

  crearMesaDesdePanel: async (data) => {
    try {
      set({ isLoading: true, error: null });

      await crearMesa(data);

      const mesas = await obtenerMesas();

      set({
        mesas,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error creando mesa:", error);

      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la mesa",
      });
    }
  },
  eliminarMesaDesdePanel: async (id) => {
  try {
    const confirmar = confirm("¿Seguro que querés eliminar esta mesa?");

    if (!confirmar) return;

    set({ isLoading: true, error: null });

    await eliminarMesa(id);

    const mesas = await obtenerMesas();

    set({
      mesas,
      isLoading: false,
      mesaSeleccionada: null,
      mesasSeleccionadas: [],
    });
  } catch (error) {
    console.error("Error eliminando mesa:", error);

    set({
      isLoading: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la mesa",
    });
  }
},
  seleccionarMesa: (id) =>
    set({
      mesaSeleccionada: id,
      mesasSeleccionadas: id ? [id] : [],
    }),

  toggleSeleccionMesa: (id) =>
    set((state) => ({
      mesasSeleccionadas: state.mesasSeleccionadas.includes(id)
        ? state.mesasSeleccionadas.filter((m) => m !== id)
        : [...state.mesasSeleccionadas, id],
    })),

  limpiarSeleccion: () =>
    set({
      mesaSeleccionada: null,
      mesasSeleccionadas: [],
    }),

  setEstadoMesa: (id, estado) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id ? { ...m, estado } : m
      ),
    })),

  setPersonasMesa: (id, personas) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id ? { ...m, personas } : m
      ),
    })),

  abrirMesa: (id, personas) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id
          ? {
              ...m,
              estado: "esperando_pedido",
              personas,
              timerInicio: new Date(),
            }
          : m
      ),
    })),

  cerrarMesa: (id) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id
          ? {
              ...m,
              estado: "libre",
              personas: undefined,
              pedidoId: undefined,
              timerInicio: undefined,
              mesasUnidas: [],
            }
          : m
      ),
    })),

  moverMesa: (id, posicion) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === id ? { ...m, posicion } : m
      ),
    })),

  unirMesas: (ids) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        ids.includes(m.id)
          ? { ...m, mesasUnidas: ids.filter((i) => i !== m.id) }
          : m
      ),
      mesasSeleccionadas: [],
    })),

  dividirMesas: (id) =>
    set((state) => {
      const mesa = state.mesas.find((m) => m.id === id);
      const unidas = mesa?.mesasUnidas ?? [];

      return {
        mesas: state.mesas.map((m) =>
          m.id === id || unidas.includes(m.id)
            ? { ...m, mesasUnidas: [] }
            : m
        ),
      };
    }),

  asignarPedido: (mesaId, pedidoId) =>
    set((state) => ({
      mesas: state.mesas.map((m) =>
        m.id === mesaId
          ? { ...m, pedidoId, estado: "ocupada" }
          : m
      ),
    })),
}));