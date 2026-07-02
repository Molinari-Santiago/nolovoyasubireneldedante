# Contexto de facturacion NOCTUA

Fecha de analisis: 2026-07-02

Este documento se concentra en facturacion, cuenta corriente y exportacion a Excel. No contiene valores de `.env`; solo nombres de variables cuando aparecen en codigo.

## 1. Flujo de facturacion

Flujo principal para cobrar y facturar:

```text
noctua/app/dashboard/facturas/page.tsx
-> components/facturas/PedidoSelector + FormularioCobro + EstadoArca + TablaFacturas
-> noctua/services/facturasService.ts
-> http://localhost:3001/api/facturas/...
-> backend-reservas/src/routes/facturas.routes.js
-> backend-reservas/src/controllers/facturas.controller.js
-> backend-reservas/src/services/arca.service.js
-> backend-reservas/src/services/cuentaCorriente.service.js
-> Supabase tablas pedidos, pedido_items, productos, mesas, pagos, facturas, clientes, cuentas_corrientes, movimientos_cuenta_corriente
```

Flujo de exportacion de facturas:

```text
TablaFacturas.onExportar
-> facturasService.exportarFacturas(filtros)
-> GET /api/facturas/exportar
-> facturas.routes.js
-> facturasExport.controller.js
-> obtenerFacturasFiltradas()
-> excel.service.js / generarExcelFacturas()
-> Supabase facturas, pagos, clientes
-> respuesta XLSX con Content-Disposition
```

Flujo de cuenta corriente:

```text
/dashboard/facturas/cuentas-corrientes
-> facturasService.obtenerCuentasCorrientes()
-> GET /api/facturas/cuentas-corrientes
-> cuentasCorrientes.controller.js
-> cuentaCorriente.service.js
-> Supabase clientes, cuentas_corrientes, movimientos_cuenta_corriente, pagos_cuenta_corriente, facturas
```

## 2. Archivos relacionados

Archivos directamente relacionados:

- `backend-reservas/src/routes/facturas.routes.js`: registra endpoints de ARCA, cobro, facturas, exportacion y cuentas corrientes.
- `backend-reservas/src/controllers/facturas.controller.js`: orquesta pedidos listos, cobro, pagos, emision simulada y facturas.
- `backend-reservas/src/controllers/facturasExport.controller.js`: consulta facturas filtradas y devuelve Excel.
- `backend-reservas/src/controllers/cuentasCorrientes.controller.js`: endpoints de resumen/detalle/pago/ajuste/reversion/export de cuenta corriente.
- `backend-reservas/src/services/arca.service.js`: CAE simulado de desarrollo.
- `backend-reservas/src/services/excel.service.js`: genera XLSX de facturas y cuenta corriente con ExcelJS.
- `backend-reservas/src/services/cuentaCorriente.service.js`: clientes, saldos, movimientos, pagos y ajustes.
- `backend-reservas/src/utils/authz.js`: permisos por rol para facturacion.
- `backend-reservas/sql/facturacion-cuenta-corriente.sql`: SQL manual de clientes y cuenta corriente.
- `noctua/services/facturasService.ts`: cliente frontend de todos los endpoints de facturacion.
- `noctua/app/dashboard/facturas/page.tsx`: pantalla principal de facturacion.
- `noctua/app/dashboard/facturas/cuentas-corrientes/page.tsx`: listado de cuentas corrientes.
- `noctua/app/dashboard/facturas/cuentas-corrientes/[clienteId]/page.tsx`: detalle de cuenta corriente.
- `noctua/components/facturas/EstadoArca.tsx`: estado visual ARCA.
- `noctua/components/facturas/FormularioCobro.tsx`: formulario de metodo de pago, comprobante y cliente.
- `noctua/components/facturas/PedidoSelector.tsx`: seleccion de pedidos listos.
- `noctua/components/facturas/TablaFacturas.tsx`: filtros, tabla y exportacion.
- `noctua/components/facturas/facturasConstants.ts`: tipos de comprobante, metodos de pago y formateo ARS.
- `noctua/base-de-datos.sql`: esquema Supabase de contexto; contiene `facturas` y `pagos`.
- `backend-reservas/prisma/schema.prisma`: modelo historico `Factura`, no parece usado por runtime actual.
- `backend-reservas/prisma/migrations/20260516174905_agregar_facturas/migration.sql`: migracion Prisma historica de `Factura`.

Archivos relacionados indirectamente:

- `backend-reservas/src/app.js`: monta `/api/facturas`.
- `backend-reservas/src/config/env.js`: define variables necesarias de Supabase.
- `backend-reservas/src/config/supabaseAdmin.js`: cliente Supabase Admin.
- `noctua/config/roles.ts`: `cajero` apunta a `/dashboard/facturas`.
- `noctua/components/layout/Sidebar.tsx`: muestra Facturas segun rol.
- `noctua/store/authStore.ts`: rol usado por `facturasService` para headers.
- `noctua/components/dashboard/PaymentMethodsChart.tsx`: analytics de metodos de pago.
- `noctua/utils/exportDashboard.ts`: export CSV/PDF de dashboard, no de facturas.

No se encontraron archivos especificos de recibos ni notas de credito implementadas. `CREDIT_NOTE` aparece como origen permitido de movimientos, pero no hay flujo completo confirmado.

## 3. Contenido completo de archivos clave

## Archivo: backend-reservas/src/routes/facturas.routes.js

```js
import { Router } from "express";

import {
  verificarARCAController,
  obtenerPedidosListosParaCobrar,
  cobrarPedido,
  confirmarPagoEfectivo,
  obtenerFacturas,
  obtenerFacturaPorId,
} from "../controllers/facturas.controller.js";
import {
  exportarCuentaCorriente,
  listarCuentasCorrientes,
  obtenerCuentaCorriente,
  registrarAjusteCliente,
  registrarPagoCliente,
  revertirMovimientoCliente,
} from "../controllers/cuentasCorrientes.controller.js";
import { exportarFacturas } from "../controllers/facturasExport.controller.js";

const router = Router();

router.get("/arca/verificar", verificarARCAController);
router.get("/pedidos/listos", obtenerPedidosListosParaCobrar);

router.post("/pedido/:pedidoId/cobrar", cobrarPedido);
router.post("/:pedidoId/cobrar", cobrarPedido);

router.post("/pago/:pagoId/confirmar-efectivo", confirmarPagoEfectivo);

router.get("/exportar", exportarFacturas);
router.get("/cuentas-corrientes", listarCuentasCorrientes);
router.get("/cuentas-corrientes/:clienteId/exportar", exportarCuentaCorriente);
router.get("/cuentas-corrientes/:clienteId", obtenerCuentaCorriente);
router.post("/cuentas-corrientes/:clienteId/pagos", registrarPagoCliente);
router.post("/cuentas-corrientes/:clienteId/ajustes", registrarAjusteCliente);
router.post("/cuentas-corrientes/movimientos/:movimientoId/revertir", revertirMovimientoCliente);

router.get("/", obtenerFacturas);
router.get("/:id", obtenerFacturaPorId);

export default router;
```

## Archivo: backend-reservas/src/controllers/facturas.controller.js

