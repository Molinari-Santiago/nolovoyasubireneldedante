import { Router } from "express";

import {
  verificarARCAController,
  obtenerPedidosListosParaCobrar,
  cobrarPedido,
  confirmarPagoEfectivo,
  obtenerFacturas,
  obtenerFacturaPorId,
} from "../controllers/facturas.controller.js";
import {
  exportarCuentaCorriente,
  listarCuentasCorrientes,
  obtenerCuentaCorriente,
  registrarAjusteCliente,
  registrarPagoCliente,
  revertirMovimientoCliente,
} from "../controllers/cuentasCorrientes.controller.js";
import { exportarFacturas } from "../controllers/facturasExport.controller.js";

const router = Router();

router.get("/arca/verificar", verificarARCAController);
router.get("/pedidos/listos", obtenerPedidosListosParaCobrar);

router.post("/pedido/:pedidoId/cobrar", cobrarPedido);
router.post("/:pedidoId/cobrar", cobrarPedido);

router.post("/pago/:pagoId/confirmar-efectivo", confirmarPagoEfectivo);

router.get("/exportar", exportarFacturas);
router.get("/cuentas-corrientes", listarCuentasCorrientes);
router.get("/cuentas-corrientes/:clienteId/exportar", exportarCuentaCorriente);
router.get("/cuentas-corrientes/:clienteId", obtenerCuentaCorriente);
router.post("/cuentas-corrientes/:clienteId/pagos", registrarPagoCliente);
router.post("/cuentas-corrientes/:clienteId/ajustes", registrarAjusteCliente);
router.post("/cuentas-corrientes/movimientos/:movimientoId/revertir", revertirMovimientoCliente);

router.get("/", obtenerFacturas);
router.get("/:id", obtenerFacturaPorId);

export default router;
