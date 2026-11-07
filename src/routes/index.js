import { Router } from "express";
import health from "./health.routes.js";

const router = Router();

router.use(health);
//Aquí se montarán las rutas de las estaciones (retiros, devoluciones, anclajes)

export default router;