```js
import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { solicitarCAE } from "../services/arca.service.js";
import {
  buscarMovimientoPorIdempotency,
  crearDebitoFacturaCuentaCorriente,
  mapCliente,
  mapMovimientoCuentaCorriente,
  obtenerOCrearCliente,
} from "../services/cuentaCorriente.service.js";
import {
  obtenerUsuarioRequest,
  rechazarSinPermisoFacturacion,
} from "../utils/authz.js";

const ESTADOS_LISTOS_PARA_COBRAR = [
  "listo",
  "entregado",
  "lista_para_cobrar",
];

const METODOS_PAGO = ["efectivo", "billetera_virtual", "debito", "credito", "cuenta_corriente"];
const TIPOS_COMPROBANTE = [1, 6, 11];

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function calcularImpuestos(total) {
  const totalNumero = Number(total || 0);
  const subtotal = totalNumero / 1.21;
  const impuestos = totalNumero - subtotal;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    impuestos: Number(impuestos.toFixed(2)),
    total: Number(totalNumero.toFixed(2)),
  };
}

function mapProducto(producto) {
  if (!producto) return null;

  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio || 0),
    categoriaId: producto.categoria_id,
  };
}

function mapItem(item) {
  return {
    id: item.id,
    pedidoId: item.pedido_id,
    productoId: item.producto_id,
    cantidad: Number(item.cantidad || 0),
    precioUnitario: Number(item.precio_unitario || 0),
    subtotal: Number(item.subtotal || 0),
    notas: item.notas || null,
    producto: mapProducto(item.productos),
  };
}

function mapMesa(mesa) {
  if (!mesa) return null;

  return {
    id: mesa.id,
    numero: mesa.numero,
    zona: mesa.zona,
    capacidad: mesa.capacidad,
    estado: mesa.estado,
    disponible: mesa.disponible,
  };
}

function mapPedido(pedido) {
  return {
    id: pedido.id,
    mesaId: pedido.mesa_id,
    usuarioId: pedido.usuario_id,
    estado: pedido.estado,
    subtotal: Number(pedido.subtotal || 0),
    impuestos: Number(pedido.impuestos || 0),
    total: Number(pedido.total || 0),
    abiertoEn: pedido.abierto_en,
    creadoEn: pedido.created_at,
    mesa: mapMesa(pedido.mesas),
    items: (pedido.pedido_items || []).map(mapItem),
  };
}

function mapPago(pago) {
  if (!pago) return null;

  return {
    id: pago.id,
    pedidoId: pago.pedido_id,
    mesaId: pago.mesa_id,
    clienteId: pago.cliente_id,
    metodoPago: pago.metodo_pago,
    tipoComprobante: Number(pago.tipo_comprobante || 6),
    monto: Number(pago.monto || 0),
    estado: pago.estado,
    tipoTarjeta: pago.tipo_tarjeta,
    marcaTarjeta: pago.marca_tarjeta,
    bancoTarjeta: pago.banco_tarjeta,
    proveedorBilletera: pago.proveedor_billetera,
    referenciaPago: pago.referencia_pago,
    temporal: pago.temporal,
    expiraEn: pago.expira_en,
    confirmadoEn: pago.confirmado_en,
    recibidoPor: pago.recibido_por,
    montoRecibido: Number(pago.monto_recibido || 0),
    vuelto: Number(pago.vuelto || 0),
    creadoEn: pago.creado_en,
  };
}

function mapFactura(factura) {
  if (!factura) return null;

  return {
    id: factura.id,
    pedidoId: factura.pedido_id,
    pagoId: factura.pago_id,
    mesaId: factura.mesa_id,
    clienteId: factura.cliente_id,
    numeroComprobante: factura.numero_comprobante,
    tipoComprobante: Number(factura.tipo_comprobante || 6),
    metodoPago: factura.metodo_pago,
    subtotal: money(factura.subtotal),
    impuestos: money(factura.impuestos),
    descuento: money(factura.descuento),
    total: money(factura.total),
    saldoPendiente: money(factura.saldo_pendiente),
    estado: factura.estado,
    cae: factura.cae,
    vencimientoCae: factura.vencimiento_cae,
    qrFiscal: factura.qr_fiscal,
    arcaEstado: factura.arca_estado,
    arcaError: factura.arca_error,
    creadoEn: factura.creado_en,
    cliente: factura.clientes ? mapCliente(factura.clientes) : null,
    pedido: factura.pedidos ? mapPedido(factura.pedidos) : null,
    pago: factura.pagos ? mapPago(factura.pagos) : null,
  };
}

async function obtenerPedidoCompleto(pedidoId) {
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select(`
      *,
      mesas(*),
      pedido_items(
        *,
        productos(*)
      )
    `)
    .eq("id", pedidoId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Pedido no encontrado");
  }

  return data;
}

async function obtenerFacturaPorMovimiento(movimiento) {
  if (!movimiento?.factura_id) return null;

  const { data, error } = await supabaseAdmin
    .from("facturas")
    .select("*, pagos(*)")
    .eq("id", movimiento.factura_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function emitirComprobante({ pedido, pago, tipoComprobante }) {
  const importes = calcularImpuestos(pedido.total);
  const respuesta = await solicitarCAE({
    tipoComprobante,
    puntoVenta: Number(process.env.ARCA_PUNTO_VENTA || 1),
    concepto: 1,
    tipoDocumento: 99,
    numeroDocumento: "0",
    importeNeto: importes.subtotal,
    importeIVA: importes.impuestos,
    importeTotal: importes.total,
    metodoPago: pago.metodo_pago,
    productos: (pedido.pedido_items || []).map((item) => ({
      nombre: item.productos?.nombre || "Producto",
      cantidad: item.cantidad,
      precioUnitario: item.precio_unitario,
      subtotal: item.subtotal,
    })),
  });

  return {
    ok: respuesta.exito !== false,
    numeroComprobante: String(respuesta.numeroComprobante || Date.now()),
    tipoComprobante,
    cae: respuesta.cae,
    vencimientoCae: respuesta.vencimientoCAE,
    qrFiscal: respuesta.qrFiscal || null,
    raw: respuesta,
  };
}

async function crearFacturaDesdePago({
  pedido,
  pago,
  arca,
  clienteId = null,
  estado = "emitida",
  saldoPendiente = 0,
}) {
  const importes = calcularImpuestos(pedido.total);
  const payload = {
    pedido_id: pedido.id,
    pago_id: pago.id,
    mesa_id: pedido.mesa_id,
    numero_comprobante: arca.numeroComprobante,
    tipo_comprobante: arca.tipoComprobante || pago.tipo_comprobante || 6,
    metodo_pago: pago.metodo_pago,
    subtotal: importes.subtotal,
    impuestos: importes.impuestos,
    total: importes.total,
    estado,
    cae: arca.cae,
    vencimiento_cae: arca.vencimientoCae,
    qr_fiscal: arca.qrFiscal,
    arca_estado: "aprobado",
    arca_error: null,
  };

  if (clienteId) payload.cliente_id = clienteId;
  if (Number(saldoPendiente || 0) > 0 || estado !== "emitida") {
    payload.saldo_pendiente = money(saldoPendiente);
  }

  const { data: factura, error } = await supabaseAdmin
    .from("facturas")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return factura;
}

async function cerrarPedidoYLiberarMesa(pedido) {
  const { error: pedidoError } = await supabaseAdmin
    .from("pedidos")
    .update({ estado: "cerrada" })
    .eq("id", pedido.id);

  if (pedidoError) throw new Error(pedidoError.message);

  if (pedido.mesa_id) {
    const { error: mesaError } = await supabaseAdmin
      .from("mesas")
      .update({ estado: "libre", disponible: true })
      .eq("id", pedido.mesa_id);

    if (mesaError) throw new Error(mesaError.message);
  }
}

async function cerrarPedidoYLiberarMesaSeguro(pedido) {
  try {
    await cerrarPedidoYLiberarMesa(pedido);
    return null;
  } catch (error) {
    console.error("Factura emitida, pero fallo el cierre del pedido/mesa:", {
      pedidoId: pedido?.id,
      mesaId: pedido?.mesa_id,
      error: error.message,
    });
    return error.message;
  }
}

export const verificarARCAController = async (req, res) => {
  return res.json({
    mensaje: "ARCA verificado correctamente",
    arca: {
      ok: true,
      mensaje: "ARCA disponible en modo desarrollo",
      modo: process.env.ARCA_MODO || "homologacion",
      cuit: process.env.ARCA_CUIT,
      puntoVenta: Number(process.env.ARCA_PUNTO_VENTA || 1),
    },
    tiposComprobante: [
      { codigo: 1, nombre: "Factura A" },
      { codigo: 6, nombre: "Factura B" },
      { codigo: 11, nombre: "Factura C" },
    ],
  });
};

export const obtenerPedidosListosParaCobrar = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .select(`
        *,
        mesas(*),
        pedido_items(
          *,
          productos(*)
        )
      `)
      .in("estado", ESTADOS_LISTOS_PARA_COBRAR)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const pedidos = (data || []).map(mapPedido);

    return res.json({
      mensaje: "Pedidos listos para cobrar obtenidos correctamente",
      total: pedidos.length,
      pedidos,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener pedidos listos para cobrar",
      error: error.message,
    });
  }
};

export const cobrarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const {
      metodoPago,
      tipoComprobante = 6,
      tipoTarjeta,
      marcaTarjeta,
      bancoTarjeta,
      proveedorBilletera,
      referenciaPago,
      recibidoPor,
      montoRecibido,
      vuelto,
      cliente,
      idempotencyKey,
    } = req.body;

    if (!pedidoId) {
      return res.status(400).json({ mensaje: "El ID del pedido es obligatorio" });
    }

    if (!METODOS_PAGO.includes(metodoPago)) {
      return res.status(400).json({ mensaje: "Metodo de pago invalido" });
    }

    if (metodoPago === "cuenta_corriente" && rechazarSinPermisoFacturacion(req, res)) return;

    if (metodoPago === "cuenta_corriente" && idempotencyKey) {
      const movimientoExistente = await buscarMovimientoPorIdempotency(idempotencyKey);
      if (movimientoExistente) {
        const facturaExistente = await obtenerFacturaPorMovimiento(movimientoExistente);
        return res.status(200).json({
          mensaje: "La factura a cuenta corriente ya habia sido registrada",
          factura: mapFactura(facturaExistente),
          movimiento: mapMovimientoCuentaCorriente(movimientoExistente),
          requiereConfirmacion: false,
          idempotente: true,
        });
      }
    }

    const tipoComprobanteNumero = Number(tipoComprobante || 6);
    if (!TIPOS_COMPROBANTE.includes(tipoComprobanteNumero)) {
      return res.status(400).json({ mensaje: "Tipo de comprobante invalido" });
    }

    const pedidoRaw = await obtenerPedidoCompleto(pedidoId);
    const pedido = mapPedido(pedidoRaw);

    if (!pedido.items.length) {
      return res.status(400).json({
        mensaje: "No se puede cobrar un pedido sin productos",
      });
    }

    if (pedido.estado === "cerrada") {
      return res.status(400).json({ mensaje: "Este pedido ya fue cerrado" });
    }

    if (!ESTADOS_LISTOS_PARA_COBRAR.includes(pedido.estado)) {
      return res.status(400).json({
        mensaje: "El pedido todavia no esta listo para cobrar",
        estadoActual: pedido.estado,
      });
    }

    const usuario = obtenerUsuarioRequest(req);
    const clienteCuenta = metodoPago === "cuenta_corriente"
      ? await obtenerOCrearCliente(cliente || {})
      : null;

    const pagoTemporal = metodoPago === "efectivo";
    const pagoPayload = {
      pedido_id: pedido.id,
      mesa_id: pedido.mesaId,
      metodo_pago: metodoPago,
      tipo_comprobante: tipoComprobanteNumero,
      monto: pedido.total,
      estado: pagoTemporal || metodoPago === "cuenta_corriente" ? "pendiente" : "pagado",
      tipo_tarjeta:
        metodoPago === "debito" || metodoPago === "credito"
          ? tipoTarjeta || metodoPago
          : null,
      marca_tarjeta: marcaTarjeta || null,
      banco_tarjeta: bancoTarjeta || null,
      proveedor_billetera: proveedorBilletera || null,
      referencia_pago: referenciaPago || null,
      temporal: pagoTemporal,
      expira_en: pagoTemporal
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null,
      confirmado_en: pagoTemporal || metodoPago === "cuenta_corriente" ? null : new Date().toISOString(),
      recibido_por: recibidoPor || null,
      monto_recibido: metodoPago === "cuenta_corriente" ? 0 : Number(montoRecibido || 0),
      vuelto: metodoPago === "cuenta_corriente" ? 0 : Number(vuelto || 0),
    };

    if (clienteCuenta) pagoPayload.cliente_id = clienteCuenta.id;

    const { data: pago, error: pagoError } = await supabaseAdmin
      .from("pagos")
      .insert(pagoPayload)
      .select()
      .single();

    if (pagoError) {
      return res.status(500).json({
        mensaje: "Error al guardar el pago",
        error: pagoError.message,
      });
    }

    if (pagoTemporal) {
      return res.status(201).json({
        mensaje: "Pago en efectivo registrado temporalmente",
        pago: mapPago(pago),
        pedido,
        requiereConfirmacion: true,
      });
    }

    const arca = await emitirComprobante({
      pedido: pedidoRaw,
      pago,
      tipoComprobante: tipoComprobanteNumero,
    });
    const factura = await crearFacturaDesdePago({
      pedido: pedidoRaw,
      pago,
      arca,
      clienteId: clienteCuenta?.id || null,
      estado: metodoPago === "cuenta_corriente" ? "pendiente" : "emitida",
      saldoPendiente: metodoPago === "cuenta_corriente" ? pedido.total : 0,
    });

    let movimiento = null;
    if (metodoPago === "cuenta_corriente") {
      movimiento = await crearDebitoFacturaCuentaCorriente({
        clienteId: clienteCuenta.id,
        factura,
        creadoPor: recibidoPor || usuario.nombre || usuario.rol,
        idempotencyKey,
      });
    }

    const advertenciaCierre = await cerrarPedidoYLiberarMesaSeguro(pedidoRaw);

    return res.status(201).json({
      mensaje: advertenciaCierre
        ? "Pedido cobrado y facturado. Revisar cierre de mesa."
        : "Pedido cobrado, facturado y mesa cerrada",
      arca,
      pago: mapPago(pago),
      factura: mapFactura(factura),
      cliente: mapCliente(clienteCuenta),
      movimiento: mapMovimientoCuentaCorriente(movimiento),
      pedido,
      advertencia: advertenciaCierre,
      requiereConfirmacion: false,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al cobrar pedido",
      error: error.message,
    });
  }
};

export const confirmarPagoEfectivo = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const { recibidoPor, montoRecibido, vuelto } = req.body;

    const { data: pago, error: pagoError } = await supabaseAdmin
      .from("pagos")
      .select("*")
      .eq("id", pagoId)
      .single();

    if (pagoError || !pago) {
      return res.status(404).json({
        mensaje: "Pago no encontrado",
        error: pagoError?.message,
      });
    }

    const pedidoRaw = await obtenerPedidoCompleto(pago.pedido_id);
    const arca = await emitirComprobante({
      pedido: pedidoRaw,
      pago,
      tipoComprobante: pago.tipo_comprobante || 6,
    });

    const { data: pagoActualizado, error: updateError } = await supabaseAdmin
      .from("pagos")
      .update({
        estado: "pagado",
        temporal: false,
        confirmado_en: new Date().toISOString(),
        recibido_por: recibidoPor || pago.recibido_por,
        monto_recibido: Number(montoRecibido || pago.monto_recibido || 0),
        vuelto: Number(vuelto || pago.vuelto || 0),
      })
      .eq("id", pagoId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    const factura = await crearFacturaDesdePago({
      pedido: pedidoRaw,
      pago: pagoActualizado,
      arca,
    });
    const advertenciaCierre = await cerrarPedidoYLiberarMesaSeguro(pedidoRaw);

    return res.json({
      mensaje: advertenciaCierre
        ? "Efectivo confirmado y factura emitida. Revisar cierre de mesa."
        : "Efectivo confirmado, factura emitida y mesa cerrada",
      arca,
      pago: mapPago(pagoActualizado),
      factura: mapFactura(factura),
      advertencia: advertenciaCierre,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al confirmar pago en efectivo",
      error: error.message,
    });
  }
};

export const obtenerFacturas = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from("facturas")
      .select(`
        *,
        pagos(*),
        pedidos(
          *,
          mesas(*),
          pedido_items(
            *,
            productos(*)
          )
        )
      `)
      .order("creado_en", { ascending: false })
      .limit(Math.min(Number(req.query.limit || 20), 200));

    if (req.query.desde) query = query.gte("creado_en", `${req.query.desde}T00:00:00.000Z`);
    if (req.query.hasta) query = query.lte("creado_en", `${req.query.hasta}T23:59:59.999Z`);
    if (req.query.estado) query = query.eq("estado", req.query.estado);
    if (req.query.metodoPago) query = query.eq("metodo_pago", req.query.metodoPago);
    if (req.query.tipoComprobante) query = query.eq("tipo_comprobante", Number(req.query.tipoComprobante));
    if (req.query.clienteId) query = query.eq("cliente_id", req.query.clienteId);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const facturas = (data || []).map(mapFactura);
    return res.json({
      mensaje: "Facturas obtenidas correctamente",
      total: facturas.length,
      facturas,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener facturas",
      error: error.message,
    });
  }
};

export const obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("facturas")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        mensaje: "Factura no encontrada",
        error: error?.message,
      });
    }

    return res.json({
      mensaje: "Factura encontrada",
      factura: mapFactura(data),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener factura",
      error: error.message,
    });
  }
};
```

