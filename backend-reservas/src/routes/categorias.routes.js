import { Router } from "express";
import {
  obtenerCategorias,
  crearCategoria,
} from "../controllers/categorias.controller.js";

const router = Router();

router.get("/", obtenerCategorias);
router.post("/", crearCategoria);

export default router;
