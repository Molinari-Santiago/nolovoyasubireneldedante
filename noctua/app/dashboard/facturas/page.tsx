'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  EstadoArca,
  type ArcaEstado,
} from '@/components/facturas/EstadoArca';
import { FormularioCobro } from '@/components/facturas/FormularioCobro';
import { PedidoSelector } from '@/components/facturas/PedidoSelector';
import { TablaFacturas } from '@/components/facturas/TablaFacturas';
import { cn } from '@/hooks/lib/utils';

import {
  facturasService,
  type ClienteFacturaInput,
  type Factura,
  type FacturasFiltros,
  type MetodoPagoFactura,
  type Pago,
  type PedidoListoFactura,
  type TipoComprobante,
} from '@/services/facturasService';

type MensajeUI =
  | {
      tipo: 'success' | 'warning' | 'error';
      titulo: string;
      detalle?: string;
    }
  | null;

/**
 * Genera una clave única para evitar operaciones duplicadas,
 * especialmente en pagos de cuenta corriente.
 */
function createIdempotencyKey() {
  if (
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

/**
 * Descarga un archivo recibido como Blob.
 */
function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default function FacturasPage() {
  const [pedidos, setPedidos] = useState<
    PedidoListoFactura[]
  >([]);

  const [facturas, setFacturas] = useState<Factura[]>([]);

  const [
    pedidoSeleccionadoId,
    setPedidoSeleccionadoId,
  ] = useState('');

  const [arca, setArca] = useState<ArcaEstado>(null);
  const [mensaje, setMensaje] = useState<MensajeUI>(null);

  const [loading, setLoading] = useState(false);

  const [verificandoArca, setVerificandoArca] =
    useState(false);

  const [cobrando, setCobrando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const exportandoRef = useRef(false);

  const [metodoPago, setMetodoPago] =
    useState<MetodoPagoFactura>('efectivo');

  const [tipoComprobante, setTipoComprobante] =
    useState<TipoComprobante>(6);

  const [marcaTarjeta, setMarcaTarjeta] =
    useState('Visa');

  const [bancoTarjeta, setBancoTarjeta] =
    useState('');

  const [
    proveedorBilletera,
    setProveedorBilletera,
  ] = useState('Mercado Pago');

  const [referenciaPago, setReferenciaPago] =
    useState('');

  const [recibidoPor, setRecibidoPor] =
    useState('admin');

  const [montoRecibido, setMontoRecibido] =
    useState<number>(0);

  const [pagoPendiente, setPagoPendiente] =
    useState<Pago | null>(null);

  const [clienteCuenta, setClienteCuenta] =
    useState<ClienteFacturaInput>({});

  const [filtros, setFiltros] =
    useState<FacturasFiltros>({});

  /**
   * Busca el pedido seleccionado dentro de la lista actual.
   */
  const pedidoSeleccionado = useMemo(() => {
    return (
      pedidos.find(
        (pedido) =>
          pedido.id === pedidoSeleccionadoId
      ) || null
    );
  }, [pedidos, pedidoSeleccionadoId]);

  /**
   * Calcula el vuelto solamente cuando el monto recibido
   * supera el total del pedido.
   */
  const vuelto = useMemo(() => {
    if (!pedidoSeleccionado) return 0;

    const calculado =
      Number(montoRecibido || 0) -
      Number(pedidoSeleccionado.total || 0);

    return calculado > 0 ? calculado : 0;
  }, [montoRecibido, pedidoSeleccionado]);

  /**
   * Muestra mensajes personalizados dentro de la interfaz.
   */
  const mostrarMensaje = useCallback(
    (nuevoMensaje: MensajeUI) => {
      setMensaje(nuevoMensaje);
    },
    []
  );

  /**
   * Carga los pedidos disponibles y las facturas emitidas.
   *
   * Si el pedido actualmente seleccionado ya no existe,
   * selecciona automáticamente el siguiente disponible.
   */
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      const [
        pedidosListos,
        facturasEmitidas,
      ] = await Promise.all([
        facturasService.obtenerPedidosListos(),
        facturasService.obtenerFacturas(filtros),
      ]);

      const pedidosDisponibles = Array.isArray(
        pedidosListos
      )
        ? pedidosListos
        : [];

      const facturasDisponibles = Array.isArray(
        facturasEmitidas
      )
        ? facturasEmitidas
        : [];

      setPedidos(pedidosDisponibles);
      setFacturas(facturasDisponibles);

      const pedidoActualSigueDisponible =
        pedidosDisponibles.some(
          (pedido) =>
            pedido.id === pedidoSeleccionadoId
        );

      if (!pedidoActualSigueDisponible) {
        const siguientePedido =
          pedidosDisponibles[0] ?? null;

        setPedidoSeleccionadoId(
          siguientePedido?.id ?? ''
        );

        setMontoRecibido(
          Number(siguientePedido?.total ?? 0)
        );

        setPagoPendiente(null);
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
  }, [
    filtros,
    mostrarMensaje,
    pedidoSeleccionadoId,
  ]);

  /**
   * Comprueba la disponibilidad del servicio de ARCA.
   */
  const verificarARCA = useCallback(async () => {
    try {
      setVerificandoArca(true);

      const response =
        await facturasService.verificarARCA();

      setArca(response.arca);

      mostrarMensaje({
        tipo: 'success',
        titulo: 'ARCA verificado',
        detalle: response.arca.mensaje,
      });
    } catch (error) {
      const detalle =
        error instanceof Error
          ? error.message
          : 'No se pudo verificar ARCA';

      setArca({
        ok: false,
        mensaje: detalle,
      });

      mostrarMensaje({
        tipo: 'error',
        titulo: 'Error ARCA',
        detalle,
      });
    } finally {
      setVerificandoArca(false);
    }
  }, [mostrarMensaje]);

  /**
   * Limpia todos los campos del formulario de cobro.
   */
  const limpiarFormulario = useCallback(() => {
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
    setClienteCuenta({});
  }, []);

  /**
   * Selecciona un pedido y actualiza el monto recibido.
   */
  const seleccionarPedido = useCallback(
    (pedidoId: string) => {
      const nuevoPedido = pedidos.find(
        (pedido) => pedido.id === pedidoId
      );

      setPedidoSeleccionadoId(pedidoId);

      setMontoRecibido(
        Number(nuevoPedido?.total || 0)
      );

      setPagoPendiente(null);
    },
    [pedidos]
  );

  /**
   * Registra el pago y emite la factura.
   *
   * Para efectivo se crea primero un pago temporal.
   * Para los demás métodos, el pedido se elimina
   * inmediatamente de las opciones de cobro.
   */
  const cobrarPedido = useCallback(async () => {
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
        detalle:
          'Antes de cobrar tenes que verificar ARCA.',
      });

      return;
    }

    if (
      (metodoPago === 'debito' ||
        metodoPago === 'credito') &&
      !bancoTarjeta.trim()
    ) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Falta banco',
        detalle:
          'Indica el banco de la tarjeta.',
      });

      return;
    }

    if (
      metodoPago === 'billetera_virtual' &&
      !proveedorBilletera.trim()
    ) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Falta billetera',
        detalle:
          'Indica la billetera virtual utilizada.',
      });

      return;
    }

    if (
      metodoPago === 'efectivo' &&
      Number(montoRecibido || 0) <
        Number(pedidoSeleccionado.total || 0)
    ) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Monto insuficiente',
        detalle:
          'El monto recibido no puede ser menor al total del pedido.',
      });

      return;
    }

    if (
      metodoPago === 'cuenta_corriente' &&
      !clienteCuenta.nombre?.trim()
    ) {
      mostrarMensaje({
        tipo: 'warning',
        titulo: 'Falta cliente',
        detalle:
          'La cuenta corriente necesita un cliente.',
      });

      return;
    }

    /*
     * Guardamos el ID antes de limpiar el formulario.
     * Este valor será utilizado para retirar el pedido
     * de la lista una vez completado el cobro.
     */
    const pedidoCobradoId =
      pedidoSeleccionado.id;

    try {
      setCobrando(true);

      const response =
        await facturasService.cobrarPedido({
          pedidoId: pedidoCobradoId,
          metodoPago,
          tipoComprobante,

          tipoTarjeta:
            metodoPago === 'debito' ||
            metodoPago === 'credito'
              ? metodoPago
              : undefined,

          marcaTarjeta:
            metodoPago === 'debito' ||
            metodoPago === 'credito'
              ? marcaTarjeta
              : undefined,

          bancoTarjeta:
            metodoPago === 'debito' ||
            metodoPago === 'credito'
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

          cliente:
            metodoPago === 'cuenta_corriente'
              ? clienteCuenta
              : undefined,

          idempotencyKey:
            metodoPago === 'cuenta_corriente'
              ? createIdempotencyKey()
              : undefined,
        });

      /*
       * El pago en efectivo todavía no cierra el pedido.
       * Primero debe ser confirmado por el usuario.
       */
      if (response.requiereConfirmacion) {
        setPagoPendiente(response.pago);

        mostrarMensaje({
          tipo: 'warning',
          titulo: 'Efectivo pendiente',
          detalle:
            'El pago quedó guardado temporalmente. Confirmalo para cerrar la mesa.',
        });

        return;
      }

      /*
       * Para tarjeta, billetera y cuenta corriente,
       * quitamos inmediatamente el pedido de la lista.
       */
      setPedidos((actuales) =>
        actuales.filter(
          (pedido) =>
            pedido.id !== pedidoCobradoId
        )
      );

      mostrarMensaje({
        tipo: 'success',

        titulo:
          metodoPago === 'cuenta_corriente'
            ? 'Débito registrado'
            : 'Factura emitida',

        detalle:
          metodoPago === 'cuenta_corriente'
            ? 'La factura quedó vinculada a la cuenta corriente y el pedido fue cerrado.'
            : 'El pedido fue cerrado y la mesa quedó libre.',
      });

      limpiarFormulario();

      /*
       * Consultamos nuevamente el backend para confirmar
       * que el pedido realmente dejó de estar disponible.
       */
      await cargarDatos();
    } catch (error) {
      /*
       * Puede ocurrir que la factura se haya registrado
       * correctamente, pero la respuesta HTTP haya fallado.
       *
       * Antes de mostrar un error, comprobamos si la
       * factura ya existe.
       */
      try {
        const facturasActualizadas =
          await facturasService.obtenerFacturas(
            filtros
          );

        const facturaCreada =
          facturasActualizadas.find(
            (factura) =>
              factura.pedidoId ===
              pedidoCobradoId
          );

        if (facturaCreada) {
          setPedidos((actuales) =>
            actuales.filter(
              (pedido) =>
                pedido.id !== pedidoCobradoId
            )
          );

          mostrarMensaje({
            tipo: 'success',
            titulo: 'Factura emitida',
            detalle:
              'La factura fue registrada. El listado de pedidos fue actualizado.',
          });

          limpiarFormulario();
          await cargarDatos();

          return;
        }
      } catch {
        /*
         * Si la comprobación también falla,
         * mostramos el error original.
         */
      }

      mostrarMensaje({
        tipo: 'error',
        titulo: 'Error al cobrar',
        detalle:
          error instanceof Error
            ? error.message
            : 'No se pudo cobrar el pedido',
      });
    } finally {
      setCobrando(false);
    }
  }, [
    arca,
    bancoTarjeta,
    cargarDatos,
    clienteCuenta,
    filtros,
    limpiarFormulario,
    marcaTarjeta,
    metodoPago,
    montoRecibido,
    pedidoSeleccionado,
    proveedorBilletera,
    recibidoPor,
    referenciaPago,
    tipoComprobante,
    vuelto,
    mostrarMensaje,
  ]);

  /**
   * Confirma un pago temporal en efectivo.
   *
   * Después de confirmar:
   * - se emite la factura;
   * - se cierra el pedido;
   * - se libera la mesa;
   * - se elimina el pedido de la lista.
   */
  const confirmarEfectivo =
    useCallback(async () => {
      if (!pagoPendiente) {
        mostrarMensaje({
          tipo: 'warning',
          titulo: 'No hay pago pendiente',
          detalle:
            'Primero tenes que registrar un pago en efectivo.',
        });

        return;
      }

      /*
       * Tomamos el pedido relacionado con el pago.
       * Utilizamos el pedido seleccionado como respaldo.
       */
      const pedidoCobradoId =
        pagoPendiente.pedidoId ||
        pedidoSeleccionadoId;

      try {
        setCobrando(true);

        await facturasService.confirmarPagoEfectivo(
          {
            pagoId: pagoPendiente.id,
            recibidoPor,
            montoRecibido,
            vuelto,
          }
        );

        /*
         * Quitamos inmediatamente el pedido
         * de las opciones disponibles.
         */
        if (pedidoCobradoId) {
          setPedidos((actuales) =>
            actuales.filter(
              (pedido) =>
                pedido.id !==
                pedidoCobradoId
            )
          );
        }

        mostrarMensaje({
          tipo: 'success',
          titulo: 'Efectivo confirmado',
          detalle:
            'La factura fue emitida, el pedido fue cerrado y la mesa quedó libre.',
        });

        setPagoPendiente(null);
        limpiarFormulario();

        /*
         * Confirmamos nuevamente el estado real
         * consultando el backend.
         */
        await cargarDatos();
      } catch (error) {
        mostrarMensaje({
          tipo: 'error',
          titulo:
            'Error al confirmar efectivo',
          detalle:
            error instanceof Error
              ? error.message
              : 'No se pudo confirmar el efectivo',
        });
      } finally {
        setCobrando(false);
      }
    }, [
      cargarDatos,
      limpiarFormulario,
      montoRecibido,
      mostrarMensaje,
      pagoPendiente,
      pedidoSeleccionadoId,
      recibidoPor,
      vuelto,
    ]);

  /**
   * Exporta las facturas aplicando los filtros actuales.
   */
  const exportarFacturas =
    useCallback(async () => {
      if (exportandoRef.current) return;

      exportandoRef.current = true;

      try {
        setExportando(true);

        const archivo =
          await facturasService.exportarFacturas(
            filtros
          );

        descargarBlob(
          archivo.blob,
          archivo.filename
        );

        mostrarMensaje({
          tipo: 'success',
          titulo: 'Exportación lista',
          detalle:
            'El archivo Excel fue generado.',
        });
      } catch (error) {
        mostrarMensaje({
          tipo: 'error',
          titulo: 'Error al exportar',
          detalle:
            error instanceof Error
              ? error.message
              : 'No se pudo generar el Excel.',
        });
      } finally {
        exportandoRef.current = false;
        setExportando(false);
      }
    }, [filtros, mostrarMensaje]);

  /**
   * Evita pasar una promesa directamente al componente.
   */
  const handleCobrar = useCallback(() => {
    void cobrarPedido();
  }, [cobrarPedido]);

  /**
   * Confirma el efectivo desde el formulario.
   */
  const handleConfirmarEfectivo =
    useCallback(() => {
      void confirmarEfectivo();
    }, [confirmarEfectivo]);

  /**
   * Carga inicial de pedidos y facturas.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cargarDatos]);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-[0.18em] uppercase">
            Facturas
          </h1>

          <p className="text-sm text-[#676B67] mt-1">
            Selecciona un pedido listo para
            cobrar, verifica ARCA y emite la
            factura.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/facturas/cuentas-corrientes"
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20"
          >
            <Users size={16} />
            Cuentas corrientes
          </Link>

          <button
            type="button"
            onClick={() => {
              void verificarARCA();
            }}
            disabled={verificandoArca}
            className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
          >
            <ShieldCheck size={16} />

            {verificandoArca
              ? 'Verificando...'
              : 'Verificar ARCA'}
          </button>

          <button
            type="button"
            onClick={() => {
              void cargarDatos();
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm font-bold text-[#BCB9B9] hover:bg-[#151515] disabled:opacity-50"
          >
            <RefreshCcw size={16} />

            {loading
              ? 'Actualizando...'
              : 'Actualizar'}
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
              <p className="text-sm mt-1 opacity-80">
                {mensaje.detalle}
              </p>
            )}
          </div>
        </section>
      )}

      <EstadoArca arca={arca} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <PedidoSelector
          pedidos={pedidos}
          pedidoSeleccionado={
            pedidoSeleccionado
          }
          pedidoSeleccionadoId={
            pedidoSeleccionadoId
          }
          onSeleccionarPedido={
            seleccionarPedido
          }
        />

        <FormularioCobro
          pedidoSeleccionado={
            pedidoSeleccionado
          }
          metodoPago={metodoPago}
          tipoComprobante={tipoComprobante}
          marcaTarjeta={marcaTarjeta}
          bancoTarjeta={bancoTarjeta}
          proveedorBilletera={
            proveedorBilletera
          }
          referenciaPago={referenciaPago}
          recibidoPor={recibidoPor}
          montoRecibido={montoRecibido}
          vuelto={vuelto}
          clienteCuenta={clienteCuenta}
          pagoPendiente={pagoPendiente}
          cobrando={cobrando}
          onMetodoPagoChange={setMetodoPago}
          onTipoComprobanteChange={
            setTipoComprobante
          }
          onMarcaTarjetaChange={
            setMarcaTarjeta
          }
          onBancoTarjetaChange={
            setBancoTarjeta
          }
          onProveedorBilleteraChange={
            setProveedorBilletera
          }
          onReferenciaPagoChange={
            setReferenciaPago
          }
          onRecibidoPorChange={
            setRecibidoPor
          }
          onMontoRecibidoChange={
            setMontoRecibido
          }
          onClienteCuentaChange={
            setClienteCuenta
          }
          onCobrar={handleCobrar}
          onConfirmarEfectivo={
            handleConfirmarEfectivo
          }
        />
      </div>

      <TablaFacturas
        facturas={facturas}
        filtros={filtros}
        exportando={exportando}
        onFiltroChange={setFiltros}
        onExportar={() => {
          void exportarFacturas();
        }}
      />
    </div>
  );
}