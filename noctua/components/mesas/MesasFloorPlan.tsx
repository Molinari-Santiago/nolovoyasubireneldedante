'use client';

import { useState, useCallback, useRef, memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MesasCanvasLayout } from './MesasCanvasLayout';
import { MesaStatusLegend } from './MesaStatusLegend';
import { MesaContextMenu } from './MesaContextMenu';
import { MesaQuickSummaryWrapper } from './MesaQuickSummary';
import { MesaMergeBar } from './MesaMergeBar';
import { useMesaMerge } from '@/hooks/useMesaMerge';
import { useMesaQuickSummary } from '@/hooks/useMesaQuickSummary';
import { mergeMesas, unmergeMesas } from '@/services/mesaMergeService';
import { useMesasStore } from '@/store/mesasStore';
import { toast } from '@/components/ui/Toast';
import { TEXTO_ESTADO_MESA } from '@/hooks/lib/constants';
import type { Mesa, EstadoMesa, ContextMenuAction, MesaGestureCallbacks } from '@/types/mesa';

interface MesasFloorPlanProps {
  mesas:              Mesa[];
  mesasSeleccionadas: string[];
  onSingleClick:      (id: string) => void;
  onDoubleClick:      (mesa: Mesa) => void;
  onDelete:           (id: string) => void;
}

interface ContextMenuState {
  mesa: Mesa;
  x:    number;
  y:    number;
}

interface QuickSummaryPos {
  x: number;
  y: number;
}

/**
 * MesasFloorPlan — Contenedor principal del plano de planta.
 * Gestiona todo el sistema de gestos táctiles: tap, doble tap, long press, swipe, fusión.
 */
