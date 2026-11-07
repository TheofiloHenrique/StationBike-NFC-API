import { AppError } from "../utils/AppError.js";

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: "ruta_desconocida" });
}

//Express 5 envía aquí también los errores de funciones async
export function manejarErrores(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.estado).json({ ...err.datos, error: err.codigo });
  }
  console.error(err);
  res.status(500).json({ error: "error_interno" });
}