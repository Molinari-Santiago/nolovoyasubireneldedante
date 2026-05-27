import prisma from "../config/prisma.js";

export const crearMesa = async (req, res) => {
  try {
    const { numero, capacidad, ubicacion } = req.body;

    if (!numero || !capacidad) {
      return res.status(400).json({
        mensaje: "El número y la capacidad de la mesa son obligatorios"
      });
    }

    if (capacidad <= 0) {
      return res.status(400).json({
        mensaje: "La capacidad debe ser mayor a 0"
      });
    }

    const mesaExistente = await prisma.mesa.findUnique({
      where: {
        numero: Number(numero)
      }
    });

    if (mesaExistente) {
      return res.status(400).json({
        mensaje: "Ya existe una mesa con ese número"
      });
    }

    const nuevaMesa = await prisma.mesa.create({
      data: {
        numero: Number(numero),
        capacidad: Number(capacidad),
        ubicacion
      }
    });

    res.status(201).json({
      mensaje: "Mesa creada correctamente",
      mesa: nuevaMesa
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear la mesa",
      error: error.message
    });
  }
};

export const eliminarMesa = async (req, res) => {
  try {
    const { id } = req.params;

    const mesaId = Number(id);

    if (isNaN(mesaId)) {
      return res.status(400).json({
        mensaje: "El id de la mesa no es válido",
      });
    }

    const mesa = await prisma.mesa.findUnique({
      where: {
        id: mesaId,
      },
      include: {
        pedidos: true,
        reservas: true,
      },
    });

    if (!mesa) {
      return res.status(404).json({
        mensaje: "La mesa no existe",
      });
    }

    if (mesa.pedidos.length > 0 || mesa.reservas.length > 0) {
      return res.status(400).json({
        mensaje:
          "No se puede eliminar la mesa porque tiene pedidos o reservas asociadas",
      });
    }

    await prisma.mesa.delete({
      where: {
        id: mesaId,
      },
    });

    res.json({
      mensaje: "Mesa eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando mesa:", error);

    res.status(500).json({
      mensaje: "Error al eliminar la mesa",
      error: error.message,
    });
  }
};

export const obtenerMesas = async (req, res) => {
  try {
    const { personas } = req.query;

    const filtros = {};

    if (personas) {
      filtros.capacidad = {
        gte: Number(personas)
      };
    }

    const mesas = await prisma.mesa.findMany({
      where: filtros,
      orderBy: {
        numero: "asc"
      }
    });

    res.json({
      mensaje: "Mesas obtenidas correctamente",
      total: mesas.length,
      mesas
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener las mesas",
      error: error.message
    });
  }
};

export const obtenerMesasDisponibles = async (req, res) => {
  try {
    const { personas, fechaHoraInicio, duracionMinutos } = req.query;

    if (!personas || !fechaHoraInicio) {
      return res.status(400).json({
        mensaje: "Debes enviar personas y fechaHoraInicio"
      });
    }

    const inicio = new Date(fechaHoraInicio);
    const duracion = Number(duracionMinutos) || 120;
    const fin = new Date(inicio.getTime() + duracion * 60000);

    if (isNaN(inicio.getTime())) {
      return res.status(400).json({
        mensaje: "La fecha enviada no es válida"
      });
    }

    const mesas = await prisma.mesa.findMany({
      where: {
        disponible: true,
        capacidad: {
          gte: Number(personas)
        },
        reservas: {
          none: {
            estado: {
              in: ["PENDIENTE", "CONFIRMADA"]
            },
            AND: [
              {
                fechaHoraInicio: {
                  lt: fin
                }
              },
              {
                fechaHoraFin: {
                  gt: inicio
                }
              }
            ]
          }
        }
      },
      orderBy: {
        capacidad: "asc"
      }
    });

    res.json({
      mensaje: "Mesas disponibles encontradas",
      personas: Number(personas),
      fechaHoraInicio: inicio,
      fechaHoraFin: fin,
      total: mesas.length,
      mesas
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al buscar mesas disponibles",
      error: error.message
    });
  }
};

export const obtenerEstadoMesas = async (req, res) => {
  try {
    const ahora = new Date();

    const mesas = await prisma.mesa.findMany({
      include: {
        pedidos: {
          where: {
            estado: "ABIERTO"
          }
        },
      reservas: {
  where: {
    estado: {
      in: ["PENDIENTE", "CONFIRMADA"]
    },
    fechaHoraInicio: {
      lte: ahora
    },
    fechaHoraFin: {
      gt: ahora
    }
  },
  orderBy: {
    fechaHoraInicio: "asc"
  }
}
      },
      orderBy: {
        numero: "asc"
      }
    });

    const mesasConEstado = mesas.map((mesa) => {
      let estadoActual = "LIBRE";

      if (!mesa.disponible) {
        estadoActual = "FUERA_DE_SERVICIO";
      } else if (mesa.pedidos.length > 0) {
        estadoActual = "OCUPADA";
      } else if (mesa.reservas.length > 0) {
        estadoActual = "RESERVADA";
      }

      return {
        id: mesa.id,
        numero: mesa.numero,
        capacidad: mesa.capacidad,
        ubicacion: mesa.ubicacion,
        disponible: mesa.disponible,
        estadoActual,
        pedidoAbierto: mesa.pedidos[0] || null,
        proximaReserva: mesa.reservas[0] || null
      };
    });

    res.json({
      mensaje: "Estado de mesas obtenido correctamente",
      total: mesasConEstado.length,
      mesas: mesasConEstado
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener estado de mesas",
      error: error.message
    });
  }
};