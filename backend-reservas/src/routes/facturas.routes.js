import { Router } from "express";

import {
  verificarARCAController,
  obtenerPedidosListosParaCobrar,
  cobrarPedido,
  confirmarPagoEfectivo,
  obtenerFacturas,
  obtenerFacturaPorId,
} from "../controllers/facturas.controller.js";

const router = Router();

router.get("/arca/verificar", verificarARCAController);
router.get("/pedidos/listos", obtenerPedidosListosParaCobrar);

router.post("/pedido/:pedidoId/cobrar", cobrarPedido);
router.post("/:pedidoId/cobrar", cobrarPedido);

router.post("/pago/:pagoId/confirmar-efectivo", confirmarPagoEfectivo);

router.get("/", obtenerFacturas);
router.get("/:id", obtenerFacturaPorId);

export default router;