## Archivo: backend-reservas/src/controllers/facturasExport.controller.js

```js
import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { generarExcelFacturas } from "../services/excel.service.js";
import { rechazarSinPermisoFacturacion } from "../utils/authz.js";

const EXPORT_LIMIT = 5000;
const FACTURAS_SELECT = `
  *,
  pagos(*)
`;

class ExportacionFacturasError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = "ExportacionFacturasError";
    this.statusCode = statusCode;
    Object.assign(this, details);
  }
}

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function isMissingClienteSchema(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("clientes") ||
    message.includes("cliente_id") ||
    message.includes("relationship between 'facturas' and 'clientes'")
  );
}

function isMissingPagosRelationship(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("relationship") && message.includes("facturas") && message.includes("pagos");
}

function mapCliente(cliente) {
  if (!cliente) return null;
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    documento: cliente.documento,
    condicionFiscal: cliente.condicion_fiscal,
  };
}

function mapPago(pago) {
  if (!pago) return null;
  return {
    id: pago.id,
    metodoPago: pago.metodo_pago,
    estado: pago.estado,
    confirmadoEn: pago.confirmado_en,
  };
}

function mapFacturaExport(factura) {
  return {
    id: factura.id,
    numeroComprobante: factura.numero_comprobante,
    tipoComprobante: Number(factura.tipo_comprobante || factura.tipo_cbte || 6),
    creadoEn: factura.creado_en || factura.creada_en,
    cliente: mapCliente(factura.cliente || factura.clientes),
    subtotal: money(factura.subtotal),
    impuestos: money(factura.impuestos),
    descuento: money(factura.descuento),
    total: money(factura.total),
    metodoPago: factura.metodo_pago,
    estado: factura.estado,
    cae: factura.cae,
    vencimientoCae: factura.vencimiento_cae,
    puntoVenta: factura.punto_venta,
    saldoPendiente: money(factura.saldo_pendiente),
    pago: mapPago(factura.pagos),
  };
}

function aplicarFiltros(query, queryParams = {}) {
  const { desde, hasta, estado, tipoComprobante, metodoPago } = queryParams;

  if (desde) query = query.gte("creado_en", `${desde}T00:00:00.000Z`);
  if (hasta) query = query.lte("creado_en", `${hasta}T23:59:59.999Z`);
  if (estado) query = query.eq("estado", estado);
  if (tipoComprobante) query = query.eq("tipo_comprobante", Number(tipoComprobante));
  if (metodoPago) query = query.eq("metodo_pago", metodoPago);

  return query;
}

async function idsClientesPorBusqueda(texto) {
  if (!texto) return null;

  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("id")
    .or(`nombre.ilike.%${texto}%,documento.ilike.%${texto}%`)
    .limit(200);

  if (error) {
    if (isMissingClienteSchema(error)) {
      throw new ExportacionFacturasError(
        "El filtro por cliente requiere aplicar el esquema de clientes de facturacion.",
        400,
        { code: error.code, queryDetails: "clientes.select(id).or(nombre/documento)" }
      );
    }
    throw new Error(error.message);
  }

  return (data || []).map((cliente) => cliente.id);
}

async function hidratarClientes(facturas) {
  const clienteIds = [...new Set(
    facturas
      .map((factura) => factura.cliente_id)
      .filter(Boolean)
  )];

  if (clienteIds.length === 0) return facturas;

  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("id, nombre, documento, condicion_fiscal")
    .in("id", clienteIds);

  if (error) {
    if (isMissingClienteSchema(error)) return facturas;
    throw new Error(error.message);
  }

  const clientesPorId = new Map((data || []).map((cliente) => [cliente.id, cliente]));
  return facturas.map((factura) => ({
    ...factura,
    cliente: clientesPorId.get(factura.cliente_id) || null,
  }));
}

async function consultarFacturas({ queryParams, limit, incluirPagos = true }) {
  const select = incluirPagos ? FACTURAS_SELECT : "*";
  let query = supabaseAdmin
    .from("facturas")
    .select(select)
    .order("creado_en", { ascending: false })
    .limit(limit);

  query = aplicarFiltros(query, queryParams);

  if (queryParams.clienteId) query = query.eq("cliente_id", queryParams.clienteId);
  if (queryParams.cliente && !queryParams.clienteId) {
    const ids = await idsClientesPorBusqueda(queryParams.cliente);
    if (ids && ids.length === 0) return [];
    if (ids && ids.length > 0) query = query.in("cliente_id", ids);
  }

  const { data, error } = await query;
  if (!error) return data || [];

  if (incluirPagos && isMissingPagosRelationship(error)) {
    return consultarFacturas({ queryParams, limit, incluirPagos: false });
  }

  if ((queryParams.clienteId || queryParams.cliente) && isMissingClienteSchema(error)) {
    throw new ExportacionFacturasError(
      "El filtro por cliente requiere aplicar el esquema de clientes de facturacion.",
      400,
      { code: error.code, queryDetails: "facturas.select + filtro cliente_id" }
    );
  }

  throw new ExportacionFacturasError(error.message, 500, {
    code: error.code,
    queryDetails: `facturas.select(${select.replace(/\s+/g, " ").trim()})`,
  });
}

export async function obtenerFacturasFiltradas(queryParams = {}, limit = 200) {
  const facturas = await consultarFacturas({ queryParams, limit });
  const facturasConClientes = await hidratarClientes(facturas);
  return facturasConClientes.map(mapFacturaExport);
}

function logExportError(error, req) {
  if (process.env.NODE_ENV === "production") return;

  console.error("[facturas/exportar] Error al generar Excel", {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
    query: error.queryDetails || "facturas export",
    filters: {
      desde: req.query.desde,
      hasta: req.query.hasta,
      cliente: req.query.cliente ? "[presente]" : undefined,
      clienteId: req.query.clienteId ? "[presente]" : undefined,
      estado: req.query.estado,
      tipoComprobante: req.query.tipoComprobante,
      metodoPago: req.query.metodoPago,
    },
  });
}

export const exportarFacturas = async (req, res) => {
  if (rechazarSinPermisoFacturacion(req, res)) return;

  try {
    const facturas = await obtenerFacturasFiltradas(req.query, EXPORT_LIMIT);
    const excel = await generarExcelFacturas({
      facturas,
      filtros: {
        desde: req.query.desde,
        hasta: req.query.hasta,
      },
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${excel.filename}"`);
    return res.send(Buffer.from(excel.buffer));
  } catch (error) {
    logExportError(error, req);

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      mensaje: statusCode === 500
        ? "No se pudo generar la exportacion de facturas"
        : error.message,
      error: statusCode === 500
        ? "No se pudo generar la exportacion de facturas"
        : error.message,
    });
  }
};
```

## Archivo: backend-reservas/src/controllers/cuentasCorrientes.controller.js

```js
import {
  mapMovimientoCuentaCorriente,
  obtenerDetalleCuentaCorriente,
  obtenerResumenCuentasCorrientes,
  registrarAjusteCuentaCorriente,
  registrarPagoCuentaCorriente,
  revertirMovimientoCuentaCorriente,
} from "../services/cuentaCorriente.service.js";
import { generarExcelCuentaCorriente } from "../services/excel.service.js";
import {
  obtenerUsuarioRequest,
  rechazarSinPermisoFacturacion,
} from "../utils/authz.js";

