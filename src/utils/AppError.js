// Error controlado: lleva estado HTTP, un código y datos extra de la respuesta
export class AppError extends Error {
    constructor(estado, codigo, datos = {}) {
      super(codigo);
      this.estado = estado;
      this.codigo = codigo;
      this.datos = datos;
    }
  }