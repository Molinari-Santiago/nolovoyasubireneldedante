import prisma from "../config/prisma.js";

export const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, imagenUrl } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({
        mensaje: "El nombre, el precio y la categoría son obligatorios"
      });
    }

    if (Number(precio) <= 0) {
      return res.status(400).json({
        mensaje: "El precio debe ser mayor a 0"
      });
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precio: Number(precio),
        categoria,
        imagenUrl
      }
    });

    res.status(201).json({
      mensaje: "Producto creado correctamente",
      producto: nuevoProducto
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear el producto",
      error: error.message
    });
  }
};

export const obtenerProductos = async (req, res) => {
  try {
    const { categoria, disponible } = req.query;

    const filtros = {};

    if (categoria) {
      filtros.categoria = categoria;
    }

    if (disponible === "true") {
      filtros.disponible = true;
    }

    if (disponible === "false") {
      filtros.disponible = false;
    }

    const productos = await prisma.producto.findMany({
      where: filtros,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      mensaje: "Productos obtenidos correctamente",
      total: productos.length,
      productos
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener los productos",
      error: error.message
    });
  }
};

export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      mensaje: "Producto encontrado",
      producto
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener el producto",
      error: error.message
    });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, imagenUrl, disponible } = req.body;

    const productoExistente = await prisma.producto.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!productoExistente) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    const productoActualizado = await prisma.producto.update({
      where: {
        id: Number(id)
      },
      data: {
        nombre,
        descripcion,
        precio: precio !== undefined ? Number(precio) : undefined,
        categoria,
        imagenUrl,
        disponible
      }
    });

    res.json({
      mensaje: "Producto actualizado correctamente",
      producto: productoActualizado
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar el producto",
      error: error.message
    });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const productoExistente = await prisma.producto.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!productoExistente) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    await prisma.producto.delete({
      where: {
        id: Number(id)
      }
    });

    res.json({
      mensaje: "Producto eliminado correctamente"
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar el producto",
      error: error.message
    });
  }
};

export const cambiarDisponibilidadProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    const productoActualizado = await prisma.producto.update({
      where: {
        id: Number(id)
      },
      data: {
        disponible: !producto.disponible
      }
    });

    res.json({
      mensaje: "Disponibilidad del producto actualizada",
      producto: productoActualizado
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al cambiar la disponibilidad",
      error: error.message
    });
  }
};