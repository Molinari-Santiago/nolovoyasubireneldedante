import { supabase } from '@/hooks/lib/supabaseClient';
import type {
  DateRangePreset,
  HourlySalesPoint,
  KPIData,
  PaymentMethodData,
  ProductAnalytics,
  ReservationStats,
  RevenuePoint,
  TopProductsData,
} from '@/types/analytics';
import { formatDateLabel, getGranularity } from '@/utils/formatters';

const PAYMENT_STATES = ['completado', 'pagado'];
const ORDER_STATES = ['cerrada', 'cerrado', 'pagado', 'entregado'];
const CONFIRMED_RESERVATION_STATES = ['confirmada', 'confirmado', 'activa', 'pendiente'];
const CANCELLED_RESERVATION_STATES = ['cancelada', 'cancelado', 'anulada', 'anulado'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HEATMAP_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

type PagoRow = {
  monto: number | string | null;
  metodo_pago?: string | null;
  estado?: string | null;
  creado_en: string | null;
};

type PedidoRow = {
  id: string | number;
  total?: number | string | null;
  estado?: string | null;
  created_at?: string | null;
  abierto_en?: string | null;
};

type FacturaRow = {
  total?: number | string | null;
  descuento?: number | string | null;
  creado_en?: string | null;
  creada_en?: string | null;
};

type ReservaRow = {
  fecha: string | null;
  estado?: string | null;
  cantidad_personas?: number | string | null;
};

type PedidoItemRow = {
  producto_id: string | number | null;
  cantidad: number | string | null;
  subtotal?: number | string | null;
  precio_unitario?: number | string | null;
};

type ProductoRow = {
  id: string | number;
  nombre?: string | null;
  categoria_id?: string | number | null;
  precio?: number | string | null;
};

type CategoriaRow = {
  id: string | number;
  nombre?: string | null;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toState(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function previousPeriod(from: Date, to: Date) {
  const duration = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration);

  return { previousFrom, previousTo };
}

function percentageChange(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

function bucketKey(date: Date, preset: DateRangePreset, from: Date, to: Date): string {
  const granularity = getGranularity(preset, from, to);

  if (granularity === 'hour') {
    return formatDateLabel(date, 'hour');
  }

  return formatDateLabel(date, granularity);
}

function dateFromPedido(row: PedidoRow): Date | null {
  const raw = row.created_at ?? row.abierto_en;
  return raw ? new Date(raw) : null;
}

async function fetchCompletedPayments(from: Date, to: Date): Promise<PagoRow[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('monto, metodo_pago, estado, creado_en')
    .in('estado', PAYMENT_STATES)
    .gte('creado_en', from.toISOString())
    .lte('creado_en', to.toISOString());

  if (error) throw new Error(`No se pudieron cargar los pagos: ${error.message}`);
  return (data ?? []) as PagoRow[];
}

async function fetchCompletedOrders(from: Date, to: Date): Promise<PedidoRow[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, total, estado, created_at, abierto_en')
    .in('estado', ORDER_STATES)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString());

  if (!error) return (data ?? []) as PedidoRow[];

  const fallback = await supabase
    .from('pedidos')
    .select('id, total, estado, abierto_en')
    .in('estado', ORDER_STATES)
    .gte('abierto_en', from.toISOString())
    .lte('abierto_en', to.toISOString());

  if (fallback.error) {
    throw new Error(`No se pudieron cargar los pedidos: ${fallback.error.message}`);
  }

  return (fallback.data ?? []) as PedidoRow[];
}

async function fetchInvoices(from: Date, to: Date): Promise<FacturaRow[]> {
  const primary = await supabase
    .from('facturas')
    .select('total, descuento, creado_en')
    .gte('creado_en', from.toISOString())
    .lte('creado_en', to.toISOString());

  if (!primary.error) return (primary.data ?? []) as FacturaRow[];

  const fallback = await supabase
    .from('facturas')
    .select('total, descuento, creada_en')
    .gte('creada_en', from.toISOString())
    .lte('creada_en', to.toISOString());

  if (fallback.error) return [];
  return (fallback.data ?? []) as FacturaRow[];
}

async function fetchReservations(from: Date, to: Date): Promise<ReservaRow[]> {
  const { data, error } = await supabase
    .from('reservas')
    .select('fecha, estado, cantidad_personas')
    .gte('fecha', ymd(from))
    .lte('fecha', ymd(to));

  if (error) throw new Error(`No se pudieron cargar las reservas: ${error.message}`);
  return (data ?? []) as ReservaRow[];
}

export async function fetchKPIs(from: Date, to: Date): Promise<KPIData> {
  const { previousFrom, previousTo } = previousPeriod(from, to);
  const [
    payments,
    previousPayments,
    orders,
    previousOrders,
    invoices,
    reservations,
  ] = await Promise.all([
    fetchCompletedPayments(from, to),
    fetchCompletedPayments(previousFrom, previousTo),
    fetchCompletedOrders(from, to),
    fetchCompletedOrders(previousFrom, previousTo),
    fetchInvoices(from, to),
    fetchReservations(from, to),
  ]);

  const totalRevenue = payments.reduce((sum, pago) => sum + toNumber(pago.monto), 0);
  const previousRevenue = previousPayments.reduce((sum, pago) => sum + toNumber(pago.monto), 0);
  const totalOrders = orders.length;
  const previousTotalOrders = previousOrders.length;

  return {
    totalRevenue,
    totalOrders,
    averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    totalDiscounts: invoices.reduce((sum, factura) => sum + toNumber(factura.descuento), 0),
    totalReservations: reservations.length,
    revenueVsPreviousPeriod: percentageChange(totalRevenue, previousRevenue),
    ordersVsPreviousPeriod: percentageChange(totalOrders, previousTotalOrders),
  };
}

export async function fetchRevenueOverTime(
  from: Date,
  to: Date,
  preset: DateRangePreset
): Promise<RevenuePoint[]> {
  const [payments, orders] = await Promise.all([
    fetchCompletedPayments(from, to),
    fetchCompletedOrders(from, to),
  ]);
  const grouped = new Map<string, RevenuePoint>();

  for (const pago of payments) {
    if (!pago.creado_en) continue;
    const key = bucketKey(new Date(pago.creado_en), preset, from, to);
    const current = grouped.get(key) ?? { date: key, revenue: 0, orders: 0 };
    current.revenue += toNumber(pago.monto);
    grouped.set(key, current);
  }

  for (const pedido of orders) {
    const date = dateFromPedido(pedido);
    if (!date) continue;
    const key = bucketKey(date, preset, from, to);
    const current = grouped.get(key) ?? { date: key, revenue: 0, orders: 0 };
    current.orders += 1;
    grouped.set(key, current);
  }

  return Array.from(grouped.values());
}

export async function fetchHourlySales(from: Date, to: Date): Promise<HourlySalesPoint[]> {
  const payments = await fetchCompletedPayments(from, to);
  const grid = new Map<string, HourlySalesPoint>();

  for (const day of HEATMAP_DAYS) {
    for (let hour = 0; hour < 24; hour += 1) {
      grid.set(`${day}-${hour}`, { day, hour, value: 0 });
    }
  }

  for (const pago of payments) {
    if (!pago.creado_en) continue;
    const date = new Date(pago.creado_en);
    const day = DAYS[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    const current = grid.get(key);
    if (current) current.value += toNumber(pago.monto);
  }

  return Array.from(grid.values());
}

export async function fetchTopProducts(from: Date, to: Date): Promise<TopProductsData> {
  const orders = await fetchCompletedOrders(from, to);
  const pedidoIds = orders.map((pedido) => pedido.id);

  if (pedidoIds.length === 0) {
    return { top: [], bottom: [] };
  }

  const [itemsResponse, productsResponse, categoriesResponse] = await Promise.all([
    supabase
      .from('pedido_items')
      .select('producto_id, cantidad, subtotal, precio_unitario')
      .in('pedido_id', pedidoIds),
    supabase.from('productos').select('id, nombre, categoria_id, precio'),
    supabase.from('categorias').select('id, nombre'),
  ]);

  if (itemsResponse.error) {
    throw new Error(`No se pudieron cargar los productos vendidos: ${itemsResponse.error.message}`);
  }

  if (productsResponse.error) {
    throw new Error(`No se pudieron cargar los productos: ${productsResponse.error.message}`);
  }

  const productos = new Map<string, ProductoRow>();
  for (const producto of (productsResponse.data ?? []) as ProductoRow[]) {
    productos.set(String(producto.id), producto);
  }

  const categorias = new Map<string, string>();
  for (const categoria of (categoriesResponse.data ?? []) as CategoriaRow[]) {
    categorias.set(String(categoria.id), categoria.nombre ?? 'Sin categoría');
  }

  const grouped = new Map<string, ProductAnalytics>();

  for (const item of (itemsResponse.data ?? []) as PedidoItemRow[]) {
    if (item.producto_id === null) continue;
    const productId = String(item.producto_id);
    const producto = productos.get(productId);
    const cantidad = toNumber(item.cantidad);
    const totalRevenue = toNumber(item.subtotal) || cantidad * toNumber(item.precio_unitario ?? producto?.precio);
    const current = grouped.get(productId) ?? {
      productId,
      nombre: producto?.nombre ?? 'Producto sin nombre',
      categoria: categorias.get(String(producto?.categoria_id ?? '')) ?? 'Sin categoría',
      totalUnits: 0,
      totalRevenue: 0,
    };

    current.totalUnits += cantidad;
    current.totalRevenue += totalRevenue;
    grouped.set(productId, current);
  }

  const sorted = Array.from(grouped.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    top: sorted.slice(0, 5),
    bottom: sorted.slice(-5).reverse(),
  };
}

export async function fetchPaymentMethods(from: Date, to: Date): Promise<PaymentMethodData[]> {
  const payments = await fetchCompletedPayments(from, to);
  const totalRevenue = payments.reduce((sum, pago) => sum + toNumber(pago.monto), 0);
  const grouped = new Map<string, { total: number; count: number }>();

  for (const pago of payments) {
    const method = String(pago.metodo_pago ?? 'otros');
    const current = grouped.get(method) ?? { total: 0, count: 0 };
    current.total += toNumber(pago.monto);
    current.count += 1;
    grouped.set(method, current);
  }

  return Array.from(grouped.entries())
    .map(([method, value]) => ({
      method,
      total: value.total,
      count: value.count,
      percentage: totalRevenue > 0 ? (value.total / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function fetchReservationStats(from: Date, to: Date): Promise<ReservationStats> {
  const reservations = await fetchReservations(startOfDay(from), endOfDay(to));
  const total = reservations.length;
  const confirmed = reservations.filter((reserva) =>
    CONFIRMED_RESERVATION_STATES.includes(toState(reserva.estado))
  ).length;
  const cancelled = reservations.filter((reserva) =>
    CANCELLED_RESERVATION_STATES.includes(toState(reserva.estado))
  ).length;
  const totalGuests = reservations.reduce(
    (sum, reserva) => sum + toNumber(reserva.cantidad_personas),
    0
  );

  return {
    total,
    confirmed,
    cancelled,
    totalGuests,
    cancelRate: total > 0 ? (cancelled / total) * 100 : 0,
  };
}
