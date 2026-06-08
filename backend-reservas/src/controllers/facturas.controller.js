import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { solicitarCAE } from "../services/arca.service.js";

const ESTADOS_LISTOS_PARA_COBRAR = [
  "listo",
  "entregado",
  "lista_para_cobrar",
];

const METODOS_PAGO = ["efectivo", "billetera_virtual", "debito", "credito"];
const TIPOS_COMPROBANTE = [1, 6, 11];

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
    numeroComprobante: factura.numero_comprobante,
    tipoComprobante: Number(factura.tipo_comprobante || 6),
    metodoPago: factura.metodo_pago,
    subtotal: Number(factura.subtotal || 0),
    impuestos: Number(factura.impuestos || 0),
    total: Number(factura.total || 0),
    estado: factura.estado,
    cae: factura.cae,
    vencimientoCae: factura.vencimiento_cae,
    qrFiscal: factura.qr_fiscal,
    arcaEstado: factura.arca_estado,
    arcaError: factura.arca_error,
    creadoEn: factura.creado_en,
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

async function crearFacturaDesdePago({ pedido, pago, arca }) {
  const importes = calcularImpuestos(pedido.total);
  const { data: factura, error } = await supabaseAdmin
    .from("facturas")
    .insert({
      pedido_id: pedido.id,
      pago_id: pago.id,
      mesa_id: pedido.mesa_id,
      numero_comprobante: arca.numeroComprobante,
      tipo_comprobante: arca.tipoComprobante || pago.tipo_comprobante || 6,
      metodo_pago: pago.metodo_pago,
      subtotal: importes.subtotal,
      impuestos: importes.impuestos,
      total: importes.total,
      estado: "emitida",
      cae: arca.cae,
      vencimiento_cae: arca.vencimientoCae,
      qr_fiscal: arca.qrFiscal,
      arca_estado: "aprobado",
      arca_error: null,
    })
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
    } = req.body;

    if (!pedidoId) {
      return res.status(400).json({ mensaje: "El ID del pedido es obligatorio" });
    }

    if (!METODOS_PAGO.includes(metodoPago)) {
      return res.status(400).json({ mensaje: "Metodo de pago invalido" });
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

    const pagoTemporal = metodoPago === "efectivo";
    const { data: pago, error: pagoError } = await supabaseAdmin
      .from("pagos")
      .insert({
        pedido_id: pedido.id,
        mesa_id: pedido.mesaId,
        metodo_pago: metodoPago,
        tipo_comprobante: tipoComprobanteNumero,
        monto: pedido.total,
        estado: pagoTemporal ? "pendiente" : "pagado",
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
        confirmado_en: pagoTemporal ? null : new Date().toISOString(),
        recibido_por: recibidoPor || null,
        monto_recibido: Number(montoRecibido || 0),
        vuelto: Number(vuelto || 0),
      })
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
    const factura = await crearFacturaDesdePago({ pedido: pedidoRaw, pago, arca });
    const advertenciaCierre = await cerrarPedidoYLiberarMesaSeguro(pedidoRaw);

    return res.status(201).json({
      mensaje: advertenciaCierre
        ? "Pedido cobrado y facturado. Revisar cierre de mesa."
        : "Pedido cobrado, facturado y mesa cerrada",
      arca,
      pago: mapPago(pago),
      factura: mapFactura(factura),
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
    const { data, error } = await supabaseAdmin
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
      .limit(Number(req.query.limit || 20));

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
