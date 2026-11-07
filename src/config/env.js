function requerida(nombre) {
    const valor = process.env[nombre];
    if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
    return valor;
  }
  
  export const env = {
    puerto: Number(process.env.PORT ?? 4100),
    urlBackend: process.env.BACKEND_URL ?? "http://localhost:4000",
    claveInterna: requerida("CLAVE_INTERNA"),
  };