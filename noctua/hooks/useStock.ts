'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import { useStockStore } from '@/store/stockStore';
import { queryClient } from '@/lib/queryClient';

export const useStock = () => {
  const productos = useStockStore((s) => s.productos);
  return useQuery({
    queryKey: ['stock'],
    queryFn: stockService.getProductos,
    initialData: productos,
  });
};

export const useModificarStock = () =>
  useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      stockService.modificarStock(id, delta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock'] }),
  });

export const useToggleDisponibilidad = () =>
  useMutation({
    mutationFn: (id: string) => stockService.toggleDisponibilidad(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock'] }),
  });
