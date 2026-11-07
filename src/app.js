import express from "express";
import rutas from "./routes/index.js";
import { rutaNoEncontrada, manejarErrores } from "./middlewares/errores.middleware.js";

const app = express();

app.use(express.json());
app.use(rutas);

app.use(rutaNoEncontrada);
app.use(manejarErrores);

export default app;