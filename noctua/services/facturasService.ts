const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type MetodoPagoFactura =
  | 'efectivo'
  | 'billetera_virtual'
  | 'debito'
  | 'credito';

export type TipoComprobante = 1 | 6 | 11;

export type PedidoFacturaItem = {
  id: string;
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string | null;
  producto?: {
    id: string;
    nombre: string;
    precio: number;
  } | null;
};

export type PedidoListoFactura = {
  id: string;
  mesaId: string;
  estado: string;
  subtotal: number;
  impuestos: number;
  total: number;
  mesa?: {
    id: string;
    numero: number;
    zona?: string;
    capacidad?: number;
  } | null;
  items: PedidoFacturaItem[];
};

export type Factura = {
  id: string;
  pedidoId: string;
  pagoId: string;
  mesaId: string;
  numeroComprobante: string;
  tipoComprobante: number;
  metodoPago: MetodoPagoFactura;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  cae?: string | null;
  vencimientoCae?: string | null;
  qrFiscal?: string | null;
  arcaEstado?: string | null;
  arcaError?: string | null;
  creadoEn?: string;
};

export type Pago = {
  id: string;
  pedidoId: string;
  mesaId: string;
  metodoPago: MetodoPagoFactura;
  tipoComprobante: number;
  monto: number;
  estado: string;
  temporal?: boolean;
  recibidoPor?: string | null;
  montoRecibido?: number;
  vuelto?: number;
};

export type CobrarPedidoPayload = {
  pedidoId: string;
  metodoPago: MetodoPagoFactura;
  tipoComprobante: TipoComprobante;
  tipoTarjeta?: string;
  marcaTarjeta?: string;
  bancoTarjeta?: string;
  proveedorBilletera?: string;
  referenciaPago?: string;
  recibidoPor?: string;
  montoRecibido?: number;
  vuelto?: number;
};

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null;
}

function getMessage(data: unknown) {
  if (!isRecord(data)) return 'Error inesperado';

  const mensaje = data.mensaje;
  const message = data.message;
  const error = data.error;

  if (typeof mensaje === 'string') return mensaje;
  if (typeof message === 'string') return message;
  if (typeof error === 'string') return error;

  return 'Error inesperado';
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { mensaje: text };
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getMessage(data));
  }

  return data as T;
}

export const facturasService = {
  async verificarARCA() {
    return apiFetch<{
      mensaje: string;
      arca: {
        ok: boolean;
        mensaje: string;
        modo?: string;
        cuit?: string;
        puntoVenta?: number;
      };
    }>('/facturas/arca/verificar');
  },

  async obtenerPedidosListos(): Promise<PedidoListoFactura[]> {
    const response = await apiFetch<{
      mensaje: string;
      total: number;
      pedidos: PedidoListoFactura[];
    }>('/facturas/pedidos/listos');

    return Array.isArray(response.pedidos) ? response.pedidos : [];
  },

  async cobrarPedido(payload: CobrarPedidoPayload) {
    return apiFetch<{
      mensaje: string;
      arca?: unknown;
      pago: Pago;
      factura?: Factura;
      pedido?: PedidoListoFactura;
      requiereConfirmacion: boolean;
    }>(`/facturas/pedido/${payload.pedidoId}/cobrar`, {
      method: 'POST',
      body: JSON.stringify({
        metodoPago: payload.metodoPago,
        tipoComprobante: payload.tipoComprobante,
        tipoTarjeta: payload.tipoTarjeta,
        marcaTarjeta: payload.marcaTarjeta,
        bancoTarjeta: payload.bancoTarjeta,
        proveedorBilletera: payload.proveedorBilletera,
        referenciaPago: payload.referenciaPago,
        recibidoPor: payload.recibidoPor,
        montoRecibido: payload.montoRecibido,
        vuelto: payload.vuelto,
      }),
    });
  },

  async confirmarPagoEfectivo(params: {
    pagoId: string;
    recibidoPor?: string;
    montoRecibido?: number;
    vuelto?: number;
  }) {
    return apiFetch<{
      mensaje: string;
      pago: Pago;
      factura: Factura;
    }>(`/facturas/pago/${params.pagoId}/confirmar-efectivo`, {
      method: 'POST',
      body: JSON.stringify({
        recibidoPor: params.recibidoPor,
        montoRecibido: params.montoRecibido,
        vuelto: params.vuelto,
      }),
    });
  },

  async obtenerFacturas(): Promise<Factura[]> {
    const response = await apiFetch<{
      mensaje: string;
      total: number;
      facturas: Factura[];
    }>('/facturas');

    return Array.isArray(response.facturas) ? response.facturas : [];
  },
};
