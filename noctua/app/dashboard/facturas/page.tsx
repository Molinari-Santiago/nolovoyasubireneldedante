'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  CreditCard,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

import { cn } from '@/hooks/lib/utils';
import {
  facturasService,
  type Factura,
  type MetodoPagoFactura,
  type PedidoFacturaItem,
  type PedidoListoFactura,
  type Pago,
  type TipoComprobante,
} from '@/services/facturasService';

type ArcaEstado = {
  ok: boolean;
  mensaje: string;
  modo?: string;
  cuit?: string;
  puntoVenta?: number;
} | null;

type MensajeUI = {
  tipo: 'success' | 'warning' | 'error';
  titulo: string;
  detalle?: string;
} | null;

const TIPOS_COMPROBANTE: {
  codigo: TipoComprobante;
  nombre: string;
}[] = [
  { codigo: 1, nombre: 'Factura A' },
  { codigo: 6, nombre: 'Factura B' },
  { codigo: 11, nombre: 'Factura C' },
];

const METODOS_PAGO: {
  value: MetodoPagoFactura;
  label: string;
  icon: typeof Banknote;
}[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'billetera_virtual', label: 'Billetera virtual', icon: Wallet },
  { value: 'debito', label: 'Tarjeta debito', icon: CreditCard },
  { value: 'credito', label: 'Tarjeta credito', icon: CreditCard },
];

const BILLETERAS = [
  'Mercado Pago',
  'Uala',
  'Cuenta DNI',
  'Naranja X',
  'Modo',
  'Otra',
];

const MARCAS_TARJETA = [
  'Visa',
  'Mastercard',
  'American Express',
  'Maestro',
  'Cabal',
  'Otra',
];

function formatearARS(valor: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(valor || 0));
}

