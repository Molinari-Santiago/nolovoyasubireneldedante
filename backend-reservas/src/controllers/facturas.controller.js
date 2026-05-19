import prisma from "../config/prisma.js";
import { solicitarCAE } from "../services/arca.service.js";

export const generarFacturaDesdePedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;

    const {
      tipoComprobante = "B",
      tipoDocumento = 99,
      numeroDocumento = "0"
    } = req.body;

    const pedido = await prisma.pedido.findUnique({
      where: {
        id: Number(pedidoId)
      },
      include: {
        mesa: true,
        detalles: {
          include: {
            producto: true
          }
        },
        factura: true
      }
    });

    if (!pedido) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado"
      });
    }

    if (pedido.factura) {
      return res.status(400).json({
        mensaje: "Este pedido ya tiene una factura generada"
      });
    }

    if (pedido.detalles.length === 0) {
      return res.status(400).json({
        mensaje: "No se puede facturar un pedido sin productos"
      });
    }

    if (pedido.estado !== "PAGADO" && pedido.estado !== "ENTREGADO") {
      return res.status(400).json({
        mensaje: "Para facturar, el pedido debe estar ENTREGADO o PAGADO"
      });
    }

    const importeTotal = Number(pedido.total);

    const importeNeto = Number((importeTotal / 1.21).toFixed(2));
    const importeIVA = Number((importeTotal - importeNeto).toFixed(2));

    const puntoVenta = Number(process.env.ARCA_PUNTO_VENTA || 1);

    const datosFacturaArca = {
      tipoComprobante,
      puntoVenta,
      concepto: 1,
      tipoDocumento: Number(tipoDocumento),
      numeroDocumento,
      importeNeto,
      importeIVA,
      importeTotal,
      productos: pedido.detalles.map((detalle) => ({
        nombre: detalle.producto.nombre,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal
      }))
    };

    const respuestaArca = await solicitarCAE(datosFacturaArca);

    const nuevaFactura = await prisma.factura.create({
      data: {
        pedidoId: pedido.id,
        tipoComprobante,
        puntoVenta,
        numeroComprobante: respuestaArca.numeroComprobante,
        concepto: 1,
        tipoDocumento: Number(tipoDocumento),
        numeroDocumento,
        importeNeto,
        importeIVA,
        importeTotal,
        cae: respuestaArca.cae,
        vencimientoCAE: respuestaArca.vencimientoCAE,
        resultadoArca: respuestaArca.resultado,
        observaciones: respuestaArca.observaciones,
        estado: respuestaArca.exito ? "AUTORIZADA" : "RECHAZADA"
      },
      include: {
        pedido: {
          include: {
            mesa: true,
            detalles: {
              include: {
                producto: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      mensaje: "Factura generada correctamente",
      factura: nuevaFactura,
      arca: respuestaArca
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al generar la factura",
      error: error.message
    });
  }
};

export const obtenerFacturas = async (req, res) => {
  try {
    const facturas = await prisma.factura.findMany({
      include: {
        pedido: {
          include: {
            mesa: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      mensaje: "Facturas obtenidas correctamente",
      total: facturas.length,
      facturas
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener facturas",
      error: error.message
    });
  }
};

export const obtenerFacturaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const factura = await prisma.factura.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        pedido: {
          include: {
            mesa: true,
            detalles: {
              include: {
                producto: true
              }
            }
          }
        }
      }
    });

    if (!factura) {
      return res.status(404).json({
        mensaje: "Factura no encontrada"
      });
    }

    res.json({
      mensaje: "Factura encontrada",
      factura
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener la factura",
      error: error.message
    });
  }
};