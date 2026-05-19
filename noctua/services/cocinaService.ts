import type { Pedido, EstadoCocina } from '@/types/pedido';
import { usePedidosStore } from '@/store/pedidosStore';
import { useMesasStore } from '@/store/mesasStore';
import type { EstadoMesa } from '@/types/mesa';

// Mapping from kitchen state to table state
const COCINA_TO_MESA: Record<EstadoCocina, EstadoMesa> = {
  pendiente: 'ocupada',
  preparando: 'ocupada',
  listo: 'pedido_listo',
  entregado: 'esperando_pago',
};

export const cocinaService = {
  getPedidosActivos: async (): Promise<Pedido[]> => {
    // TODO: Supabase — supabase.from('pedidos').select('*').neq('estado', 'entregado').order('creado_en', { ascending: true })
    await new Promise((r) => setTimeout(r, 50));
    return usePedidosStore.getState().pedidos.filter((p) => p.estado !== 'entregado');
  },

  avanzarEstado: async (pedidoId: string): Promise<void> => {
    // TODO: Supabase — compute next state then update pedidos + mesas atomically
    const { pedidos, actualizarEstadoCocina } = usePedidosStore.getState();
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;

    const siguienteEstado: Record<EstadoCocina, EstadoCocina> = {
      pendiente: 'preparando',
      preparando: 'listo',
      listo: 'entregado',
      entregado: 'entregado',
    };

    const nuevoEstado = siguienteEstado[pedido.estado];
    actualizarEstadoCocina(pedidoId, nuevoEstado);

    // Sync table state
    const mesaEstado = COCINA_TO_MESA[nuevoEstado];
    useMesasStore.getState().setEstadoMesa(pedido.mesaId, mesaEstado);
  },
};
