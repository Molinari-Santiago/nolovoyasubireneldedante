import { Router } from "express";

import {
  abrirPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  agregarProductoAlPedido,
  cerrarPedido,
  cancelarPedido
} from "../controllers/pedidos.controller.js";

const router = Router();

router.post("/", abrirPedido);
router.get("/", obtenerPedidos);
router.get("/:id", obtenerPedidoPorId);
router.post("/:id/productos", agregarProductoAlPedido);
router.patch("/:id/cerrar", cerrarPedido);
router.patch("/:id/cancelar", cancelarPedido);

export default router;