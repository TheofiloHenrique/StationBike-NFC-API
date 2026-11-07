import { Router } from "express";
import { fileURLToPath } from "node:url";

const router = Router();
const pagina = fileURLToPath(new URL("../public/estacion.html", import.meta.url));

//Una sola página para todas las estaciones: lee el id desde la URL
router.get("/estacion/:id", (req, res) => {
  res.sendFile(pagina);
});

export default router;