function enviarExcel(res, { buffer, filename }) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(Buffer.from(buffer));
}

export const listarCuentasCorrientes = async (req, res) => {
  if (rechazarSinPermisoFacturacion(req, res)) return;

  try {
    const cuentas = await obtenerResumenCuentasCorrientes();
    return res.json({
      mensaje: "Cuentas corrientes obtenidas correctamente",
      total: cuentas.length,
      cuentas,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener cuentas corrientes",
      error: error.message,
    });
  }
};

export const obtenerCuentaCorriente = async (req, res) => {
  if (rechazarSinPermisoFacturacion(req, res)) return;

  try {
    const detalle = await obtenerDetalleCuentaCorriente(req.params.clienteId);
    return res.json({
      mensaje: "Cuenta corriente obtenida correctamente",
      ...detalle,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener cuenta corriente",
      error: error.message,
    });
  }
};

export const registrarPagoCliente = async (req, res) => {
  if (rechazarSinPermisoFacturacion(req, res)) return;

  try {
    const usuario = obtenerUsuarioRequest(req);
    const pago = await registrarPagoCuentaCorriente({
      clienteId: req.params.clienteId,
      importe: req.body.importe,
      medioPago: req.body.medioPago,
      referencia: req.body.referencia,
      observaciones: req.body.observaciones,
      fechaPago: req.body.fechaPago,
      creadoPor: req.body.creadoPor || usuario.nombre || usuario.rol,
      idempotencyKey: req.body.idempotencyKey,
    });

    const detalle = await obtenerDetalleCuentaCorriente(req.params.clienteId);
    return res.status(201).json({
      mensaje: "Pago registrado correctamente",
      pago,
      ...detalle,
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al registrar pago",
      error: error.message,
    });
  }
};

export const registrarAjusteCliente = async (req, res) => {
  if (rechazarSinPermisoFacturacion(req, res)) return;

  try {
    const usuario = obtenerUsuarioRequest(req);
    const movimiento = await registrarAjusteCuentaCorriente({
      clienteId: req.params.clienteId,
      tipo: req.body.tipo,
      importe: req.body.importe,
      motivo: req.body.motivo,
      creadoPor: req.body.creadoPor || usuario.nombre || usuario.rol,
      idempotencyKey: req.body.idempotencyKey,
    });

    return res.status(201).json({
      mensaje: "Ajuste registrado correctamente",
      movimiento: mapMovimientoCuentaCorriente(movimiento),
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al registrar ajuste",
      error: error.message,
    });
  }
};

export const revertirMovimientoCliente = async (req, res) => {
  if (rechazarSinPermisoFacturacion(req, res)) return;

  try {
    const usuario = obtenerUsuarioRequest(req);
    const movimiento = await revertirMovimientoCuentaCorriente({
      movimientoId: req.params.movimientoId,
      motivo: req.body.motivo,
      creadoPor: req.body.creadoPor || usuario.nombre || usuario.rol,
      idempotencyKey: req.body.idempotencyKey,
    });

    return res.status(201).json({
      mensaje: "Movimiento revertido correctamente",
      movimiento: mapMovimientoCuentaCorriente(movimiento),
    });
  } catch (error) {
    return res.status(400).json({
      mensaje: "Error al revertir movimiento",
      error: error.message,
    });
  }
};

export const exportarCuentaCorriente = async (req, res) => {
  if (rechazarSinPermisoFacturacion(req, res)) return;

  try {
    const detalle = await obtenerDetalleCuentaCorriente(req.params.clienteId);
    const excel = await generarExcelCuentaCorriente(detalle);
    return enviarExcel(res, excel);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al exportar cuenta corriente",
      error: error.message,
    });
  }
};
```

## Archivo: backend-reservas/src/services/arca.service.js

```js
export const solicitarCAE = async (datosFactura) => {
  const numeroComprobanteSimulado = Math.floor(Math.random() * 90000000) + 10000000;

  const caeSimulado = String(Math.floor(Math.random() * 90000000000000) + 10000000000000);

  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 10);

  return {
    exito: true,
    resultado: "A",
    cae: caeSimulado,
    vencimientoCAE: fechaVencimiento.toISOString().slice(0, 10).replaceAll("-", ""),
    numeroComprobante: numeroComprobanteSimulado,
    observaciones: "CAE simulado para ambiente de desarrollo",
    datosEnviados: datosFactura
  };
};
```

## Archivo: backend-reservas/src/services/excel.service.js

```js
import ExcelJS from "exceljs";

const MONEY_FORMAT = '"$"#,##0.00;[Red]-"$"#,##0.00';

export function sanitizarTextoExcel(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function aplicarFormatoBase(worksheet) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length },
  };

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111827" },
  };
  header.alignment = { vertical: "middle" };
}

