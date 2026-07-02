export type EstadoMesa =
  | 'libre'
  | 'ocupada'
  | 'esperando_pedido'
  | 'pedido_listo'
  | 'esperando_pago'
  | 'problema'
  | 'para_cobrar';

export interface Mesa {
  id: string;
  numero: number;
  zona: string;
  estado: EstadoMesa;
  capacidad: number;
  personas?: number;
  pedidoId?: string;
  timerInicio?: Date;
  posicion: { x: number; y: number };
  mesasUnidas?: string[];
}

export interface Zona {
  id: string;
  nombre: string;
  mesas: Mesa[];
}

// ── Tipos para el sistema de gestos táctiles ──────────────────────────────────

export interface MergeGroup {
  primaryMesaId: string;
  secondaryMesaIds: string[];
}

export interface MesaQuickSummaryData {
  mesaId: string;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  pedidoId?: string;
  items: Array<{ nombre: string; cantidad: number; subtotal: number }>;
  total: number;
  tiempoTranscurrido?: string;
  isLoading: boolean;
  error?: string;
}

export type ContextMenuAction =
  | 'abrir_pedido'
  | 'cambiar_estado'
  | 'llamar_mozo'
  | 'marcar_cobrar'
  | 'unir_mesa'
  | 'separar_mesa'
  | 'cancelar';

export interface MesaGestureCallbacks {
  onTap: (mesaId: string, x: number, y: number) => void;
  onDoubleTap: (mesa: Mesa) => void;
  onLongPress: (mesaId: string, x: number, y: number) => void;
  onSwipe: (mesaId: string, direction: 'left' | 'right') => void;
}

export interface MergeModeState {
  isPickingOrigin: boolean;
  isActive: boolean;
  originMesaId: string | null;
  selectedIds: string[];
}
