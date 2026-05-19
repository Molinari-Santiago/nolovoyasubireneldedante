export type EstadoMesa =
  | 'libre'
  | 'ocupada'
  | 'esperando_pedido'
  | 'pedido_listo'
  | 'esperando_pago'
  | 'problema';

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