export async function generarExcelFacturas({ facturas, filtros }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NOCTUA";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Facturas");
  worksheet.columns = [
    { header: "Numero", key: "numero", width: 18 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Fecha emision", key: "fecha", width: 18 },
    { header: "Cliente", key: "cliente", width: 28 },
    { header: "Documento", key: "documento", width: 18 },
    { header: "Condicion fiscal", key: "condicionFiscal", width: 20 },
    { header: "Subtotal", key: "subtotal", width: 14 },
    { header: "Impuestos", key: "impuestos", width: 14 },
    { header: "Descuentos", key: "descuentos", width: 14 },
    { header: "Total", key: "total", width: 14 },
    { header: "Moneda", key: "moneda", width: 10 },
    { header: "Forma de pago", key: "metodoPago", width: 18 },
    { header: "Estado", key: "estado", width: 16 },
    { header: "CAE", key: "cae", width: 18 },
    { header: "Vencimiento CAE", key: "vencimientoCae", width: 18 },
    { header: "Punto de venta", key: "puntoVenta", width: 16 },
    { header: "Fecha de pago", key: "fechaPago", width: 18 },
    { header: "Saldo pendiente", key: "saldoPendiente", width: 18 },
  ];

  for (const factura of facturas) {
    worksheet.addRow({
      numero: sanitizarTextoExcel(factura.numeroComprobante || factura.numero_comprobante),
      tipo: factura.tipoComprobante || factura.tipo_comprobante,
      fecha: asDate(factura.creadoEn || factura.creado_en),
      cliente: sanitizarTextoExcel(factura.cliente?.nombre || factura.clientes?.nombre || ""),
      documento: sanitizarTextoExcel(factura.cliente?.documento || factura.clientes?.documento || ""),
      condicionFiscal: sanitizarTextoExcel(
        factura.cliente?.condicionFiscal || factura.clientes?.condicion_fiscal || ""
      ),
      subtotal: money(factura.subtotal),
      impuestos: money(factura.impuestos),
      descuentos: money(factura.descuento),
      total: money(factura.total),
      moneda: "ARS",
      metodoPago: sanitizarTextoExcel(factura.metodoPago || factura.metodo_pago || ""),
      estado: sanitizarTextoExcel(factura.estado || ""),
      cae: sanitizarTextoExcel(factura.cae || ""),
      vencimientoCae: sanitizarTextoExcel(factura.vencimientoCae || factura.vencimiento_cae || ""),
      puntoVenta: factura.puntoVenta || factura.punto_venta || "",
      fechaPago: asDate(factura.pago?.confirmadoEn || factura.pagos?.confirmado_en),
      saldoPendiente: money(factura.saldoPendiente || factura.saldo_pendiente),
    });
  }

  const totalRow = worksheet.addRow({
    numero: "Totales",
    subtotal: facturas.reduce((acc, factura) => acc + money(factura.subtotal), 0),
    impuestos: facturas.reduce((acc, factura) => acc + money(factura.impuestos), 0),
    descuentos: facturas.reduce((acc, factura) => acc + money(factura.descuento), 0),
    total: facturas.reduce((acc, factura) => acc + money(factura.total), 0),
    saldoPendiente: facturas.reduce(
      (acc, factura) => acc + money(factura.saldoPendiente || factura.saldo_pendiente),
      0
    ),
  });
  totalRow.font = { bold: true };

  aplicarFormatoBase(worksheet);
  for (const key of ["subtotal", "impuestos", "descuentos", "total", "saldoPendiente"]) {
    worksheet.getColumn(key).numFmt = MONEY_FORMAT;
  }
  worksheet.getColumn("fecha").numFmt = "dd/mm/yyyy";
  worksheet.getColumn("fechaPago").numFmt = "dd/mm/yyyy";

  const desde = filtros.desde || "inicio";
  const hasta = filtros.hasta || "hoy";
  const filename = `facturas_${desde}_${hasta}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, filename };
}

export async function generarExcelCuentaCorriente(detalle) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NOCTUA";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Cuenta corriente");
  worksheet.columns = [
    { header: "Fecha", key: "fecha", width: 18 },
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Origen", key: "origen", width: 18 },
    { header: "Descripcion", key: "descripcion", width: 36 },
    { header: "Comprobante", key: "comprobante", width: 20 },
    { header: "Debito", key: "debito", width: 14 },
    { header: "Credito", key: "credito", width: 14 },
    { header: "Saldo acumulado", key: "saldo", width: 18 },
    { header: "Usuario", key: "usuario", width: 20 },
  ];

  let saldo = 0;
  for (const movimiento of detalle.movimientos) {
    const importe = money(movimiento.importe);
    saldo += movimiento.tipo === "DEBIT" ? importe : -importe;
    worksheet.addRow({
      fecha: asDate(movimiento.fecha),
      tipo: movimiento.tipo,
      origen: movimiento.origen,
      descripcion: sanitizarTextoExcel(movimiento.descripcion),
      comprobante: sanitizarTextoExcel(movimiento.facturaId || ""),
      debito: movimiento.tipo === "DEBIT" ? importe : 0,
      credito: movimiento.tipo === "CREDIT" ? importe : 0,
      saldo: money(saldo),
      usuario: sanitizarTextoExcel(movimiento.creadoPor || ""),
    });
  }

  aplicarFormatoBase(worksheet);
  for (const key of ["debito", "credito", "saldo"]) {
    worksheet.getColumn(key).numFmt = MONEY_FORMAT;
  }
  worksheet.getColumn("fecha").numFmt = "dd/mm/yyyy";

  const filename = `cuenta_corriente_${detalle.cliente.id}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, filename };
}
```

## Archivo: backend-reservas/src/services/cuentaCorriente.service.js

```js
import { supabaseAdmin } from "../config/supabaseAdmin.js";

const MONEDA_DEFAULT = "ARS";
const ESTADOS_FACTURA_PENDIENTE = new Set([
  "pendiente",
  "emitida",
  "parcial",
  "parcialmente_pagada",
]);

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function asNullableText(value) {
  const text = String(value || "").trim();
  return text || null;
}

export function mapCliente(cliente) {
  if (!cliente) return null;

  return {
    id: cliente.id,
    nombre: cliente.nombre,
    documento: cliente.documento,
    condicionFiscal: cliente.condicion_fiscal,
    email: cliente.email,
    telefono: cliente.telefono,
    creadoEn: cliente.creado_en,
    actualizadoEn: cliente.actualizado_en,
  };
}

export function mapMovimientoCuentaCorriente(movimiento) {
  if (!movimiento) return null;

  return {
    id: movimiento.id,
    cuentaCorrienteId: movimiento.cuenta_corriente_id,
    clienteId: movimiento.cliente_id,
    tipo: movimiento.tipo,
    origen: movimiento.origen,
    importe: money(movimiento.importe),
    moneda: movimiento.moneda || MONEDA_DEFAULT,
    fecha: movimiento.fecha,
    descripcion: movimiento.descripcion,
    facturaId: movimiento.factura_id,
    pagoCuentaCorrienteId: movimiento.pago_cuenta_corriente_id,
    movimientoRevertidoId: movimiento.movimiento_revertido_id,
    creadoPor: movimiento.creado_por,
    restauranteId: movimiento.restaurante_id,
    idempotencyKey: movimiento.idempotency_key,
    creadoEn: movimiento.creado_en,
  };
}

export function calcularSaldoMovimientos(movimientos = []) {
  return money(
    movimientos.reduce((saldo, movimiento) => {
      const importe = Number(movimiento.importe || 0);
      return movimiento.tipo === "DEBIT" ? saldo + importe : saldo - importe;
    }, 0)
  );
}

function acumularTotales(movimientos = []) {
  return movimientos.reduce(
    (acc, movimiento) => {
      if (movimiento.tipo === "DEBIT") acc.totalDebitado += Number(movimiento.importe || 0);
      if (movimiento.tipo === "CREDIT") acc.totalAcreditado += Number(movimiento.importe || 0);
      return acc;
    },
    { totalDebitado: 0, totalAcreditado: 0 }
  );
}

export async function obtenerClientePorId(clienteId) {
  const { data, error } = await supabaseAdmin
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Cliente no encontrado");
  }

  return data;
}

