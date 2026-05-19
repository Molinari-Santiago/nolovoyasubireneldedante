import type { Producto } from '@/types/producto';
import { useStockStore } from '@/store/stockStore';

export const stockService = {
  getProductos: async (): Promise<Producto[]> => {
    // TODO: Supabase — supabase.from('productos').select('*').order('categoria').order('nombre')
    await new Promise((r) => setTimeout(r, 50));
    return useStockStore.getState().productos;
  },

  modificarStock: async (id: string, delta: number): Promise<void> => {
    // TODO: Supabase — supabase.rpc('modificar_stock', { producto_id: id, delta })
    useStockStore.getState().modificarStock(id, delta);
  },

  toggleDisponibilidad: async (id: string): Promise<void> => {
    // TODO: Supabase — supabase.from('productos').update({ disponible: !current }).eq('id', id)
    useStockStore.getState().toggleDisponibilidad(id);
  },
};
