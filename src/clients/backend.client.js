import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

//Llama a las rutas /api/interno del backend principal con la clave interna
export async function backend(camino, { metodo = "GET", cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${env.urlBackend}/api/interno${camino}`, {
      method: metodo,
      signal: AbortSignal.timeout(8000),
      headers: {
        ...(cuerpo && { "Content-Type": "application/json" }),
        "X-Clave-Interna": env.claveInterna,
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new AppError(502, "backend_no_responde");
  }

  const datos = await respuesta.json().catch(() => null);

  // Los errores del backend ya traen { error, mensaje }: se pasan tal cual al terminal
  if (!respuesta.ok) {
    throw new AppError(respuesta.status, datos?.error ?? "error_desconocido", datos ?? {});
  }
  return datos;
}