export const MesasFloorPlan = memo(function MesasFloorPlan({
  mesas,
  mesasSeleccionadas,
  onSingleClick,
  onDoubleClick,
  onDelete,
}: MesasFloorPlanProps) {
  // ── Estado de gestos ──────────────────────────────────────────────────────
  const [contextMenu, setContextMenu]   = useState<ContextMenuState | null>(null);
  const [summaryPos, setSummaryPos]     = useState<QuickSummaryPos>({ x: 0, y: 0 });
  const [mozoRequeridoIds, setMozo]     = useState<Set<string>>(new Set());
  const [mergeLoading, setMergeLoading] = useState(false);
  const mozoTimers                      = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const cambiarEstadoMesa = useMesasStore((s) => s.cambiarEstadoMesa);
  const dividirMesas      = useMesasStore((s) => s.dividirMesas);

  const merge   = useMesaMerge();
  const summary = useMesaQuickSummary();

  // ── Gestos ────────────────────────────────────────────────────────────────

  const handleTap = useCallback((mesaId: string, x: number, y: number) => {
    // Paso 1: picking de origen → activar fusión con esta mesa como principal
    if (merge.isPickingOrigin) {
      merge.activateMerge(mesaId);
      return;
    }
    // Paso 2: fusión activa → agregar/quitar del grupo
    if (merge.isActive) {
      merge.toggleSelection(mesaId);
      return;
    }
    // Toggle quick summary: cerrar si ya está abierta para esa mesa
    if (summary.activeMesaId === mesaId) {
      summary.close();
    } else {
      setSummaryPos({ x, y });
      summary.open(mesaId);
    }
    // Mantener compatibilidad con la lógica de selección desktop
    onSingleClick(mesaId);
  }, [merge, summary, onSingleClick]);

  const handleDoubleTap = useCallback((mesa: Mesa) => {
    if (merge.isActive || merge.isPickingOrigin) return;
    summary.close();
    setContextMenu(null);
    onDoubleClick(mesa);
  }, [merge.isActive, merge.isPickingOrigin, summary, onDoubleClick]);

  const handleLongPress = useCallback((mesaId: string, x: number, y: number) => {
    if (merge.isActive || merge.isPickingOrigin) return;
    summary.close();
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa) return;
    setContextMenu({ mesa, x, y });
  }, [merge.isActive, merge.isPickingOrigin, summary, mesas]);

  const handleSwipe = useCallback(async (mesaId: string, direction: 'left' | 'right') => {
    if (merge.isActive || merge.isPickingOrigin) return;
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa) return;

    let nuevoEstado: EstadoMesa;

    if (direction === 'left') {
      // Swipe izquierda → liberar mesa directamente
      nuevoEstado = 'libre';
    } else {
      // Swipe derecha → ciclar: libre→ocupada→esperando_pedido→libre
      const ciclo: EstadoMesa[] = ['libre', 'ocupada', 'esperando_pedido'];
      const idx = ciclo.indexOf(mesa.estado);
      nuevoEstado = ciclo[(idx + 1) % ciclo.length];
    }

    try {
      await cambiarEstadoMesa(mesaId, nuevoEstado);
      toast.success(
        `Mesa ${mesa.numero}`,
        `Marcada como ${TEXTO_ESTADO_MESA[nuevoEstado].toLowerCase()}`
      );
    } catch {
      toast.error('Error', 'No se pudo cambiar el estado de la mesa');
    }
  }, [merge.isActive, merge.isPickingOrigin, mesas, cambiarEstadoMesa]);

  // ── Acciones del menú contextual ─────────────────────────────────────────

  const handleContextAction = useCallback(async (
    action: ContextMenuAction,
    mesa: Mesa,
    nuevoEstado?: EstadoMesa
  ) => {
    setContextMenu(null);

    switch (action) {
      case 'abrir_pedido':
        onDoubleClick(mesa);
        break;

      case 'cambiar_estado':
        if (!nuevoEstado) break;
        try {
          await cambiarEstadoMesa(mesa.id, nuevoEstado);
          toast.success(`Mesa ${mesa.numero}`, `Estado: ${TEXTO_ESTADO_MESA[nuevoEstado]}`);
        } catch {
          toast.error('Error', 'No se pudo cambiar el estado');
        }
        break;

      case 'llamar_mozo': {
        // Limpiar timer anterior si existe
        const prevTimer = mozoTimers.current.get(mesa.id);
        if (prevTimer) clearTimeout(prevTimer);
        setMozo((prev) => new Set([...prev, mesa.id]));
        toast.info(`Mesa ${mesa.numero}`, 'Mozo requerido');
        // Auto-apagar tras 5 minutos
        const t = setTimeout(() => {
          setMozo((prev) => { const n = new Set(prev); n.delete(mesa.id); return n; });
          mozoTimers.current.delete(mesa.id);
        }, 5 * 60 * 1000);
        mozoTimers.current.set(mesa.id, t);
        break;
      }

      case 'marcar_cobrar':
        try {
          await cambiarEstadoMesa(mesa.id, 'para_cobrar');
          toast.info(`Mesa ${mesa.numero}`, 'Marcada para cobrar');
        } catch {
          toast.error('Error', 'No se pudo marcar la mesa');
        }
        break;

      case 'unir_mesa':
        // Desde el menú contextual: la mesa long-presionada es directamente la principal
        merge.activateMerge(mesa.id);
        break;

      case 'separar_mesa':
        dividirMesas(mesa.id);
        unmergeMesas(mesa.id).catch(console.error);
        toast.success('Mesas separadas', `Mesa ${mesa.numero} separada correctamente`);
        break;

      case 'cancelar':
        break;
    }
  }, [onDoubleClick, cambiarEstadoMesa, merge, dividirMesas]);

  // ── Fusión de mesas ───────────────────────────────────────────────────────

  const handleConfirmMerge = useCallback(async () => {
    if (!merge.originMesaId || merge.selectedIds.length < 2) return;
    setMergeLoading(true);
    const secondary = merge.selectedIds.filter((id) => id !== merge.originMesaId);
    try {
      await mergeMesas(merge.originMesaId, secondary);
      const mesaOrigen = mesas.find((m) => m.id === merge.originMesaId);
      toast.success('Mesas unidas correctamente', `Grupo de ${merge.selectedIds.length} mesas`);
      merge.cancelMerge();
      // Reabrir el pedido de la mesa origen fusionada
      if (mesaOrigen) onDoubleClick(mesaOrigen);
    } catch {
      toast.error('Error al unir mesas', 'No se pudo completar la fusión');
    } finally {
      setMergeLoading(false);
    }
  }, [merge, mesas, onDoubleClick]);

  // ── Callbacks de Quick Summary ────────────────────────────────────────────

  const handleOpenSummaryPedido = useCallback(() => {
    if (!summary.activeMesaId) return;
    const mesa = mesas.find((m) => m.id === summary.activeMesaId);
    summary.close();
    if (mesa) onDoubleClick(mesa);
  }, [summary, mesas, onDoubleClick]);

  // ── Objeto de callbacks de gestos (estable entre renders) ────────────────

  const gestures: MesaGestureCallbacks = {
    onTap:       handleTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress,
    onSwipe:     handleSwipe,
  };

  // Mesa origen del merge para mostrar número en el MesaMergeBar
  const mesaOrigen   = mesas.find((m) => m.id === merge.originMesaId);
  const selectedNums = merge.selectedIds
    .map((id) => mesas.find((m) => m.id === id)?.numero ?? 0)
    .filter(Boolean);

  const isMergeActive = merge.isActive || merge.isPickingOrigin;

  return (
    <div className={`relative ${isMergeActive ? 'pb-24' : ''}`}>
      {/* Canvas del plano de planta */}
      <MesasCanvasLayout
        mesas={mesas}
        mesasSeleccionadas={mesasSeleccionadas}
        mergeSelectedIds={merge.selectedIds}
        isMergeMode={merge.isActive}
        isPickingOrigin={merge.isPickingOrigin}
        originNumero={mesaOrigen?.numero}
        mozoRequeridoIds={mozoRequeridoIds}
        gestures={gestures}
        onDelete={onDelete}
        onStartMerge={merge.startPicking}
        onCancelMerge={merge.cancelMerge}
      />

      {/* Leyenda de estados */}
      <MesaStatusLegend />

      {/* Menú contextual (long press) */}
      <AnimatePresence>
        {contextMenu && (
          <MesaContextMenu
            key="context-menu"
            mesa={contextMenu.mesa}
            triggerX={contextMenu.x}
            triggerY={contextMenu.y}
            onAction={handleContextAction}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Resumen rápido (tap) */}
      <MesaQuickSummaryWrapper
        data={summary.data}
        triggerX={summaryPos.x}
        triggerY={summaryPos.y}
        onClose={summary.close}
        onAbrirPedido={handleOpenSummaryPedido}
      />

      {/* Barra de fusión */}
      <AnimatePresence>
        {merge.isActive && mesaOrigen && (
          <MesaMergeBar
            key="merge-bar"
            originNumero={mesaOrigen.numero}
            selectedNums={selectedNums}
            maxReached={merge.maxReached}
            onConfirm={handleConfirmMerge}
            onCancel={merge.cancelMerge}
            isLoading={mergeLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
