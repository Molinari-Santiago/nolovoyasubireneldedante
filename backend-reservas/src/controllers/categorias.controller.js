import { supabaseAdmin } from "../config/supabaseAdmin.js";

export const obtenerCategorias = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categorias")
      .select("id, nombre, color")
      .order("nombre");

    if (error) throw new Error(error.message);

    return res.json({
      mensaje: "Categorías obtenidas correctamente",
      total: data.length,
      categorias: data,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener las categorías",
      error: error.message,
    });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const { nombre, color } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: "El nombre es obligatorio",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("categorias")
      .insert([{ nombre, color: color || 'bg-[#1a1a1a]' }])
      .select("id, nombre, color")
      .single();

    if (error) throw new Error(error.message);

    return res.status(201).json({
      mensaje: "Categoría creada correctamente",
      categoria: data,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al crear la categoría",
      error: error.message,
    });
  }
};