export default function FacturasPage() {
  const [pedidos, setPedidos] = useState<PedidoListoFactura[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState('');
  const [arca, setArca] = useState<ArcaEstado>(null);
  const [mensaje, setMensaje] = useState<MensajeUI>(null);

  const [loading, setLoading] = useState(false);
  const [verificandoArca, setVerificandoArca] = useState(false);
  const [cobrando, setCobrando] = useState(false);

  const [metodoPago, setMetodoPago] =
    useState<MetodoPagoFactura>('efectivo');
  const [tipoComprobante, setTipoComprobante] =
    useState<TipoComprobante>(6);
  const [marcaTarjeta, setMarcaTarjeta] = useState('Visa');
  const [bancoTarjeta, setBancoTarjeta] = useState('');
  const [proveedorBilletera, setProveedorBilletera] =
    useState('Mercado Pago');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [recibidoPor, setRecibidoPor] = useState('admin');
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  const [pagoPendiente, setPagoPendiente] = useState<Pago | null>(null);

  const pedidoSeleccionado = useMemo(() => {
    return (
      pedidos.find((pedido) => pedido.id === pedidoSeleccionadoId) || null
    );
  }, [pedidos, pedidoSeleccionadoId]);

  const vuelto = useMemo(() => {
    if (!pedidoSeleccionado) return 0;

    const calculado =
      Number(montoRecibido || 0) - Number(pedidoSeleccionado.total || 0);

    return calculado > 0 ? calculado : 0;
  }, [montoRecibido, pedidoSeleccionado]);

  const mostrarMensaje = useCallback((nuevoMensaje: MensajeUI) => {
    setMensaje(nuevoMensaje);
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      const [pedidosListos, facturasEmitidas] = await Promise.all([
        facturasService.obtenerPedidosListos(),
        facturasService.obtenerFacturas(),
      ]);

      setPedidos(Array.isArray(pedidosListos) ? pedidosListos : []);
      setFacturas(Array.isArray(facturasEmitidas) ? facturasEmitidas : []);

      if (!pedidoSeleccionadoId && pedidosListos.length > 0) {
        setPedidoSeleccionadoId(pedidosListos[0].id);
        setMontoRecibido(Number(pedidosListos[0].total || 0));
      }
    } catch (error) {
      mostrarMensaje({
        tipo: 'error',
        titulo: 'Error al cargar facturas',
        detalle:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos.',
      });
    } finally {
      setLoading(false);
    }
  }, [mostrarMensaje, pedidoSeleccionadoId]);

  const verificarARCA = async () => {
    try {
      setVerificandoArca(true);

      const response = await facturasService.verificarARCA();

      setArca(response.arca);
      mostrarMensaje({
        tipo: 'success',
        titulo: 'ARCA verificado',
        detalle: response.arca.mensaje,
      });
    } catch (error) {
      const detalle =
        error instanceof Error ? error.message : 'No se pudo verificar ARCA';

      setArca({ ok: false, mensaje: detalle });
      mostrarMensaje({ tipo: 'error', titulo: 'Error ARCA', detalle });
    } finally {
      setVerificandoArca(false);
    }
  };

  const limpiarFormulario = () => {
    setPedidoSeleccionadoId('');
    setMetodoPago('efectivo');
    setTipoComprobante(6);
    setMarcaTarjeta('Visa');
    setBancoTarjeta('');
    setProveedorBilletera('Mercado Pago');
    setReferenciaPago('');
    setRecibidoPor('admin');
    setMontoRecibido(0);
    setPagoPendiente(null);
  };

  const cobrarPedido = async () => {
    if (!pedidoSeleccionado) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Selecciona un pedido',
        detalle: 'No hay pedido seleccionado.',
      });
      return;
    }

    if (!arca?.ok) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Verifica ARCA',
        detalle: 'Antes de cobrar tenes que verificar ARCA.',
      });
      return;
    }

    if (
      (metodoPago === 'debito' || metodoPago === 'credito') &&
      !bancoTarjeta.trim()
    ) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Falta banco',
        detalle: 'Indica el banco de la tarjeta.',
      });
      return;
    }

    if (metodoPago === 'billetera_virtual' && !proveedorBilletera.trim()) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Falta billetera',
        detalle: 'Indica la billetera virtual utilizada.',
      });
      return;
    }

    if (
      metodoPago === 'efectivo' &&
      Number(montoRecibido || 0) < Number(pedidoSeleccionado.total || 0)
    ) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Monto insuficiente',
        detalle: 'El monto recibido no puede ser menor al total del pedido.',
      });
      return;
    }

    try {
      setCobrando(true);

      const response = await facturasService.cobrarPedido({
        pedidoId: pedidoSeleccionado.id,
        metodoPago,
        tipoComprobante,
        tipoTarjeta:
          metodoPago === 'debito' || metodoPago === 'credito'
            ? metodoPago
            : undefined,
        marcaTarjeta:
          metodoPago === 'debito' || metodoPago === 'credito'
            ? marcaTarjeta
            : undefined,
        bancoTarjeta:
          metodoPago === 'debito' || metodoPago === 'credito'
            ? bancoTarjeta
            : undefined,
        proveedorBilletera:
          metodoPago === 'billetera_virtual'
            ? proveedorBilletera
            : undefined,
        referenciaPago,
        recibidoPor,
        montoRecibido,
        vuelto,
      });

      if (response.requiereConfirmacion) {
        setPagoPendiente(response.pago);
        mostrarMensaje({
          tipo: 'warning',
          titulo: 'Efectivo pendiente',
          detalle:
            'El pago quedo guardado temporalmente. Confirmalo para cerrar la mesa.',
        });
        return;
      }

      mostrarMensaje({
        tipo: 'success',
        titulo: 'Factura emitida',
        detalle: 'La mesa fue cerrada correctamente.',
      });

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      try {
        const facturasActualizadas = await facturasService.obtenerFacturas();
        const facturaCreada = facturasActualizadas.find(
          (factura) => factura.pedidoId === pedidoSeleccionado.id
        );

        if (facturaCreada) {
          mostrarMensaje({
            tipo: 'success',
            titulo: 'Factura emitida',
            detalle: 'La operacion se completo correctamente.',
          });
          limpiarFormulario();
          await cargarDatos();
          return;
        }
      } catch {
        // Si la reconsulta falla, mostramos el error original.
      }

      mostrarMensaje({
        tipo: 'error',
        titulo: 'Error al cobrar',
        detalle:
          error instanceof Error ? error.message : 'No se pudo cobrar el pedido',
      });
    } finally {
      setCobrando(false);
    }
  };

  const confirmarEfectivo = async () => {
    if (!pagoPendiente) return;

    try {
      setCobrando(true);

      await facturasService.confirmarPagoEfectivo({
        pagoId: pagoPendiente.id,
        recibidoPor,
        montoRecibido,
        vuelto,
      });

      mostrarMensaje({
        tipo: 'success',
        titulo: 'Efectivo confirmado',
        detalle: 'La factura fue emitida y la mesa fue cerrada.',
      });

      setPagoPendiente(null);
      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      mostrarMensaje({
        tipo: 'error',
        titulo: 'Error al confirmar efectivo',
        detalle:
          error instanceof Error
            ? error.message
            : 'No se pudo confirmar el efectivo',
      });
    } finally {
      setCobrando(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [cargarDatos]);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-[0.18em] uppercase">
            Facturas
          </h1>
          <p className="text-sm text-[#676B67] mt-1">
            Selecciona un pedido listo para cobrar, verifica ARCA y emite la
            factura.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={verificarARCA}
            disabled={verificandoArca}
            className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {verificandoArca ? 'Verificando...' : 'Verificar ARCA'}
          </button>

          <button
            onClick={() => void cargarDatos()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm font-bold text-[#BCB9B9] hover:bg-[#151515] disabled:opacity-50"
          >
            <RefreshCcw size={16} />
            Actualizar
          </button>
        </div>
      </header>

      {mensaje && (
        <section
          className={cn(
            'rounded-2xl border p-4 flex items-start gap-3',
            mensaje.tipo === 'success' &&
              'border-green-500/30 bg-green-500/10 text-green-200',
            mensaje.tipo === 'warning' &&
              'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
            mensaje.tipo === 'error' &&
              'border-red-500/30 bg-red-500/10 text-red-200'
          )}
        >
          {mensaje.tipo === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">
              {mensaje.titulo}
            </h2>
            {mensaje.detalle && (
              <p className="text-sm mt-1 opacity-80">{mensaje.detalle}</p>
            )}
          </div>
        </section>
      )}

      <section
        className={cn(
          'rounded-2xl border p-4 flex items-start gap-3',
          arca?.ok
            ? 'border-green-500/30 bg-green-500/10'
            : arca
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-[#1a1a1a] bg-[#080808]'
        )}
      >
        {arca?.ok ? (
          <CheckCircle className="text-green-400 mt-0.5" size={20} />
        ) : (
          <AlertTriangle
            className={arca ? 'text-red-400 mt-0.5' : 'text-yellow-400 mt-0.5'}
            size={20}
          />
        )}
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest">
            Estado ARCA
          </h2>
          <p className="text-sm text-[#BCB9B9] mt-1">
            {arca ? arca.mensaje : 'Todavia no se verifico ARCA.'}
          </p>
          {arca?.ok && (
            <p className="text-xs text-[#676B67] mt-2">
              Modo: {arca.modo} | CUIT: {arca.cuit} | Punto de venta:{' '}
              {arca.puntoVenta}
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <section className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={18} className="text-[#676B67]" />
            <h2 className="font-black tracking-widest uppercase text-sm">
              Seleccionar pedido
            </h2>
          </div>

          {pedidos.length === 0 ? (
            <div className="rounded-xl border border-[#1a1a1a] bg-black/40 p-6 text-center">
              <p className="text-[#676B67] font-semibold">
                No hay pedidos listos para cobrar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={pedidoSeleccionadoId}
                onChange={(event) => {
                  const nuevoPedidoId = event.target.value;
                  const nuevoPedido = pedidos.find(
                    (pedido) => pedido.id === nuevoPedidoId
                  );

                  setPedidoSeleccionadoId(nuevoPedidoId);
                  setMontoRecibido(Number(nuevoPedido?.total || 0));
                  setPagoPendiente(null);
                }}
                className="w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
              >
                <option value="">Seleccionar pedido...</option>
                {pedidos.map((pedido) => (
                  <option key={pedido.id} value={pedido.id}>
                    Mesa {pedido.mesa?.numero || '-'} |{' '}
                    {formatearARS(pedido.total)} | {pedido.estado}
                  </option>
                ))}
              </select>

              {pedidoSeleccionado && (
                <div className="rounded-2xl border border-[#1a1a1a] bg-black/50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-xl font-black">
                        Mesa {pedidoSeleccionado.mesa?.numero || '-'}
                      </h3>
                      <p className="text-xs text-[#676B67] uppercase tracking-widest">
                        {pedidoSeleccionado.mesa?.zona || 'Sin zona'} |{' '}
                        {pedidoSeleccionado.estado}
                      </p>
                    </div>
                    <p className="text-2xl font-black font-mono">
                      {formatearARS(pedidoSeleccionado.total)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {pedidoSeleccionado.items.map(
                      (item: PedidoFacturaItem) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 border-b border-[#111] pb-2"
                        >
                          <div>
                            <p className="text-sm font-bold">
                              {item.cantidad} x{' '}
                              {item.producto?.nombre || 'Producto'}
                            </p>
                            {item.notas && (
                              <p className="text-xs text-yellow-400">
                                {item.notas}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-mono text-[#BCB9B9]">
                            {formatearARS(item.subtotal)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
          <h2 className="font-black tracking-widest uppercase text-sm mb-4">
            Datos de cobro
          </h2>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                Tipo de factura
              </span>
              <select
                value={tipoComprobante}
                onChange={(event) =>
                  setTipoComprobante(
                    Number(event.target.value) as TipoComprobante
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
              >
                {TIPOS_COMPROBANTE.map((tipo) => (
                  <option key={tipo.codigo} value={tipo.codigo}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                Metodo de pago
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {METODOS_PAGO.map((metodo) => {
                  const Icon = metodo.icon;
                  const activo = metodoPago === metodo.value;

                  return (
                    <button
                      key={metodo.value}
                      onClick={() => setMetodoPago(metodo.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition',
                        activo
                          ? 'border-white bg-white text-black'
                          : 'border-[#2a2a2a] bg-black text-[#BCB9B9] hover:border-white/40'
                      )}
                    >
                      <Icon size={16} />
                      {metodo.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                    Monto recibido
                  </span>
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(event) =>
                      setMontoRecibido(Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
                  />
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                    Vuelto
                  </span>
                  <input
                    type="number"
                    value={vuelto}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-3 text-sm font-bold text-[#BCB9B9]"
                  />
                </label>
              </div>
            )}

            {metodoPago === 'billetera_virtual' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                    Billetera
                  </span>
                  <select
                    value={proveedorBilletera}
                    onChange={(event) =>
                      setProveedorBilletera(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
                  >
                    {BILLETERAS.map((billetera) => (
                      <option key={billetera} value={billetera}>
                        {billetera}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                    Referencia
                  </span>
                  <input
                    value={referenciaPago}
                    onChange={(event) =>
                      setReferenciaPago(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
                  />
                </label>
              </div>
            )}

            {(metodoPago === 'debito' || metodoPago === 'credito') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                    Marca
                  </span>
                  <select
                    value={marcaTarjeta}
                    onChange={(event) => setMarcaTarjeta(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
                  >
                    {MARCAS_TARJETA.map((marca) => (
                      <option key={marca} value={marca}>
                        {marca}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                    Banco
                  </span>
                  <input
                    value={bancoTarjeta}
                    onChange={(event) => setBancoTarjeta(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                    Referencia / cupon
                  </span>
                  <input
                    value={referenciaPago}
                    onChange={(event) =>
                      setReferenciaPago(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
                  />
                </label>
              </div>
            )}

            <label>
              <span className="text-xs font-bold uppercase tracking-widest text-[#676B67]">
                Recibido por
              </span>
              <input
                value={recibidoPor}
                onChange={(event) => setRecibidoPor(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#2a2a2a] bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-white/40"
              />
            </label>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => void cobrarPedido()}
                disabled={!pedidoSeleccionado || cobrando}
                className="rounded-xl bg-white px-4 py-4 text-sm font-black text-black hover:bg-[#BCB9B9] disabled:opacity-40"
              >
                {cobrando
                  ? 'Procesando...'
                  : 'Verificar ARCA, facturar y cerrar mesa'}
              </button>

              {pagoPendiente && (
                <button
                  onClick={() => void confirmarEfectivo()}
                  disabled={cobrando}
                  className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-4 text-sm font-black text-yellow-300 hover:bg-yellow-500/20 disabled:opacity-40"
                >
                  Confirmar efectivo y cerrar mesa
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
        <h2 className="font-black tracking-widest uppercase text-sm mb-4">
          Ultimas facturas
        </h2>

        {facturas.length === 0 ? (
          <p className="text-sm text-[#676B67]">
            Todavia no hay facturas emitidas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#1a1a1a] text-left text-[#676B67]">
                  <th className="py-3">Comprobante</th>
                  <th className="py-3">Tipo</th>
                  <th className="py-3">Metodo</th>
                  <th className="py-3">Total</th>
                  <th className="py-3">CAE</th>
                  <th className="py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((factura: Factura) => (
                  <tr key={factura.id} className="border-b border-[#111]">
                    <td className="py-3 font-mono">
                      {factura.numeroComprobante}
                    </td>
                    <td className="py-3">
                      {
                        TIPOS_COMPROBANTE.find(
                          (tipo) => tipo.codigo === factura.tipoComprobante
                        )?.nombre
                      }
                    </td>
                    <td className="py-3 capitalize">
                      {factura.metodoPago?.replace('_', ' ')}
                    </td>
                    <td className="py-3 font-mono">
                      {formatearARS(factura.total)}
                    </td>
                    <td className="py-3 font-mono text-xs text-[#BCB9B9]">
                      {factura.cae || '-'}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                        {factura.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
