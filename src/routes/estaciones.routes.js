import { Router } from "express";
import * as controlador from "../controllers/estaciones.controller.js";

const router = Router();

router.get("/estaciones/:id/anclajes", controlador.consultarAnclajes);

export default router;