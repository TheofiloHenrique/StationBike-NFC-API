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

const FORMATO_UID = /^[0-9A-F]{4,32}$/;

//Lectura inválida: el propio terminal responde sin llamar al backend (HU_3, criterio 6)
function validarUid(uid) {
  if (typeof uid !== "string" || !FORMATO_UID.test(uid)) {
    throw new AppError(400, "no_se_pudo_leer_tarjeta", {
      mensaje: "No se pudo leer la tarjeta. Intente de nuevo",
    });
  }
}

//El anclaje es el número (1, 2, 3...) dentro de la estación
function validarAnclaje(anclaje, opcional) {
  if (anclaje == null && opcional) return;
  if (!Number.isInteger(anclaje) || anclaje <= 0) throw new AppError(400, "anclaje_invalido");
}

//Retiro de bicicleta (HU_3): el backend concentra todas las reglas
export async function retirar(req, res) {
  const id = idDe(req);
  const { anclaje, uid } = req.body ?? {};
  validarUid(uid);
  validarAnclaje(anclaje, false);
  res.json(await backend(`/estaciones/${id}/retiros`, { metodo: "POST", cuerpo: { anclaje, uid } }));
}

//Devolución (HU_4): el anclaje es opcional (en una estación llena no hay anclaje libre)
export async function devolver(req, res) {
  const id = idDe(req);
  const { anclaje, uid, bloqueoDetectado } = req.body ?? {};
  validarUid(uid);
  validarAnclaje(anclaje, true);
  res.json(
    await backend(`/estaciones/${id}/devoluciones`, {
      metodo: "POST",
      cuerpo: { ...(anclaje != null && { anclaje }), uid, bloqueoDetectado: bloqueoDetectado === true },
    })
  );
}