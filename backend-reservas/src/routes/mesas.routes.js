import { Router } from "express";
import {
  crearMesa,
  obtenerMesas,
  obtenerMesasDisponibles,
  obtenerEstadoMesas
} from "../controllers/mesas.controller.js";

const router = Router();

router.post("/", crearMesa);
router.get("/", obtenerMesas);
router.get("/disponibles", obtenerMesasDisponibles);
router.get("/estado", obtenerEstadoMesas);
router.delete("/:id", eliminarMesa);

export default router;