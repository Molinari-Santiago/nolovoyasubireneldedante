import { supabaseAdmin } from "../config/supabaseAdmin.js";

function mapProducto(producto) {
  if (!producto) return null;
  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio || 0),
    disponible: producto.disponible,
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
    disponible: mesa.disponible,
    estado: mesa.estado,
  };
}

function mapPedido(pedido) {
  return {
    id: pedido.id,
    mesaId: pedido.mesa_id,
    estado: pedido.estado,
    subtotal: Number(pedido.subtotal || 0),
    impuestos: Number(pedido.impuestos || 0),
    total: Number(pedido.total || 0),
    abiertoEn: pedido.abierto_en,
    createdAt: pedido.created_at,
    mesa: mapMesa(pedido.mesas),
    items: (pedido.pedido_items || []).map(mapItem),
    detalles: (pedido.pedido_items || []).map(mapItem),
  };
}

async function obtenerPedidoCompleto(id) {
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
    .eq("id", id)
    .single();

  if (error || !data) throw new Error(error?.message || "Pedido no encontrado");
  return data;
}

export const abrirPedido = async (req, res) => {
  try {
    const { mesaId } = req.body;

    if (!mesaId) {
      return res.status(400).json({ mensaje: "El ID de la mesa es obligatorio" });
    }

    const { data: pedidoAbierto } = await supabaseAdmin
      .from("pedidos")
      .select("id")
      .eq("mesa_id", mesaId)
      .in("estado", ["pendiente", "preparando", "listo"])
      .maybeSingle();

    if (pedidoAbierto) {
      return res.status(400).json({
        mensaje: "Esta mesa ya tiene un pedido abierto",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .insert({
        mesa_id: mesaId,
        estado: "pendiente",
        subtotal: 0,
        impuestos: 0,
        total: 0,
        abierto_en: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("mesas")
      .update({ disponible: false, estado: "ocupada" })
      .eq("id", mesaId);

    const pedido = await obtenerPedidoCompleto(data.id);

    return res.status(201).json({
      mensaje: "Pedido abierto correctamente",
      pedido: mapPedido(pedido),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al abrir el pedido",
      error: error.message,
    });
  }
};

export const obtenerPedidos = async (req, res) => {
  try {
    const { estado, mesaId } = req.query;
    let query = supabaseAdmin
      .from("pedidos")
      .select(`
        *,
        mesas(*),
        pedido_items(
          *,
          productos(*)
        )
      `)
      .order("created_at", { ascending: false });

    if (estado) query = query.eq("estado", estado);
    if (mesaId) query = query.eq("mesa_id", mesaId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const pedidos = (data || []).map(mapPedido);

    return res.json({
      mensaje: "Pedidos obtenidos correctamente",
      total: pedidos.length,
      pedidos,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener pedidos",
      error: error.message,
    });
  }
};

export const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await obtenerPedidoCompleto(req.params.id);

    return res.json({
      mensaje: "Pedido encontrado",
      pedido: mapPedido(pedido),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener el pedido",
      error: error.message,
    });
  }
};

export const agregarProductoAlPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { productoId, cantidad, notas } = req.body;
    const cantidadSolicitada = Number(cantidad || 0);

    if (!productoId || cantidadSolicitada <= 0) {
      return res.status(400).json({
        mensaje: "El producto y una cantidad mayor a 0 son obligatorios",
      });
    }

    const pedidoRaw = await obtenerPedidoCompleto(id);
    const { data: producto, error: productoError } = await supabaseAdmin
      .from("productos")
      .select("*")
      .eq("id", productoId)
      .single();

    if (productoError || !producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    const precioUnitario = Number(producto.precio || 0);
    const subtotalItem = precioUnitario * cantidadSolicitada;

    const { data: item, error: itemError } = await supabaseAdmin
      .from("pedido_items")
      .insert({
        pedido_id: id,
        producto_id: productoId,
        cantidad: cantidadSolicitada,
        precio_unitario: precioUnitario,
        subtotal: subtotalItem,
        notas: notas || null,
      })
      .select("*, productos(*)")
      .single();

    if (itemError) throw new Error(itemError.message);

    const nuevoSubtotal = Number(pedidoRaw.subtotal || pedidoRaw.total || 0) + subtotalItem;
    const nuevosImpuestos = Number((nuevoSubtotal * 0.21).toFixed(2));
    const nuevoTotal = Number((nuevoSubtotal + nuevosImpuestos).toFixed(2));

    const { error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .update({
        subtotal: nuevoSubtotal,
        impuestos: nuevosImpuestos,
        total: nuevoTotal,
      })
      .eq("id", id);

    if (pedidoError) throw new Error(pedidoError.message);

    const pedidoActualizado = await obtenerPedidoCompleto(id);

    return res.status(201).json({
      mensaje: "Producto agregado al pedido correctamente",
      detalle: mapItem(item),
      pedido: mapPedido(pedidoActualizado),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al agregar producto al pedido",
      error: error.message,
    });
  }
};

export const cerrarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoRaw = await obtenerPedidoCompleto(id);

    const { error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .update({ estado: "entregado" })
      .eq("id", id);

    if (pedidoError) throw new Error(pedidoError.message);

    if (pedidoRaw.mesa_id) {
      await supabaseAdmin
        .from("mesas")
        .update({ disponible: true, estado: "libre" })
        .eq("id", pedidoRaw.mesa_id);
    }

    const pedido = await obtenerPedidoCompleto(id);

    return res.json({
      mensaje: "Pedido cerrado correctamente",
      pedido: mapPedido(pedido),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al cerrar el pedido",
      error: error.message,
    });
  }
};

export const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoRaw = await obtenerPedidoCompleto(id);

    const { error } = await supabaseAdmin
      .from("pedidos")
      .update({ estado: "cancelado" })
      .eq("id", id);

    if (error) throw new Error(error.message);

    if (pedidoRaw.mesa_id) {
      await supabaseAdmin
        .from("mesas")
        .update({ disponible: true, estado: "libre" })
        .eq("id", pedidoRaw.mesa_id);
    }

    const pedido = await obtenerPedidoCompleto(id);

    return res.json({
      mensaje: "Pedido cancelado correctamente",
      pedido: mapPedido(pedido),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al cancelar el pedido",
      error: error.message,
    });
  }
};
export const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const ESTADOS_VALIDOS = ["pendiente", "preparando", "listo", "entregado", "cancelado"];
    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
      });
    }

    const { error } = await supabaseAdmin
      .from("pedidos")
      .update({ estado })
      .eq("id", id);

    if (error) throw new Error(error.message);

    const pedido = await obtenerPedidoCompleto(id);

    return res.json({
      mensaje: "Estado actualizado correctamente",
      pedido: mapPedido(pedido),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al actualizar estado del pedido",
      error: error.message,
    });
  }
};

export const eliminarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminamos los items del pedido (FK constraint)
    const { error: itemsError } = await supabaseAdmin
      .from("pedido_items")
      .delete()
      .eq("pedido_id", id);

    if (itemsError) throw new Error(itemsError.message);

    // Luego eliminamos el pedido
    const { error } = await supabaseAdmin
      .from("pedidos")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return res.json({ mensaje: "Pedido eliminado correctamente" });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al eliminar el pedido",
      error: error.message,
    });
  }
};
