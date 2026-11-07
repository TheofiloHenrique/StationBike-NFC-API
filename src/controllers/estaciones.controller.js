import { backend } from "../clients/backend.client.js";
import { AppError } from "../utils/AppError.js";

//El id de la URL debe ser un entero positivo
function idDe(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(404, "estacion_no_encontrada");
  return id;
}

//Pasa al backend la consulta de anclajes de la estación
export async function consultarAnclajes(req, res) {
  res.json(await backend(`/estaciones/${idDe(req)}/anclajes`));
}