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

function mostrarMensaje(texto, tipo, detalle = "", duracion = REPOSO_MS) {
  clearTimeout(temporizadorReposo);
  mensajeLector.textContent = texto;
  mensajeLector.className = `mensaje mensaje--${tipo}`;
  detalleLector.textContent = detalle;
  temporizadorReposo = setTimeout(volverAlReposo, duracion);
}

function volverAlReposo() {
  mensajeLector.textContent = MENSAJE_REPOSO;
  mensajeLector.className = "mensaje";
  detalleLector.textContent = "";
}

let procesando = false; // evita enviar dos lecturas a la vez
const pesos = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

async function enviar(ruta, cuerpo) {
  const respuesta = await fetch(`/estaciones/${estacionId}/${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, datos };
}

// Los textos vienen del backend (exactos de las HU). Si un código no tiene texto, se muestra el código
function mostrarError(datos) {
  mostrarMensaje(datos.mensaje ?? "Operación no completada", "error", datos.mensaje ? "" : (datos.error ?? ""));
}

async function retirar(uid, anclaje) {
  const { ok, datos } = await enviar("retiros", { anclaje: anclaje.numero, uid });
  if (!ok) return mostrarError(datos);
  mostrarMensaje(datos.mensaje, "ok", `Minutos incluidos en su plan: ${datos.minutosIncluidos}`, 8000);
}

async function devolver(uid, anclaje) {
  const cuerpo = anclaje
    ? { anclaje: anclaje.numero, uid, bloqueoDetectado: encajados.has(anclaje.numero) }
    : { uid, bloqueoDetectado: false };
  const { ok, datos } = await enviar("devoluciones", cuerpo);
  if (!ok) return mostrarError(datos);
  const r = datos.resumen;
  const resumen =
    `${r.origen} → ${r.destino} · ${r.duracionMin} min · exceso ${r.minutosExceso} min · ` +
    `cobrado $${pesos.format(r.valorCobrado)}`;
  mostrarMensaje(datos.mensaje, "ok", datos.aviso ? `${resumen}. ${datos.aviso}` : resumen, 10000);
}

// La acción la decide el estado del anclaje: ocupado = retiro, libre o ninguno = devolución
async function procesarLectura(texto) {
  const uid = normalizarUid(texto);
  if (!FORMATO_UID.test(uid)) {
    mostrarMensaje(MENSAJE_LECTURA_FALLIDA, "error");
    return;
  }
  if (procesando) return;
  procesando = true;
  try {
    const anclaje = anclajes.find((a) => a.numero === seleccionado);
    if (anclaje?.estado === "OCUPADO") await retirar(uid, anclaje);
    else await devolver(uid, anclaje);
  } catch {
    mostrarMensaje("No se pudo comunicar con el sistema", "error");
  } finally {
    procesando = false;
    cargarAnclajes(); // el panel refleja el nuevo estado sin esperar los 5 s
  }
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

// Generadores de gráficos vectoriales para los anclajes
function crearSvgBicicleta() {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(`
    <svg class="dibujo-bicicleta" viewBox="0 0 72 44" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bicicleta disponible">
      <!-- Rueda trasera -->
      <circle cx="16" cy="28" r="12" stroke="#5fd34a" stroke-width="2.5" />
      <circle cx="16" cy="28" r="2.5" fill="#5fd34a" />
      <line x1="16" y1="16" x2="16" y2="40" stroke="#5fd34a" stroke-width="1" opacity="0.4" />
      <line x1="4" y1="28" x2="28" y2="28" stroke="#5fd34a" stroke-width="1" opacity="0.4" />
      <!-- Rueda delantera -->
      <circle cx="56" cy="28" r="12" stroke="#5fd34a" stroke-width="2.5" />
      <circle cx="56" cy="28" r="2.5" fill="#5fd34a" />
      <line x1="56" y1="16" x2="56" y2="40" stroke="#5fd34a" stroke-width="1" opacity="0.4" />
      <line x1="44" y1="28" x2="68" y2="28" stroke="#5fd34a" stroke-width="1" opacity="0.4" />
      <!-- Cuadro de la bicicleta en blanco -->
      <line x1="16" y1="28" x2="33" y2="28" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      <line x1="16" y1="28" x2="27" y2="13" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      <line x1="27" y1="10" x2="33" y2="28" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      <line x1="27" y1="14" x2="48" y2="14" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      <line x1="48" y1="14" x2="33" y2="28" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      <line x1="50" y1="8" x2="56" y2="28" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
      <!-- Manillar verde -->
      <path d="M45 8 L53 8 L54 11" stroke="#5fd34a" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Sillín verde -->
      <path d="M22 10 C22 7, 31 7, 31 10 Z" fill="#5fd34a" />
      <!-- Plato y pedal -->
      <circle cx="33" cy="28" r="3.8" stroke="#5fd34a" stroke-width="1.8" />
      <circle cx="33" cy="28" r="1.5" fill="#ffffff" />
    </svg>
  `, "image/svg+xml");
  return svgDoc.documentElement;
}

function crearSvgBahiaVacia() {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(`
    <svg class="dibujo-bahia-vacia" viewBox="0 0 72 44" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Anclaje vacío">
      <rect x="23" y="9" width="26" height="26" rx="6" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-dasharray="4 3" />
      <rect x="33" y="15" width="6" height="14" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
      <path d="M36 5 L36 11 M33 8 L36 11 L39 8" stroke="#5fd34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
    </svg>
  `, "image/svg+xml");
  return svgDoc.documentElement;
}

function dibujar() {
  listaAnclajes.replaceChildren();

  for (const anclaje of anclajes) {
    const { numero } = anclaje;
    const libre = anclaje.estado === "LIBRE";
    const encajada = libre && encajados.has(numero);
    const tieneBici = !libre || encajada;
    const esSeleccionado = numero === seleccionado;

    const item = document.createElement("li");
    item.className = `anclaje ${tieneBici ? "anclaje--ocupado" : "anclaje--libre"}`;
    if (esSeleccionado) item.classList.add("anclaje--seleccionado");

    // 1. Cabecera con número, código y badge de estado
    const cabecera = document.createElement("div");
    cabecera.className = "anclaje__cabecera";

    const identificacion = document.createElement("div");
    identificacion.className = "anclaje__identificacion";

    const titulo = document.createElement("strong");
    titulo.className = "anclaje__titulo";
    titulo.textContent = `Anclaje ${numero}`;

    const codigo = document.createElement("span");
    codigo.className = "anclaje__codigo";
    codigo.textContent = anclaje.codigo;

    identificacion.append(titulo, codigo);

    const badge = document.createElement("span");
    badge.className = `anclaje__badge ${tieneBici ? "anclaje__badge--bici" : "anclaje__badge--libre"}`;
    badge.textContent = tieneBici ? "● Con bici" : "○ Libre";

    cabecera.append(identificacion, badge);

    // 2. Zona central visual: dibujo de la bici o bahía vacía
    const visual = document.createElement("div");
    visual.className = `anclaje__visual ${tieneBici ? "anclaje__visual--con-bici" : "anclaje__visual--libre"}`;

    if (tieneBici) {
      visual.append(crearSvgBicicleta());

      const etiquetaBici = document.createElement("div");
      etiquetaBici.className = "anclaje__bici-datos";

      const codigoBici = document.createElement("span");
      codigoBici.className = "anclaje__bici-codigo";
      codigoBici.textContent = anclaje.bicicleta?.codigo ?? (encajada ? "Bici encajada" : "Bici disponible");

      const estadoBici = document.createElement("span");
      estadoBici.className = "anclaje__bici-estado";
      estadoBici.textContent = encajada ? "Lista para devolver" : (anclaje.bicicleta?.estado ?? "DISPONIBLE");

      etiquetaBici.append(codigoBici, estadoBici);
      visual.append(etiquetaBici);
    } else {
      visual.append(crearSvgBahiaVacia());

      const etiquetaLibre = document.createElement("div");
      etiquetaLibre.className = "anclaje__libre-datos";
      etiquetaLibre.textContent = "Disponible para devolver";

      visual.append(etiquetaLibre);
    }

    // 3. Botones de acción
    const acciones = document.createElement("div");
    acciones.className = "anclaje__acciones";

    const btnAcercarse = crearBoton(
      esSeleccionado ? "✓ En posición" : "Acercarse",
      () => alternarSeleccion(numero),
      esSeleccionado
    );
    btnAcercarse.classList.add("boton--acercarse");
    acciones.append(btnAcercarse);

    if (libre) {
      const btnEncaje = crearBoton(
        encajada ? "Desencajar bici" : "Encajar bici",
        () => alternarEncaje(numero),
        encajada
      );
      btnEncaje.classList.add("boton--encajar");
      acciones.append(btnEncaje);
    }

    item.append(cabecera, visual, acciones);
    listaAnclajes.append(item);
  }
}

async function cargarAnclajes() {
  try {
    const respuesta = await fetch(`/estaciones/${estacionId}/anclajes`);
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      if (datos.error === "backend_no_responde") {
        throw new Error("El backend principal (puerto 4000) no responde. Inicia StateBike con: npm run server o npm run dev:all");
      }
      if (datos.error === "clave_interna_invalida") {
        throw new Error("Clave interna no coincide. Reinicia el backend de StateBike para que tome la nueva CLAVE_INTERNA");
      }
      if (datos.error === "estacion_no_encontrada") {
        throw new Error(`La estación #${estacionId} no existe en la base de datos. Prueba con #92 o #1`);
      }
      throw new Error(datos.mensaje || datos.error || "No se pudo cargar la estación");
    }

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
  } catch (err) {
    avisoCarga.textContent = err.message || "No se pudo cargar la estación";
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