import express from "express";
import { fileURLToPath } from "node:url";
import rutas from "./routes/index.js";
import { rutaNoEncontrada, manejarErrores } from "./middlewares/errores.middleware.js";

const app = express();
const carpetaPublica = fileURLToPath(new URL("./public", import.meta.url));

app.use(express.json());
app.use(express.static(carpetaPublica)); // CSS y JS del simulador
app.use(rutas);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

export default app;