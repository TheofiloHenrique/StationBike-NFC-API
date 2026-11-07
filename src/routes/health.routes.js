import { Router } from "express";
import { backend } from "../clients/backend.client.js";

const router = Router();

//Comprueba que el servidor responde y que el backend acepta nuestra clave
router.get("/health", async (req, res) => {
  let backendOk = false;
  try {
    await backend("/ping");
    backendOk = true;
  } catch {
    backendOk = false;
  }
  res.json({ servidor: "ok", backend: backendOk });
});

export default router;