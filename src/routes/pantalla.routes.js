import { Router } from "express";
import { fileURLToPath } from "node:url";

const router = Router();
const paginaEstacion = fileURLToPath(new URL("../public/estacion.html", import.meta.url));

// Al abrir la raíz o /estaciones, se abre directamente el tótem físico de Los Muiscas (#92)
router.get("/", (req, res) => {
  res.redirect("/estacion/92");
});

router.get("/estaciones", (req, res) => {
  res.redirect("/estacion/92");
});

// Pantalla / tótem físico individual de cada estación
router.get("/estacion/:id", (req, res) => {
  res.sendFile(paginaEstacion);
});

router.get("/estaciones/:id", (req, res) => {
  res.redirect(`/estacion/${req.params.id}`);
});

export default router;