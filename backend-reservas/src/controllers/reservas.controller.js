import prisma from "../config/prisma.js";

export const crearReserva = async (req, res) => {
  try {
    const {
      nombreCliente,
      telefono,
      email,
      cantidadPersonas,
      fechaHoraInicio,
      duracionMinutos,
      mesaId
    } = req.body;

    if (!nombreCliente || !telefono || !cantidadPersonas || !fechaHoraInicio || !mesaId) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios para crear la reserva"
      });
    }

    const inicio = new Date(fechaHoraInicio);
    const duracion = Number(duracionMinutos) || 120;
    const fin = new Date(inicio.getTime() + duracion * 60000);

    if (isNaN(inicio.getTime())) {
      return res.status(400).json({
        mensaje: "La fecha de inicio no es válida"
      });
    }

    const mesa = await prisma.mesa.findUnique({
      where: {
        id: Number(mesaId)
      }
    });

    if (!mesa) {
      return res.status(404).json({
        mensaje: "La mesa seleccionada no existe"
      });
    }

    if (!mesa.disponible) {
      return res.status(400).json({
        mensaje: "La mesa seleccionada no está disponible"
      });
    }

    if (mesa.capacidad < Number(cantidadPersonas)) {
      return res.status(400).json({
        mensaje: "La mesa seleccionada no tiene capacidad suficiente"
      });
    }

    const reservaSuperpuesta = await prisma.reserva.findFirst({
      where: {
        mesaId: Number(mesaId),
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
    });

    if (reservaSuperpuesta) {
      return res.status(400).json({
        mensaje: "La mesa ya tiene una reserva en ese horario"
      });
    }

    const nuevaReserva = await prisma.reserva.create({
      data: {
        nombreCliente,
        telefono,
        email,
        cantidadPersonas: Number(cantidadPersonas),
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        mesaId: Number(mesaId)
      },
      include: {
        mesa: true
      }
    });

    res.status(201).json({
      mensaje: "Reserva creada correctamente",
      reserva: nuevaReserva
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear la reserva",
      error: error.message
    });
  }
};

export const obtenerReservas = async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        mesa: true
      },
      orderBy: {
        fechaHoraInicio: "asc"
      }
    });

    res.json({
      mensaje: "Reservas obtenidas correctamente",
      total: reservas.length,
      reservas
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener las reservas",
      error: error.message
    });
  }
};

export const obtenerReservaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reserva.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        mesa: true
      }
    });

    if (!reserva) {
      return res.status(404).json({
        mensaje: "Reserva no encontrada"
      });
    }

    res.json({
      mensaje: "Reserva encontrada",
      reserva
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener la reserva",
      error: error.message
    });
  }
};

export const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reserva.findUnique({
      where: {
        id: Number(id)
      }
    });

    if (!reserva) {
      return res.status(404).json({
        mensaje: "Reserva no encontrada"
      });
    }

    const reservaCancelada = await prisma.reserva.update({
      where: {
        id: Number(id)
      },
      data: {
        estado: "CANCELADA"
      },
      include: {
        mesa: true
      }
    });

    res.json({
      mensaje: "Reserva cancelada correctamente",
      reserva: reservaCancelada
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al cancelar la reserva",
      error: error.message
    });
  }
};