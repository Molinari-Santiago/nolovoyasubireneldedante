import prisma from "../config/prisma.js";

export const abrirPedido = async (req, res) => {
  try {
    const { mesaId } = req.body;

    if (!mesaId) {
      return res.status(400).json({
        mensaje: "El ID de la mesa es obligatorio"
      });
    }

    const mesa = await prisma.mesa.findUnique({
      where: {
        id: Number(mesaId)
      },
      include: {
        reservas: true,
        pedidos: true
      }
    });

    if (!mesa) {
      return res.status(404).json({
        mensaje: "La mesa no existe"
      });
    }

    if (!mesa.disponible) {
      return res.status(400).json({
        mensaje: "La mesa no está disponible"
      });
    }

    const pedidoAbierto = await prisma.pedido.findFirst({
      where: {
        mesaId: Number(mesaId),
        estado: "ABIERTO"
      }
    });

    if (pedidoAbierto) {
      return res.status(400).json({
        mensaje: "Esta mesa ya tiene un pedido abierto"
      });
    }

    const nuevoPedido = await prisma.pedido.create({
      data: {
        mesaId: Number(mesaId),
        estado: "ABIERTO",
        total: 0
      },
      include: {
        mesa: true,
        detalles: true
      }
    });

    await prisma.mesa.update({
      where: {
        id: Number(mesaId)
      },
      data: {
        disponible: false
      }
    });

    res.status(201).json({
      mensaje: "Pedido abierto correctamente",
      pedido: nuevoPedido
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al abrir el pedido",
      error: error.message
    });
  }
};

export const obtenerPedidos = async (req, res) => {
  try {
    const { estado, mesaId } = req.query;

    const filtros = {};

    if (estado) {
      filtros.estado = estado;
    }

    if (mesaId) {
      filtros.mesaId = Number(mesaId);
    }

    const pedidos = await prisma.pedido.findMany({
      where: filtros,
      include: {
        mesa: true,
        detalles: {
          include: {
            producto: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      mensaje: "Pedidos obtenidos correctamente",
      total: pedidos.length,
      pedidos
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener pedidos",
      error: error.message
    });
  }
};

export const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await prisma.pedido.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        mesa: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado"
      });
    }

    res.json({
      mensaje: "Pedido encontrado",
      pedido
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener el pedido",
      error: error.message
    });
  }
};

export const agregarProductoAlPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { productoId, cantidad } = req.body;

    if (!productoId || !cantidad) {
      return res.status(400).json({
        mensaje: "El producto y la cantidad son obligatorios"
      });
    }

    const cantidadSolicitada = Number(cantidad);

    if (cantidadSolicitada <= 0) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser mayor a 0"
      });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: {
          id: Number(id)
        }
      });

      if (!pedido) {
        throw new Error("El pedido no existe");
      }

      if (pedido.estado !== "ABIERTO") {
        throw new Error("Solo se pueden agregar productos a pedidos abiertos");
      }

      const producto = await tx.producto.findUnique({
        where: {
          id: Number(productoId)
        }
      });

      if (!producto) {
        throw new Error("El producto no existe");
      }

      if (!producto.disponible) {
        throw new Error("El producto no está disponible");
      }

      const stockActual = Number(producto.stock ?? 0);

      if (stockActual < cantidadSolicitada) {
        throw new Error(
          `Stock insuficiente para ${producto.nombre}. Stock actual: ${stockActual}`
        );
      }

      const precioUnitario = producto.precio;
      const subtotal = precioUnitario * cantidadSolicitada;

      const detalle = await tx.detallePedido.create({
        data: {
          pedidoId: Number(id),
          productoId: Number(productoId),
          cantidad: cantidadSolicitada,
          precioUnitario,
          subtotal
        },
        include: {
          producto: true
        }
      });

      const nuevoStock = stockActual - cantidadSolicitada;

      await tx.producto.update({
        where: {
          id: Number(productoId)
        },
        data: {
          stock: nuevoStock,
          disponible: nuevoStock > 0
        }
      });

      const nuevoTotal = pedido.total + subtotal;

      const pedidoActualizado = await tx.pedido.update({
        where: {
          id: Number(id)
        },
        data: {
          total: nuevoTotal
        },
        include: {
          mesa: true,
          detalles: {
            include: {
              producto: true
            }
          }
        }
      });

      await tx.mesa.update({
        where: {
          id: pedido.mesaId
        },
        data: {
          disponible: false
        }
      });

      return {
        detalle,
        pedido: pedidoActualizado,
        stockRestante: nuevoStock
      };
    });

    res.status(201).json({
      mensaje: "Producto agregado al pedido y stock actualizado correctamente",
      detalle: resultado.detalle,
      pedido: resultado.pedido,
      stockRestante: resultado.stockRestante
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al agregar producto al pedido",
      error: error.message
    });
  }
};

export const cerrarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: {
          id: Number(id)
        },
        include: {
          detalles: true
        }
      });

      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      if (pedido.estado !== "ABIERTO") {
        throw new Error("Solo se pueden cerrar pedidos abiertos");
      }

      if (pedido.detalles.length === 0) {
        throw new Error("No se puede cerrar un pedido sin productos");
      }

      const pedidoCerrado = await tx.pedido.update({
        where: {
          id: Number(id)
        },
        data: {
          estado: "PAGADO"
        },
        include: {
          mesa: true,
          detalles: {
            include: {
              producto: true
            }
          }
        }
      });

      await tx.mesa.update({
        where: {
          id: pedido.mesaId
        },
        data: {
          disponible: true
        }
      });

      return pedidoCerrado;
    });

    res.json({
      mensaje: "Pedido cerrado y pagado correctamente",
      pedido: resultado
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al cerrar el pedido",
      error: error.message
    });
  }
};

export const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: {
          id: Number(id)
        },
        include: {
          detalles: true
        }
      });

      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      if (pedido.estado !== "ABIERTO") {
        throw new Error("Solo se pueden cancelar pedidos abiertos");
      }

      for (const detalle of pedido.detalles) {
        await tx.producto.update({
          where: {
            id: detalle.productoId
          },
          data: {
            stock: {
              increment: detalle.cantidad
            },
            disponible: true
          }
        });
      }

      const pedidoCancelado = await tx.pedido.update({
        where: {
          id: Number(id)
        },
        data: {
          estado: "CANCELADO"
        },
        include: {
          mesa: true,
          detalles: {
            include: {
              producto: true
            }
          }
        }
      });

      await tx.mesa.update({
        where: {
          id: pedido.mesaId
        },
        data: {
          disponible: true
        }
      });

      return pedidoCancelado;
    });

    res.json({
      mensaje: "Pedido cancelado correctamente y stock restaurado",
      pedido: resultado
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al cancelar el pedido",
      error: error.message
    });
  }
};