import { supabaseAdmin } from "../config/supabaseAdmin.js";

function mapProducto(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: Number(producto.precio || 0),
    categoria: producto.categorias || producto.categoria || { id: producto.categoria_id, nombre: "Sin categoría" },
    categoria_id: producto.categoria_id,
    imagen_url: producto.imagen_url,
    disponible: producto.disponible,
    stock: Number(producto.stock_actual ?? producto.stock ?? 0),
    createdAt: producto.created_at,
  };
}

export const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, categoriaId, categoria_id, imagenUrl, imagen_url } =
      req.body;

    if (!nombre || !precio) {
      return res.status(400).json({
        mensaje: "El nombre y el precio son obligatorios",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("productos")
      .insert({
        nombre,
        descripcion: descripcion || null,
        precio: Number(precio),
        categoria_id: categoria_id || categoriaId || categoria || null,
        imagen_url: imagen_url || imagenUrl || null,
        disponible: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.status(201).json({
      mensaje: "Producto creado correctamente",
      producto: mapProducto(data),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al crear el producto",
      error: error.message,
    });
  }
};

export const obtenerProductos = async (req, res) => {
  try {
    const { categoria, disponible } = req.query;
    let query = supabaseAdmin
      .from("productos")
      .select("*, categorias(id, nombre)")
      .order("creado_en", { ascending: false });

    if (categoria) query = query.eq("categoria_id", categoria);
    if (disponible === "true") query = query.eq("disponible", true);
    if (disponible === "false") query = query.eq("disponible", false);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const productos = (data || []).map(mapProducto);

    return res.json({
      mensaje: "Productos obtenidos correctamente",
      total: productos.length,
      productos,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener los productos",
      error: error.message,
    });
  }
};

export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    return res.json({
      mensaje: "Producto encontrado",
      producto: mapProducto(data),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener el producto",
      error: error.message,
    });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, categoriaId, categoria_id, imagenUrl, imagen_url, disponible } =
      req.body;

    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (descripcion !== undefined) cambios.descripcion = descripcion;
    if (precio !== undefined) cambios.precio = Number(precio);
    if (categoria_id !== undefined || categoriaId !== undefined || categoria !== undefined) {
      cambios.categoria_id = categoria_id || categoriaId || categoria;
    }
    if (imagen_url !== undefined || imagenUrl !== undefined) cambios.imagen_url = imagen_url || imagenUrl;
    if (disponible !== undefined) cambios.disponible = disponible;
    if (req.body.stock !== undefined) cambios.stock = Number(req.body.stock);

    const { data, error } = await supabaseAdmin
      .from("productos")
      .update(cambios)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.json({
      mensaje: "Producto actualizado correctamente",
      producto: mapProducto(data),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al actualizar el producto",
      error: error.message,
    });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("productos").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al eliminar el producto",
      error: error.message,
    });
  }
};

export const cambiarDisponibilidadProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: producto, error: getError } = await supabaseAdmin
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();

    if (getError || !producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    const { data, error } = await supabaseAdmin
      .from("productos")
      .update({ disponible: !producto.disponible })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return res.json({
      mensaje: "Disponibilidad del producto actualizada",
      producto: mapProducto(data),
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al cambiar la disponibilidad",
      error: error.message,
    });
  }
};
