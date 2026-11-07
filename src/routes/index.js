import { Router } from "express";
import health from "./health.routes.js";
import estaciones from "./estaciones.routes.js";
import pantalla from "./pantalla.routes.js";

const router = Router();

router.use(health);
router.use(estaciones);
router.use(pantalla);
// Aquí se montarán los retiros y las devoluciones

export default router;