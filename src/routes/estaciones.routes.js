import { Router } from "express";
import * as controlador from "../controllers/estaciones.controller.js";

const router = Router();

router.get("/estaciones/:id/anclajes", controlador.consultarAnclajes);
router.post("/estaciones/:id/retiros", controlador.retirar);
router.post("/estaciones/:id/devoluciones", controlador.devolver);

export default router;