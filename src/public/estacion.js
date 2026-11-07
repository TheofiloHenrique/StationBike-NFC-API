// Terminal de estación (simulador). El estado de la página vive en estas variables.
const INTERVALO_MS = 5000; // cada cuánto se actualiza el panel de anclajes
const REPOSO_MS = 4000; // cuánto dura un mensaje antes de volver al reposo
const FORMATO_UID = /^[0-9A-F]{4,32}$/; // mismo formato que acepta TunjaAPI
const MENSAJE_REPOSO = "Acerque su tarjeta";
const MENSAJE_LECTURA_FALLIDA = "No se pudo leer la tarjeta. Intente de nuevo"; // HU_3, criterio 6

// La URL es /estacion/<id>
const estacionId = Number(location.pathname.split("/").filter(Boolean)[1]);

const campoUid = document.getElementById("campoUid");
const mensajeLector = document.getElementById("mensajeLector");
const detalleLector = document.getElementById("detalleLector");
const nombreEstacion = document.getElementById("nombreEstacion");
const estadoEstacion = document.getElementById("estadoEstacion");
const avisoCarga = document.getElementById("avisoCarga");
const listaAnclajes = document.getElementById("listaAnclajes");

let anclajes = [];
let seleccionado = null; // número del anclaje frente al que está el usuario
const encajados = new Set(); // números con "bicicleta encajada" (sensor simulado)
let temporizadorReposo = null;

// Deja el UID como lo entrega la ponte: mayúsculas, sin espacios ni separadores
function normalizarUid(texto) {
  return texto.replace(/[\s:-]/g, "").toUpperCase();
}

function mostrarMensaje(texto, tipo, detalle = "") {
  clearTimeout(temporizadorReposo);
  mensajeLector.textContent = texto;
  mensajeLector.className = `mensaje mensaje--${tipo}`;
  detalleLector.textContent = detalle;
  temporizadorReposo = setTimeout(volverAlReposo, REPOSO_MS);
}

function volverAlReposo() {
  mensajeLector.textContent = MENSAJE_REPOSO;
  mensajeLector.className = "mensaje";
  detalleLector.textContent = "";
}

// Qué haría el toque según el estado físico simulado (temporal, solo para el paso 2)
function accionPrevista() {
  const anclaje = anclajes.find((a) => a.numero === seleccionado);
  if (!anclaje) return "Devolución sin anclaje";
  if (anclaje.estado === "OCUPADO") return `Retiro en el anclaje ${anclaje.numero}`;
  return encajados.has(anclaje.numero)
    ? `Devolución en el anclaje ${anclaje.numero}, bloqueo detectado`
    : `Devolución en el anclaje ${anclaje.numero}, sin bloqueo detectado`;
}

function procesarLectura(texto) {
  const uid = normalizarUid(texto);
  // Si la lectura no es válida, el terminal responde sin llamar al backend
  if (!FORMATO_UID.test(uid)) {
    mostrarMensaje(MENSAJE_LECTURA_FALLIDA, "error");
    return;
  }
  // Paso 2: solo se muestra la lectura. Los retiros y devoluciones se conectan después.
  mostrarMensaje(`UID leído: ${uid}`, "ok", accionPrevista());
}

function crearBoton(texto, alHacerClic, activo = false) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton";
  boton.textContent = texto;
  boton.setAttribute("aria-pressed", String(activo));
  boton.addEventListener("click", () => {
    alHacerClic();
    campoUid.focus(); // el foco vuelve al campo donde escribe la ponte
  });
  return boton;
}

function alternarSeleccion(numero) {
  seleccionado = seleccionado === numero ? null : numero;
  dibujar();
}

function alternarEncaje(numero) {
  if (encajados.has(numero)) {
    encajados.delete(numero);
  } else {
    encajados.add(numero);
    seleccionado = numero;
  }
  dibujar();
}

// Se usa textContent (no innerHTML): los códigos los escribe el administrador
function dibujar() {
  listaAnclajes.replaceChildren();

  for (const anclaje of anclajes) {
    const { numero } = anclaje;
    const libre = anclaje.estado === "LIBRE";

    const item = document.createElement("li");
    item.className = `anclaje ${libre ? "anclaje--libre" : "anclaje--ocupado"}`;
    if (numero === seleccionado) item.classList.add("anclaje--seleccionado");

    const titulo = document.createElement("strong");
    titulo.textContent = `Anclaje ${numero}`;

    const codigo = document.createElement("span");
    codigo.className = "anclaje__codigo";
    codigo.textContent = anclaje.codigo;

    const contenido = document.createElement("span");
    if (libre) {
      contenido.textContent = encajados.has(numero) ? "Libre, bicicleta encajada" : "Libre";
    } else {
      contenido.textContent = `${anclaje.bicicleta?.codigo ?? ""} · ${anclaje.bicicleta?.estado ?? ""}`;
    }

    item.append(
      titulo,
      codigo,
      contenido,
      crearBoton("Acercarse", () => alternarSeleccion(numero), numero === seleccionado)
    );
    if (libre) {
      item.append(
        crearBoton(
          encajados.has(numero) ? "Desencajar bicicleta" : "Encajar bicicleta",
          () => alternarEncaje(numero),
          encajados.has(numero)
        )
      );
    }
    listaAnclajes.append(item);
  }
}

async function cargarAnclajes() {
  try {
    const respuesta = await fetch(`/estaciones/${estacionId}/anclajes`);
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error);

    document.title = datos.estacion.nombre;
    nombreEstacion.textContent = datos.estacion.nombre;
    estadoEstacion.textContent = datos.estacion.estado;
    estadoEstacion.className = datos.estacion.estado === "ACTIVE" ? "estado" : "estado estado--inactiva";

    anclajes = datos.anclajes;
    // El sensor simulado solo aplica a anclajes que siguen libres
    for (const numero of [...encajados]) {
      const anclaje = anclajes.find((a) => a.numero === numero);
      if (!anclaje || anclaje.estado !== "LIBRE") encajados.delete(numero);
    }
    if (!anclajes.some((a) => a.numero === seleccionado)) seleccionado = null;

    avisoCarga.hidden = true;
    dibujar();
  } catch {
    avisoCarga.textContent = "No se pudo cargar la estación";
    avisoCarga.hidden = false;
  }
}

// La ponte escribe el UID y pulsa Enter en la ventana activa
campoUid.addEventListener("keydown", (evento) => {
  if (evento.key !== "Enter") return;
  evento.preventDefault();
  const texto = campoUid.value;
  campoUid.value = "";
  procesarLectura(texto);
});

// Si el foco quedó en un botón o en la página, la primera tecla lo devuelve al campo
document.addEventListener("keydown", (evento) => {
  const imprimible =
    evento.key.length === 1 && evento.key !== " " && !evento.ctrlKey && !evento.metaKey && !evento.altKey;
  if (imprimible && document.activeElement !== campoUid) campoUid.focus();
});

if (!Number.isInteger(estacionId) || estacionId <= 0) {
  avisoCarga.textContent = "Estación no válida";
  avisoCarga.hidden = false;
} else {
  cargarAnclajes();
  setInterval(cargarAnclajes, INTERVALO_MS);
}
campoUid.focus();