export async function obtenerOCrearCliente(input = {}) {
  const clienteId = asNullableText(input.clienteId || input.id);
  if (clienteId) return obtenerClientePorId(clienteId);

  const documento = asNullableText(input.documento);
  if (documento) {
    const { data: existente, error: existeError } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .eq("documento", documento)
      .maybeSingle();

    if (existeError) throw new Error(existeError.message);
    if (existente) return existente;
  }

  const nombre = asNullableText(input.nombre);
  if (!nombre) {
    throw new Error("El cliente es obligatorio para cuenta corriente");
  }

  const { data, error } = await supabaseAdmin
    .from("clientes")
    .insert({
      nombre,
      documento,
      condicion_fiscal: asNullableText(input.condicionFiscal),
      email: asNullableText(input.email),
      telefono: asNullableText(input.telefono),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function obtenerOCrearCuentaCorriente(clienteId) {
  const { data: existente, error: existeError } = await supabaseAdmin
    .from("cuentas_corrientes")
    .select("*")
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (existeError) throw new Error(existeError.message);
  if (existente) return existente;

  const { data, error } = await supabaseAdmin
    .from("cuentas_corrientes")
    .insert({ cliente_id: clienteId, estado: "activa" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function buscarMovimientoPorCampo(campo, valor, origen) {
  if (!valor) return null;

  let query = supabaseAdmin
    .from("movimientos_cuenta_corriente")
    .select("*")
    .eq(campo, valor);

  if (origen) query = query.eq("origen", origen);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function buscarMovimientoPorIdempotency(idempotencyKey) {
  return buscarMovimientoPorCampo("idempotency_key", asNullableText(idempotencyKey));
}

export async function crearMovimientoCuentaCorriente({
  clienteId,
  tipo,
  origen,
  importe,
  descripcion,
  fecha,
  facturaId,
  pagoCuentaCorrienteId,
  movimientoRevertidoId,
  creadoPor,
  idempotencyKey,
}) {
  const importeNumero = money(importe);
  if (importeNumero <= 0) throw new Error("El importe debe ser mayor a cero");
  if (!clienteId) throw new Error("El cliente es obligatorio");
  if (!["DEBIT", "CREDIT"].includes(tipo)) throw new Error("Tipo de movimiento invalido");

  if (idempotencyKey) {
    const existente = await buscarMovimientoPorIdempotency(idempotencyKey);
    if (existente) return existente;
  }

  if (origen === "INVOICE" && facturaId) {
    const existente = await buscarMovimientoPorCampo("factura_id", facturaId, "INVOICE");
    if (existente) return existente;
  }

  if (origen === "PAYMENT" && pagoCuentaCorrienteId) {
    const existente = await buscarMovimientoPorCampo(
      "pago_cuenta_corriente_id",
      pagoCuentaCorrienteId,
      "PAYMENT"
    );
    if (existente) return existente;
  }

  const cuenta = await obtenerOCrearCuentaCorriente(clienteId);
  const { data, error } = await supabaseAdmin
    .from("movimientos_cuenta_corriente")
    .insert({
      cuenta_corriente_id: cuenta.id,
      cliente_id: clienteId,
      tipo,
      origen,
      importe: importeNumero,
      moneda: MONEDA_DEFAULT,
      fecha: fecha || new Date().toISOString(),
      descripcion,
      factura_id: facturaId || null,
      pago_cuenta_corriente_id: pagoCuentaCorrienteId || null,
      movimiento_revertido_id: movimientoRevertidoId || null,
      creado_por: asNullableText(creadoPor),
      idempotency_key: asNullableText(idempotencyKey),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function crearDebitoFacturaCuentaCorriente({
  clienteId,
  factura,
  creadoPor,
  idempotencyKey,
}) {
  return crearMovimientoCuentaCorriente({
    clienteId,
    tipo: "DEBIT",
    origen: "INVOICE",
    importe: factura.total,
    descripcion: `Factura ${factura.numero_comprobante || factura.id}`,
    facturaId: factura.id,
    creadoPor,
    idempotencyKey: idempotencyKey || `factura:${factura.id}:debito`,
  });
}

export async function obtenerResumenCuentasCorrientes() {
  const { data: cuentas, error: cuentasError } = await supabaseAdmin
    .from("cuentas_corrientes")
    .select("*, clientes(*)")
    .order("actualizado_en", { ascending: false });

  if (cuentasError) throw new Error(cuentasError.message);

  const clienteIds = (cuentas || []).map((cuenta) => cuenta.cliente_id);
  if (clienteIds.length === 0) return [];

  const [{ data: movimientos, error: movimientosError }, { data: facturas, error: facturasError }] =
    await Promise.all([
      supabaseAdmin
        .from("movimientos_cuenta_corriente")
        .select("*")
        .in("cliente_id", clienteIds)
        .order("fecha", { ascending: true }),
      supabaseAdmin
        .from("facturas")
        .select("id, cliente_id, estado, total, saldo_pendiente, creado_en")
        .in("cliente_id", clienteIds),
    ]);

  if (movimientosError) throw new Error(movimientosError.message);
  if (facturasError) throw new Error(facturasError.message);

  return (cuentas || []).map((cuenta) => {
    const movimientosCliente = (movimientos || []).filter((mov) => mov.cliente_id === cuenta.cliente_id);
    const facturasCliente = (facturas || []).filter((factura) => factura.cliente_id === cuenta.cliente_id);
    const ultimoMovimiento = movimientosCliente[movimientosCliente.length - 1] || null;
    const pendientes = facturasCliente.filter((factura) => {
      const saldoPendiente = Number(factura.saldo_pendiente || 0);
      return saldoPendiente > 0 || ESTADOS_FACTURA_PENDIENTE.has(factura.estado);
    });

    return {
      cuentaCorrienteId: cuenta.id,
      cliente: mapCliente(cuenta.clientes),
      estado: cuenta.estado,
      saldo: calcularSaldoMovimientos(movimientosCliente),
      cantidadFacturasPendientes: pendientes.length,
      deudaVencida: 0,
      ultimoMovimiento: mapMovimientoCuentaCorriente(ultimoMovimiento),
      creadoEn: cuenta.creado_en,
      actualizadoEn: cuenta.actualizado_en,
    };
  });
}

export async function obtenerDetalleCuentaCorriente(clienteId) {
  const cliente = await obtenerClientePorId(clienteId);
  const cuenta = await obtenerOCrearCuentaCorriente(clienteId);

  const [{ data: movimientos, error: movimientosError }, { data: facturas, error: facturasError }] =
    await Promise.all([
      supabaseAdmin
        .from("movimientos_cuenta_corriente")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("fecha", { ascending: true })
        .order("creado_en", { ascending: true }),
      supabaseAdmin
        .from("facturas")
        .select("id, numero_comprobante, tipo_comprobante, estado, total, saldo_pendiente, creado_en")
        .eq("cliente_id", clienteId)
        .order("creado_en", { ascending: false }),
    ]);

  if (movimientosError) throw new Error(movimientosError.message);
  if (facturasError) throw new Error(facturasError.message);

  const totales = acumularTotales(movimientos || []);
  const facturasPendientes = (facturas || []).filter((factura) => {
    const saldoPendiente = Number(factura.saldo_pendiente || 0);
    return saldoPendiente > 0 || ESTADOS_FACTURA_PENDIENTE.has(factura.estado);
  });

  return {
    cuenta: {
      id: cuenta.id,
      estado: cuenta.estado,
      creadoEn: cuenta.creado_en,
      actualizadoEn: cuenta.actualizado_en,
    },
    cliente: mapCliente(cliente),
    saldo: calcularSaldoMovimientos(movimientos || []),
    totalDebitado: money(totales.totalDebitado),
    totalAcreditado: money(totales.totalAcreditado),
    facturasPendientes: facturasPendientes.map((factura) => ({
      id: factura.id,
      numeroComprobante: factura.numero_comprobante,
      tipoComprobante: factura.tipo_comprobante,
      estado: factura.estado,
      total: money(factura.total),
      saldoPendiente: money(factura.saldo_pendiente),
      creadoEn: factura.creado_en,
    })),
    movimientos: (movimientos || []).map(mapMovimientoCuentaCorriente),
  };
}

export async function registrarPagoCuentaCorriente({
  clienteId,
  importe,
  medioPago,
  referencia,
  observaciones,
  fechaPago,
  creadoPor,
  idempotencyKey,
}) {
  const importeNumero = money(importe);
  if (!clienteId) throw new Error("El cliente es obligatorio");
  if (importeNumero <= 0) throw new Error("El importe debe ser mayor a cero");
  if (!asNullableText(medioPago)) throw new Error("El medio de pago es obligatorio");

  if (idempotencyKey) {
    const { data: pagoExistente, error: pagoExistenteError } = await supabaseAdmin
      .from("pagos_cuenta_corriente")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (pagoExistenteError) throw new Error(pagoExistenteError.message);
    if (pagoExistente) return pagoExistente;
  }

  const cuenta = await obtenerOCrearCuentaCorriente(clienteId);
  const { data: pago, error } = await supabaseAdmin
    .from("pagos_cuenta_corriente")
    .insert({
      cliente_id: clienteId,
      cuenta_corriente_id: cuenta.id,
      importe: importeNumero,
      moneda: MONEDA_DEFAULT,
      medio_pago: medioPago,
      referencia: asNullableText(referencia),
      observaciones: asNullableText(observaciones),
      fecha_pago: fechaPago || new Date().toISOString(),
      creado_por: asNullableText(creadoPor),
      idempotency_key: asNullableText(idempotencyKey),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await crearMovimientoCuentaCorriente({
    clienteId,
    tipo: "CREDIT",
    origen: "PAYMENT",
    importe: importeNumero,
    descripcion: observaciones || `Pago cuenta corriente (${medioPago})`,
    fecha: pago.fecha_pago,
    pagoCuentaCorrienteId: pago.id,
    creadoPor,
    idempotencyKey: idempotencyKey ? `${idempotencyKey}:movimiento` : `pago:${pago.id}:credito`,
  });

  return pago;
}

export async function registrarAjusteCuentaCorriente({
  clienteId,
  tipo,
  importe,
  motivo,
  creadoPor,
  idempotencyKey,
}) {
  if (!asNullableText(motivo)) throw new Error("El motivo del ajuste es obligatorio");

  return crearMovimientoCuentaCorriente({
    clienteId,
    tipo,
    origen: "MANUAL_ADJUSTMENT",
    importe,
    descripcion: motivo,
    creadoPor,
    idempotencyKey,
  });
}

export async function revertirMovimientoCuentaCorriente({
  movimientoId,
  motivo,
  creadoPor,
  idempotencyKey,
}) {
  if (!asNullableText(motivo)) throw new Error("El motivo de la reversion es obligatorio");

  const { data: movimiento, error } = await supabaseAdmin
    .from("movimientos_cuenta_corriente")
    .select("*")
    .eq("id", movimientoId)
    .single();

  if (error || !movimiento) throw new Error(error?.message || "Movimiento no encontrado");

  const existente = await buscarMovimientoPorCampo(
    "movimiento_revertido_id",
    movimientoId,
    "REVERSAL"
  );
  if (existente) return existente;

  return crearMovimientoCuentaCorriente({
    clienteId: movimiento.cliente_id,
    tipo: movimiento.tipo === "DEBIT" ? "CREDIT" : "DEBIT",
    origen: "REVERSAL",
    importe: movimiento.importe,
    descripcion: motivo,
    movimientoRevertidoId: movimiento.id,
    creadoPor,
    idempotencyKey: idempotencyKey || `reversion:${movimiento.id}`,
  });
}
```

## Archivo: backend-reservas/src/utils/authz.js

```js
const ROLES_FACTURACION = new Set(["admin", "cajero"]);

export function obtenerUsuarioRequest(req) {
  return {
    rol: String(req.headers["x-noctua-role"] || req.headers["x-user-role"] || "")
      .trim()
      .toLowerCase(),
    nombre: String(req.headers["x-noctua-user"] || req.headers["x-user-name"] || "")
      .trim(),
    id: String(req.headers["x-noctua-user-id"] || req.headers["x-user-id"] || "")
      .trim(),
  };
}

export function tienePermisoFacturacion(req) {
  const usuario = obtenerUsuarioRequest(req);
  return ROLES_FACTURACION.has(usuario.rol);
}

export function rechazarSinPermisoFacturacion(req, res) {
  if (tienePermisoFacturacion(req)) return false;

  res.status(403).json({
    mensaje: "No tenes permisos para acceder al modulo de facturacion",
  });
  return true;
}
```

## Archivo: noctua/services/facturasService.ts

```ts
import { useAuthStore } from '@/store/authStore';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type MetodoPagoFactura =
  | 'efectivo'
  | 'billetera_virtual'
  | 'debito'
  | 'credito'
  | 'cuenta_corriente';

export type TipoComprobante = 1 | 6 | 11;

export type ClienteFactura = {
  id: string;
  nombre: string;
  documento?: string | null;
  condicionFiscal?: string | null;
  email?: string | null;
  telefono?: string | null;
};

export type ClienteFacturaInput = {
  clienteId?: string;
  nombre?: string;
  documento?: string;
  condicionFiscal?: string;
  email?: string;
  telefono?: string;
};

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
  clienteId?: string | null;
  numeroComprobante: string;
  tipoComprobante: number;
  metodoPago: MetodoPagoFactura;
  subtotal: number;
  impuestos: number;
  descuento?: number;
  total: number;
  saldoPendiente?: number;
  estado: string;
  cae?: string | null;
  vencimientoCae?: string | null;
  qrFiscal?: string | null;
  arcaEstado?: string | null;
  arcaError?: string | null;
  creadoEn?: string;
  cliente?: ClienteFactura | null;
};

export type Pago = {
  id: string;
  pedidoId: string;
  mesaId: string;
  clienteId?: string | null;
  metodoPago: MetodoPagoFactura;
  tipoComprobante: number;
  monto: number;
  estado: string;
  temporal?: boolean;
  recibidoPor?: string | null;
  montoRecibido?: number;
  vuelto?: number;
};

export type MovimientoCuentaCorriente = {
  id: string;
  cuentaCorrienteId: string;
  clienteId: string;
  tipo: 'DEBIT' | 'CREDIT';
  origen: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'REVERSAL' | 'MANUAL_ADJUSTMENT';
  importe: number;
  moneda: string;
  fecha: string;
  descripcion: string;
  facturaId?: string | null;
  pagoCuentaCorrienteId?: string | null;
  movimientoRevertidoId?: string | null;
  creadoPor?: string | null;
  creadoEn?: string;
};

export type CuentaCorrienteResumen = {
  cuentaCorrienteId: string;
  cliente: ClienteFactura;
  estado: string;
  saldo: number;
  cantidadFacturasPendientes: number;
  deudaVencida: number;
  ultimoMovimiento?: MovimientoCuentaCorriente | null;
  creadoEn?: string;
  actualizadoEn?: string;
};

export type FacturaPendienteCuenta = {
  id: string;
  numeroComprobante?: string | null;
  tipoComprobante?: number | null;
  estado: string;
  total: number;
  saldoPendiente: number;
  creadoEn?: string;
};

export type CuentaCorrienteDetalle = {
  cuenta: {
    id: string;
    estado: string;
    creadoEn?: string;
    actualizadoEn?: string;
  };
  cliente: ClienteFactura;
  saldo: number;
  totalDebitado: number;
  totalAcreditado: number;
  facturasPendientes: FacturaPendienteCuenta[];
  movimientos: MovimientoCuentaCorriente[];
};

export type FacturasFiltros = {
  desde?: string;
  hasta?: string;
  cliente?: string;
  clienteId?: string;
  estado?: string;
  tipoComprobante?: string;
  metodoPago?: string;
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
  cliente?: ClienteFacturaInput;
  idempotencyKey?: string;
};

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null;
}

function getAuthHeaders() {
  const usuario = useAuthStore.getState().usuario;
  if (!usuario) return {};

  return {
    'X-Noctua-Role': usuario.rol,
    'X-Noctua-User': usuario.nombre,
  };
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
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
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(getMessage(data));
  }

  return data as T;
}

function filenameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
  return match?.[1] ? decodeURIComponent(match[1].replaceAll('"', '')) : fallback;
}

async function download(endpoint: string, fallbackFilename: string) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await readResponse(response);
    throw new Error(getMessage(data));
  }

  const blob = await response.blob();
  return {
    blob,
    filename: filenameFromDisposition(response.headers.get('Content-Disposition'), fallbackFilename),
  };
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
      cliente?: ClienteFactura | null;
      movimiento?: MovimientoCuentaCorriente | null;
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
        cliente: payload.cliente,
        idempotencyKey: payload.idempotencyKey,
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

  async obtenerFacturas(filtros: FacturasFiltros = {}): Promise<Factura[]> {
    const response = await apiFetch<{
      mensaje: string;
      total: number;
      facturas: Factura[];
    }>(`/facturas${buildQuery({ ...filtros, limit: 50 })}`);

    return Array.isArray(response.facturas) ? response.facturas : [];
  },

  async exportarFacturas(filtros: FacturasFiltros = {}) {
    return download(`/facturas/exportar${buildQuery(filtros)}`, 'facturas.xlsx');
  },

  async obtenerCuentasCorrientes(): Promise<CuentaCorrienteResumen[]> {
    const response = await apiFetch<{
      mensaje: string;
      total: number;
      cuentas: CuentaCorrienteResumen[];
    }>('/facturas/cuentas-corrientes');

    return Array.isArray(response.cuentas) ? response.cuentas : [];
  },

  async obtenerCuentaCorriente(clienteId: string): Promise<CuentaCorrienteDetalle> {
    return apiFetch<CuentaCorrienteDetalle & { mensaje: string }>(`/facturas/cuentas-corrientes/${clienteId}`);
  },

  async registrarPagoCuentaCorriente(params: {
    clienteId: string;
    importe: number;
    medioPago: string;
    referencia?: string;
    observaciones?: string;
    fechaPago?: string;
    idempotencyKey: string;
  }): Promise<CuentaCorrienteDetalle> {
    return apiFetch<CuentaCorrienteDetalle & { mensaje: string }>(`/facturas/cuentas-corrientes/${params.clienteId}/pagos`, {
      method: 'POST',
      body: JSON.stringify({
        importe: params.importe,
        medioPago: params.medioPago,
        referencia: params.referencia,
        observaciones: params.observaciones,
        fechaPago: params.fechaPago,
        idempotencyKey: params.idempotencyKey,
      }),
    });
  },

  async registrarAjusteCuentaCorriente(params: {
    clienteId: string;
    tipo: 'DEBIT' | 'CREDIT';
    importe: number;
    motivo: string;
    idempotencyKey: string;
  }) {
    return apiFetch<{ mensaje: string; movimiento: MovimientoCuentaCorriente }>(`/facturas/cuentas-corrientes/${params.clienteId}/ajustes`, {
      method: 'POST',
      body: JSON.stringify({
        tipo: params.tipo,
        importe: params.importe,
        motivo: params.motivo,
        idempotencyKey: params.idempotencyKey,
      }),
    });
  },

  async exportarCuentaCorriente(clienteId: string) {
    return download(`/facturas/cuentas-corrientes/${clienteId}/exportar`, `cuenta_corriente_${clienteId}.xlsx`);
  },
};
```

## Archivo: backend-reservas/sql/facturacion-cuenta-corriente.sql

```sql
-- Cambios manuales para cuenta corriente y exportacion.
-- Revisar en Supabase antes de ejecutar. No modifica CAE ni numeracion existente.

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  documento text,
  condicion_fiscal text,
  email text,
  telefono text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists clientes_documento_unique
  on public.clientes (documento)
  where documento is not null and documento <> '';

alter table public.facturas
  add column if not exists cliente_id uuid references public.clientes(id),
  add column if not exists saldo_pendiente numeric not null default 0;

alter table public.pagos
  add column if not exists cliente_id uuid references public.clientes(id);

-- Si la tabla pagos tiene un CHECK sobre metodo_pago, reemplazarlo para incluir cuenta_corriente.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'pagos'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%metodo_pago%';

  if constraint_name is not null then
    execute format('alter table public.pagos drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.pagos
  add constraint pagos_metodo_pago_check
  check (metodo_pago in ('debito', 'credito', 'billetera_virtual', 'efectivo', 'cuenta_corriente'));

create table if not exists public.cuentas_corrientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null unique references public.clientes(id),
  estado text not null default 'activa' check (estado in ('activa', 'suspendida', 'cerrada')),
  restaurante_id uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.pagos_cuenta_corriente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  cuenta_corriente_id uuid references public.cuentas_corrientes(id),
  importe numeric not null check (importe > 0),
  moneda text not null default 'ARS',
  medio_pago text not null,
  referencia text,
  observaciones text,
  fecha_pago timestamptz not null default now(),
  creado_por text,
  idempotency_key text,
  creado_en timestamptz not null default now()
);

create unique index if not exists pagos_cc_idempotency_unique
  on public.pagos_cuenta_corriente (idempotency_key)
  where idempotency_key is not null and idempotency_key <> '';

create table if not exists public.movimientos_cuenta_corriente (
  id uuid primary key default gen_random_uuid(),
  cuenta_corriente_id uuid not null references public.cuentas_corrientes(id),
  cliente_id uuid not null references public.clientes(id),
  tipo text not null check (tipo in ('DEBIT', 'CREDIT')),
  origen text not null check (origen in ('INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'REVERSAL', 'MANUAL_ADJUSTMENT')),
  importe numeric not null check (importe > 0),
  moneda text not null default 'ARS',
  fecha timestamptz not null default now(),
  descripcion text not null,
  factura_id uuid references public.facturas(id),
  pago_cuenta_corriente_id uuid references public.pagos_cuenta_corriente(id),
  movimiento_revertido_id uuid references public.movimientos_cuenta_corriente(id),
  creado_por text,
  restaurante_id uuid,
  idempotency_key text,
  creado_en timestamptz not null default now()
);

create unique index if not exists movimientos_cc_factura_invoice_unique
  on public.movimientos_cuenta_corriente (factura_id)
  where origen = 'INVOICE' and factura_id is not null;

create unique index if not exists movimientos_cc_pago_payment_unique
  on public.movimientos_cuenta_corriente (pago_cuenta_corriente_id)
  where origen = 'PAYMENT' and pago_cuenta_corriente_id is not null;

create unique index if not exists movimientos_cc_idempotency_unique
  on public.movimientos_cuenta_corriente (idempotency_key)
  where idempotency_key is not null and idempotency_key <> '';

create index if not exists movimientos_cc_cliente_fecha_idx
  on public.movimientos_cuenta_corriente (cliente_id, fecha, creado_en);
```

## 4. Endpoints de facturacion

| Metodo | Endpoint | Funcion | Entrada | Respuesta | Permisos |
|---|---|---|---|---|---|
| GET | `/api/facturas/arca/verificar` | Verifica ARCA simulado | Ninguna | `arca`, tipos comprobante | No visible |
| GET | `/api/facturas/pedidos/listos` | Lista pedidos cobrables | Query no usada | `pedidos[]` | No visible |
| POST | `/api/facturas/pedido/:pedidoId/cobrar` | Cobra y emite factura | `metodoPago`, `tipoComprobante`, datos pago/cliente | `pago`, `factura`, `arca`, `pedido` | Solo valida rol para cuenta corriente |
| POST | `/api/facturas/:pedidoId/cobrar` | Alias de cobro | Igual anterior | Igual anterior | Igual anterior |
| POST | `/api/facturas/pago/:pagoId/confirmar-efectivo` | Confirma pago temporal en efectivo | `recibidoPor`, `montoRecibido`, `vuelto` | `pago`, `factura`, `arca` | No visible |
| GET | `/api/facturas/exportar` | Exporta facturas a Excel | `desde`, `hasta`, `cliente`, `clienteId`, `estado`, `tipoComprobante`, `metodoPago` | XLSX | `admin` o `cajero` |
| GET | `/api/facturas/cuentas-corrientes` | Lista cuentas | Ninguna | `cuentas[]` | `admin` o `cajero` |
| GET | `/api/facturas/cuentas-corrientes/:clienteId` | Detalle de cuenta | `clienteId` | cuenta, cliente, saldos, movimientos | `admin` o `cajero` |
| GET | `/api/facturas/cuentas-corrientes/:clienteId/exportar` | Exporta cuenta a Excel | `clienteId` | XLSX | `admin` o `cajero` |
| POST | `/api/facturas/cuentas-corrientes/:clienteId/pagos` | Registra pago | `importe`, `medioPago`, `referencia`, `observaciones`, `fechaPago`, `idempotencyKey` | detalle actualizado | `admin` o `cajero` |
| POST | `/api/facturas/cuentas-corrientes/:clienteId/ajustes` | Registra ajuste manual | `tipo`, `importe`, `motivo`, `idempotencyKey` | movimiento | `admin` o `cajero` |
| POST | `/api/facturas/cuentas-corrientes/movimientos/:movimientoId/revertir` | Revierte movimiento | `motivo`, `idempotencyKey` | movimiento reverso | `admin` o `cajero` |
| GET | `/api/facturas` | Lista facturas | filtros y `limit` | `facturas[]` | No visible |
| GET | `/api/facturas/:id` | Obtiene factura por id | `id` | `factura` | No visible |

## 5. Exportacion a Excel

- Endpoint facturas: `GET /api/facturas/exportar`.
- Endpoint cuenta corriente: `GET /api/facturas/cuentas-corrientes/:clienteId/exportar`.
- Libreria: `exceljs`.
- Consulta facturas: `facturas` con `pagos(*)`, filtros de fecha/estado/tipo/metodo/cliente, limite 5000.
- Consulta clientes: `clientes` por `cliente_id` para hidratar datos.
- Columnas facturas: Numero, Tipo, Fecha emision, Cliente, Documento, Condicion fiscal, Subtotal, Impuestos, Descuentos, Total, Moneda, Forma de pago, Estado, CAE, Vencimiento CAE, Punto de venta, Fecha de pago, Saldo pendiente.
- Columnas cuenta corriente: Fecha, Tipo, Origen, Descripcion, Comprobante, Debito, Credito, Saldo acumulado, Usuario.
- Headers HTTP:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="...xlsx"`
- Funcion frontend de descarga:
  - `facturasService.download()`
  - `descargarBlob()` en paginas de facturas/cuenta corriente.
- Manejo de errores:
  - Backend devuelve JSON 400 si falta esquema de clientes en filtros.
  - Backend devuelve JSON 500 generico para errores internos de export.
  - Frontend lee texto/JSON y muestra mensaje.
- Filtros: `desde`, `hasta`, `estado`, `tipoComprobante`, `metodoPago`, `cliente`, `clienteId`.
- Posibles causas de error 500:
  - No se aplico `backend-reservas/sql/facturacion-cuenta-corriente.sql`.
  - Faltan columnas `cliente_id` o `saldo_pendiente`.
  - Falta relacion PostgREST entre `facturas` y `pagos`.
  - La tabla `clientes` no existe.
  - Error de permisos por headers de rol ausentes o rol distinto de `admin`/`cajero`.
  - Datos con formulas en celdas: mitigado por `sanitizarTextoExcel`.

## 6. Cuenta corriente

Tablas/modelos:

- `clientes`: cliente, documento, condicion fiscal, email, telefono.
- `cuentas_corrientes`: una cuenta por cliente.
- `pagos_cuenta_corriente`: pagos sobre cuenta.
- `movimientos_cuenta_corriente`: debitos, creditos, reversas, ajustes, notas de credito futuras.
- `facturas`: debe tener `cliente_id` y `saldo_pendiente`.
- `pagos`: debe tener `cliente_id` y permitir metodo `cuenta_corriente`.

Movimientos:

- `DEBIT` aumenta saldo: origen `INVOICE` o ajuste manual.
- `CREDIT` reduce saldo: origen `PAYMENT`, `REVERSAL`, ajuste manual.
- Idempotencia por `idempotency_key`, `factura_id` y `pago_cuenta_corriente_id`.

Relacion con factura y cliente:

- Al cobrar con `metodoPago=cuenta_corriente`, se obtiene o crea cliente, se crea pago pendiente, se emite factura pendiente y se registra movimiento `DEBIT`.
- El saldo se recalcula sumando movimientos.

Rutas:

- Listado, detalle, pagos, ajustes, reversion y exportacion estan bajo `/api/facturas/cuentas-corrientes`.

Componentes:

- No hay componentes dedicados de cuenta corriente fuera de las paginas; usan `facturasService` y `facturasConstants`.

Funciones incompletas o pendientes:

- `CREDIT_NOTE` aparece permitido en SQL/tipos, pero no hay flujo de nota de credito.
- `deudaVencida` se devuelve como `0`, sin calculo real.
- No se confirma actualizacion de `saldo_pendiente` al registrar pagos posteriores; los pagos generan movimientos, pero el saldo de facturas pendientes no se ajusta en el servicio actual.

## 7. Datos faltantes

- No se confirmo el estado real de la base Supabase remota.
- No se confirmo si `facturacion-cuenta-corriente.sql` fue aplicado.
- No se confirmaron politicas RLS reales.
- No se confirmo integracion ARCA productiva; el servicio actual simula CAE.
- No se confirmo si las claves versionadas en scripts de prueba siguen activas.
- No se encontro flujo completo de recibos ni notas de credito.
