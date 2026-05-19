import { Router } from "express";

import {
  generarFacturaDesdePedido,
  obtenerFacturas,
  obtenerFacturaPorId
} from "../controllers/facturas.controller.js";

const router = Router();

router.post("/pedido/:pedidoId", generarFacturaDesdePedido);
router.get("/", obtenerFacturas);
router.get("/:id", obtenerFacturaPorId);

export default router;