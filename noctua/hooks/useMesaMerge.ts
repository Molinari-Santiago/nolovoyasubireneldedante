// Gestiona el estado de modo fusión de mesas (selección, confirmación, cancelación).
'use client';

import { useState, useCallback } from 'react';
import type { MergeModeState } from '@/types/mesa';

interface UseMesaMergeReturn extends MergeModeState {
  startPicking:    () => void;
  activateMerge:   (mesaId: string) => void;
  toggleSelection: (mesaId: string) => void;
  cancelMerge:     () => void;
  maxReached:      boolean;
}

const INITIAL: MergeModeState = {
  isPickingOrigin: false,
  isActive:        false,
  originMesaId:    null,
  selectedIds:     [],
};

const MAX_MESAS = 4;

export function useMesaMerge(): UseMesaMergeReturn {
  const [state, setState] = useState<MergeModeState>(INITIAL);

  // Paso 1: entrar en modo "elegir mesa principal"
  const startPicking = useCallback(() => {
    setState({ isPickingOrigin: true, isActive: false, originMesaId: null, selectedIds: [] });
  }, []);

  // Paso 2: el usuario tocó la mesa origen → activar fusión completa
  const activateMerge = useCallback((mesaId: string) => {
    setState({ isPickingOrigin: false, isActive: true, originMesaId: mesaId, selectedIds: [mesaId] });
  }, []);

  const toggleSelection = useCallback((mesaId: string) => {
    setState((prev) => {
      if (!prev.isActive) return prev;
      // La mesa origen no se puede deseleccionar
      if (mesaId === prev.originMesaId) return prev;

      if (prev.selectedIds.includes(mesaId)) {
        return { ...prev, selectedIds: prev.selectedIds.filter((id) => id !== mesaId) };
      }
      if (prev.selectedIds.length >= MAX_MESAS) return prev;
      return { ...prev, selectedIds: [...prev.selectedIds, mesaId] };
    });
  }, []);

  const cancelMerge = useCallback(() => setState(INITIAL), []);

  return {
    ...state,
    startPicking,
    activateMerge,
    toggleSelection,
    cancelMerge,
    maxReached: state.selectedIds.length >= MAX_MESAS,
  };
}
