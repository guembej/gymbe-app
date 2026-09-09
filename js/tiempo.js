// ==========================================================
//  Pestaña "Tiempo"
//  - Cronómetro (cuenta hacia arriba)
//  - Temporizador de series: PREPÁRATE -> (SERIE / DESCANSO) x N
//  Todo se calcula por marca de tiempo (Date.now), así que sigue
//  bien aunque el navegador frene los "ticks" en segundo plano.
// ==========================================================

// ---- Cronómetro ----
const cronoDisplay = document.getElementById("crono-display");
const cronoToggle = document.getElementById("crono-toggle");
const cronoReset = document.getElementById("crono-reset");

// ---- Temporizador de series ----
const tempConfigEl = document.getElementById("temp-config");
const tempMarchaEl = document.getElementById("temp-marcha");
const tempPrepEl = document.getElementById("temp-prep");
const tempSerieEl = document.getElementById("temp-serie");
const tempDescansoEl = document.getElementById("temp-descanso");
const tempNumSeriesEl = document.getElementById("temp-numseries");
const tempTotalEl = document.getElementById("temp-total");
const tempFaseEl = document.getElementById("temp-fase");
const tempDisplayEl = document.getElementById("temp-display");
const tempSiguienteEl = document.getElementById("temp-siguiente");
const tempRestantesEl = document.getElementById("temp-restantes");
const tempToggle = document.getElementById("temp-toggle");
const tempSaltar = document.getElementById("temp-saltar");
const tempReiniciar = document.getElementById("temp-reiniciar");
const tempEtiquetaEl = document.getElementById("temp-etiqueta");

const pildora = document.getElementById("pildora-descanso");
const pildoraTexto = document.getElementById("pildora-texto");
const seccionTiempo = document.querySelector('.seccion[data-seccion="cronometro"]');
const bloqueTemporizador = document.getElementById("bloque-temporizador");

const NOMBRE_FASE = { prep: "PREPÁRATE", serie: "SERIE", descanso: "DESCANSO" };

// ==========================================================
//  Aviso (sonido + vibración)
// ==========================================================

let _audioCtx = null;
let _avisosProgramados = [];

function _ctxAudio() {
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch (e) {
    return null;
  }
}

// Programa un tono para dentro de 'enSeg' segundos. Web Audio mantiene la cita
// aunque la app pase a segundo plano (setInterval no), así que el pitido de fin
// de descanso suena aunque tengas el móvil bloqueado.
function _programarTono(freq, enSeg, dur, vol) {
  const ctx = _audioCtx;
  if (!ctx || enSeg < 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t0 = ctx.currentTime + enSeg;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
  _avisosProgramados.push(osc);
}

function cancelarAvisos() {
  _avisosProgramados.forEach((osc) => { try { osc.stop(); } catch (e) {} });
  _avisosProgramados = [];
}

// (Re)programa los pitidos del tramo actual. Se llama al empezar/seguir un tramo
// y al saltar; cancela los anteriores para no doblar.
function reprogramarAvisos() {
  cancelarAvisos();
  if (!obtenerPref("sonido") || !temp.corriendo) return;
  if (!_ctxAudio()) return;
  const finEnSeg = (temp.finMs - Date.now()) / 1000;
  const hayOtro = temp.indice + 1 < temp.segmentos.length;
  avisosDelTramo(finEnSeg, hayOtro).forEach((a) => _programarTono(a.freq, a.enSeg, 0.15, 0.3));
}

function vibrar(patron) {
  try {
    if (obtenerPref("vibracion") && navigator.vibrate) navigator.vibrate(patron);
  } catch (e) {
    /* algunos navegadores no permiten vibrar */
  }
}

// ==========================================================
//  Mantener la pantalla encendida mientras corre el temporizador
// ==========================================================

let _wakeLock = null;
async function pedirWakeLock() {
  try {
    if (navigator.wakeLock && !_wakeLock) {
      _wakeLock = await navigator.wakeLock.request("screen");
      _wakeLock.addEventListener("release", () => { _wakeLock = null; });
    }
  } catch (e) { /* no disponible */ }
}
function soltarWakeLock() {
  try { if (_wakeLock) _wakeLock.release(); } catch (e) {}
  _wakeLock = null;
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && temp.corriendo) {
    pedirWakeLock();
    reprogramarAvisos(); // por si el navegador durmió el audio en segundo plano
  }
});

// ==========================================================
//  Cronómetro
// ==========================================================

let crono = { corriendo: false, acumuladoMs: 0, inicioMs: 0 };

function cronoMs() {
  return crono.acumuladoMs + (crono.corriendo ? Date.now() - crono.inicioMs : 0);
}

cronoToggle.addEventListener("click", () => {
  if (crono.corriendo) {
    crono.acumuladoMs = cronoMs();
    crono.corriendo = false;
    cronoToggle.textContent = "Seguir";
  } else {
    crono.inicioMs = Date.now();
    crono.corriendo = true;
    cronoToggle.textContent = "Pausar";
  }
  guardarEstadoTiempo();
});
cronoReset.addEventListener("click", () => {
  crono = { corriendo: false, acumuladoMs: 0, inicioMs: 0 };
  cronoToggle.textContent = "Empezar";
  guardarEstadoTiempo();
});

// ==========================================================
//  Temporizador de series
// ==========================================================

let temp = {
  segmentos: [],   // lista de tramos (prep / serie / descanso)
  indice: 0,       // tramo actual
  corriendo: false,
  finMs: 0,        // marca de tiempo en que acaba el tramo actual
  pausaMs: 0,      // ms restantes al pausar
  terminadoEn: 0,  // marca de tiempo del final (para la píldora)
  numSeries: 4,
  etiqueta: "",    // "Press banca · 8-12 reps · 60 kg" cuando viene de Entrenar
};

function limitar(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
}

// --- Guardar / restaurar el estado para que sobreviva a recargar la página ---
const CLAVE_TIEMPO = "gym.tiempo.v1";

function guardarEstadoTiempo() {
  try {
    localStorage.setItem(CLAVE_TIEMPO, JSON.stringify({ crono, temp }));
  } catch (e) { /* almacenamiento lleno o bloqueado */ }
}

function restaurarEstadoTiempo() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE_TIEMPO));
    if (!g) return;
    if (g.crono) crono = g.crono;
    if (g.temp && Array.isArray(g.temp.segmentos)) {
      temp = g.temp;
      if (temp.corriendo || temp.terminadoEn) {
        tempConfigEl.classList.add("oculta");
        tempMarchaEl.classList.remove("oculta");
        tempToggle.textContent = temp.terminadoEn
          ? "Empezar de nuevo"
          : (temp.corriendo ? "Pausar" : "Seguir");
        if (temp.corriendo) {
          pedirWakeLock();
          reprogramarAvisos(); // el audio no sobrevive a recargar; se reprograma
        }
      }
    }
    cronoToggle.textContent = crono.corriendo ? "Pausar" : (crono.acumuladoMs > 0 ? "Seguir" : "Empezar");
  } catch (e) { /* datos corruptos: se ignora */ }
}

// Pinta la pantalla de configuración con los valores guardados
function pintarConfig() {
  const c = obtenerTempConfig();
  tempPrepEl.textContent = c.prepSeg + " s";
  tempSerieEl.textContent = c.serieSeg + " s";
  tempDescansoEl.textContent = formatearCuentaAtras(c.descansoSeg);
  tempNumSeriesEl.textContent = c.numSeries;

  const total = construirSegmentos(c).reduce((t, s) => t + s.seg, 0);
  tempTotalEl.textContent = "Duración total: " + formatearCuentaAtras(total);
}

// Cambia un valor de la configuración
document.querySelectorAll("#temp-config .temp-stepper button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const campo = btn.dataset.campo;
    const paso = Number(btn.dataset.paso);
    const c = obtenerTempConfig();
    let valor = c[campo] + paso;
    if (campo === "numSeries") valor = limitar(valor, 1, 15);
    else if (campo === "prepSeg") valor = limitar(valor, 0, 60);
    else valor = limitar(valor, 5, 600);
    guardarTempConfig({ [campo]: valor });
    pintarConfig();
  });
});

// Configura el temporizador desde fuera (lo usa "Entrenar")
function configurarTemporizador({ numSeries, descansoSeg, ejercicio, reps, peso } = {}) {
  const parcial = {};
  if (numSeries != null) parcial.numSeries = limitar(numSeries, 1, 15);
  if (descansoSeg != null) parcial.descansoSeg = limitar(descansoSeg, 5, 600);
  guardarTempConfig(parcial);
  pararTemporizador();
  temp.etiqueta = construirEtiquetaTemp({ ejercicio, reps, peso });
  guardarEstadoTiempo();
  irASubtabTiempo("temporizador");
  pintarConfig();
  pintarEtiquetaTemp();
}

// ---- Ejecución ----

function segRestantes() {
  if (temp.corriendo) return Math.max(0, (temp.finMs - Date.now()) / 1000);
  if (temp.pausaMs > 0) return temp.pausaMs / 1000;
  return temp.segmentos[temp.indice] ? temp.segmentos[temp.indice].seg : 0;
}

function empezarTemporizador() {
  temp.segmentos = construirSegmentos(obtenerTempConfig());
  temp.numSeries = obtenerTempConfig().numSeries;
  temp.indice = 0;
  temp.pausaMs = 0;
  temp.terminadoEn = 0;
  temp.finMs = Date.now() + temp.segmentos[0].seg * 1000;
  temp.corriendo = true;
  tempConfigEl.classList.add("oculta");
  tempMarchaEl.classList.remove("oculta");
  tempToggle.textContent = "Pausar";
  pedirWakeLock();
  reprogramarAvisos();
  guardarEstadoTiempo();
  pintarTemporizador();
}

function pararTemporizador() {
  temp.corriendo = false;
  temp.pausaMs = 0;
  temp.indice = 0;
  temp.terminadoEn = 0;
  temp.etiqueta = "";
  cancelarAvisos();
  cerrarFlotante();
  soltarWakeLock();
  tempMarchaEl.classList.add("oculta");
  tempConfigEl.classList.remove("oculta");
  bloqueTemporizador.dataset.fase = "";
  if (tempEtiquetaEl) pintarEtiquetaTemp();
  guardarEstadoTiempo();
}

function avanzarTramo() {
  // Si venimos "con retraso" (la app estuvo cerrada), avanzamos sin vibración.
  // El sonido no se toca aquí: ya estaba programado con Web Audio.
  const conRetraso = Date.now() - temp.finMs > 1500;
  temp.indice++;

  if (temp.indice >= temp.segmentos.length) {
    temp.corriendo = false;
    temp.terminadoEn = temp.finMs;
    cancelarAvisos();
    soltarWakeLock();
    tempFaseEl.textContent = "¡HECHO!";
    tempDisplayEl.textContent = "0:00";
    tempSiguienteEl.textContent = "";
    tempRestantesEl.textContent = "Entrenamiento completado";
    tempToggle.textContent = "Empezar de nuevo";
    bloqueTemporizador.dataset.fase = "fin";
    if (!conRetraso) vibrar([300, 120, 300, 120, 300]);
    guardarEstadoTiempo();
    return;
  }

  // Al ponerse al día, encadenamos tramos desde el fin anterior (no desde ahora)
  temp.finMs = (conRetraso ? temp.finMs : Date.now()) + temp.segmentos[temp.indice].seg * 1000;
  reprogramarAvisos();
  if (!conRetraso) vibrar([200]);
  guardarEstadoTiempo();
}

function pintarTemporizador() {
  const tramo = temp.segmentos[temp.indice];
  if (!tramo) return;

  const restante = segRestantes();

  // Cambio de tramo
  if (temp.corriendo && restante <= 0) {
    avanzarTramo();
    return;
  }

  let etiquetaFase = NOMBRE_FASE[tramo.fase];
  if (tramo.fase === "serie") etiquetaFase = `SERIE ${tramo.serie} de ${temp.numSeries}`;
  tempFaseEl.textContent = etiquetaFase;
  tempDisplayEl.textContent = formatearCuentaAtras(restante);
  bloqueTemporizador.dataset.fase = tramo.fase;

  // Siguiente tramo
  const sig = temp.segmentos[temp.indice + 1];
  if (sig) {
    let nombreSig = NOMBRE_FASE[sig.fase];
    if (sig.fase === "serie") nombreSig = `serie ${sig.serie}`;
    tempSiguienteEl.textContent = `siguiente: ${nombreSig.toLowerCase()} · ${formatearCuentaAtras(sig.seg)}`;
  } else {
    tempSiguienteEl.textContent = "siguiente: fin";
  }

  // Series restantes
  const seriesHechas = temp.segmentos.slice(0, temp.indice + 1).filter((s) => s.fase === "serie").length;
  const seriesQuedan = temp.numSeries - seriesHechas + (tramo.fase === "serie" ? 1 : 0);
  tempRestantesEl.textContent =
    seriesQuedan === 1 ? "última serie" : `${seriesQuedan} series restantes`;
}

tempToggle.addEventListener("click", () => {
  if (temp.terminadoEn) {
    empezarTemporizador();
    return;
  }
  if (temp.corriendo) {
    temp.pausaMs = temp.finMs - Date.now();
    temp.corriendo = false;
    tempToggle.textContent = "Seguir";
    cancelarAvisos();
    soltarWakeLock();
  } else {
    const restanteMs = temp.pausaMs > 0
      ? temp.pausaMs
      : temp.segmentos[temp.indice].seg * 1000;
    temp.finMs = Date.now() + restanteMs;
    temp.pausaMs = 0;
    temp.corriendo = true;
    tempToggle.textContent = "Pausar";
    pedirWakeLock();
    reprogramarAvisos();
  }
  guardarEstadoTiempo();
  pintarTemporizador();
});

tempSaltar.addEventListener("click", () => {
  if (!temp.segmentos.length || temp.terminadoEn) return;
  temp.pausaMs = 0; // al saltar, el nuevo tramo empieza entero
  avanzarTramo();
  pintarTemporizador();
});

tempReiniciar.addEventListener("click", pararTemporizador);

document.getElementById("temp-empezar").addEventListener("click", empezarTemporizador);

// ==========================================================
//  Sub-pestañas: Temporizador | Cronómetro
// ==========================================================

function irASubtabTiempo(cual) {
  document.querySelectorAll("#tiempo-tabs .conmutador-boton").forEach((b) => {
    b.classList.toggle("activo", b.dataset.tiempo === cual);
  });
  document.querySelectorAll('.tiempo-vista').forEach((v) => {
    v.classList.toggle("oculta", v.dataset.tiempo !== cual);
  });
}
document.querySelectorAll("#tiempo-tabs .conmutador-boton").forEach((btn) => {
  btn.addEventListener("click", () => irASubtabTiempo(btn.dataset.tiempo));
});

// Etiqueta del ejercicio ("Press banca · 8-12 reps · 60 kg")
function pintarEtiquetaTemp() {
  const t = temp.etiqueta || "";
  tempEtiquetaEl.textContent = t;
  tempEtiquetaEl.hidden = !t;
}

// ==========================================================
//  Ventana flotante (Picture-in-Picture)
//  Una ventanita con la cuenta atrás que se queda encima de otras apps.
//  Es un truco: pintamos en un <canvas>, lo convertimos en vídeo y ese vídeo
//  entra en modo Picture-in-Picture. No todos los navegadores lo permiten.
// ==========================================================

const flotanteBtn = document.getElementById("temp-flotante");
const pipVideo = document.getElementById("pip-video");
let _pipCanvas = null;
let _pipCtx = null;

const COLOR_FASE_PIP = {
  prep: "#c2740c", serie: "#15803d", descanso: "#e2551f", fin: "#e2551f", "": "#1f2937",
};

const flotanteDisponible = !!(
  pipVideo &&
  document.pictureInPictureEnabled &&
  HTMLCanvasElement.prototype.captureStream
);

// Texto de la ventana flotante: igual que la píldora de dentro de la app,
// "descanso · 1:12" / "serie 2 · 0:35" / "prepárate · 0:05".
function textoPiP() {
  if (temp.terminadoEn) return "¡entrenamiento hecho!";
  const tramo = temp.segmentos[temp.indice];
  if (!tramo) return "";
  let nombre = (NOMBRE_FASE[tramo.fase] || "").toLowerCase();
  if (tramo.fase === "serie") nombre = `serie ${tramo.serie}`;
  return `${nombre} · ${formatearCuentaAtras(segRestantes())}`;
}

// Se pinta como la píldora: fondo del color de la fase y el texto en una línea,
// centrado y lo más grande que quepa. Android redondea las esquinas -> pastilla.
function dibujarPiP() {
  if (!_pipCtx) return;
  const c = _pipCtx;
  const w = _pipCanvas.width;
  const h = _pipCanvas.height;
  const tramo = temp.segmentos[temp.indice];
  const fase = temp.terminadoEn ? "fin" : (tramo ? tramo.fase : "");

  c.fillStyle = COLOR_FASE_PIP[fase] || "#1f2937";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#fff";
  c.textAlign = "center";
  c.textBaseline = "middle";

  const texto = textoPiP();
  let px = 42;
  do {
    c.font = `bold ${px}px system-ui, -apple-system, sans-serif`;
    px -= 2;
  } while (px > 14 && c.measureText(texto).width > w - 28);

  c.fillText(texto, w / 2, h / 2 + 2);
}

async function abrirFlotante() {
  if (!flotanteDisponible) return;
  try {
    if (!_pipCanvas) {
      _pipCanvas = document.createElement("canvas");
      // 2.39:1 es lo más plano que Chrome-Android permite en una ventana PiP
      _pipCanvas.width = 320;
      _pipCanvas.height = 134;
      _pipCtx = _pipCanvas.getContext("2d");
      pipVideo.srcObject = _pipCanvas.captureStream(8);
    }
    dibujarPiP();
    await pipVideo.play();
    await pipVideo.requestPictureInPicture();
  } catch (e) {
    avisar("Tu navegador no ha dejado abrir la ventana flotante.");
  }
}

function cerrarFlotante() {
  try {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
  } catch (e) { /* nada */ }
}

async function alternarFlotante() {
  if (document.pictureInPictureElement) cerrarFlotante();
  else await abrirFlotante();
}

if (flotanteDisponible) {
  flotanteBtn.hidden = false;
  flotanteBtn.addEventListener("click", alternarFlotante);
}

// ==========================================================
//  Píldora flotante
// ==========================================================

function pintarPildora() {
  const enTiempo = !seccionTiempo.classList.contains("oculta");
  const tramo = temp.segmentos[temp.indice];

  if (enTiempo || (!temp.corriendo && !temp.terminadoEn)) {
    pildora.classList.add("oculta");
    return;
  }

  if (temp.corriendo && tramo) {
    let nombre = NOMBRE_FASE[tramo.fase].toLowerCase();
    if (tramo.fase === "serie") nombre = `serie ${tramo.serie}`;
    pildora.classList.remove("oculta", "pildora-fin");
    pildoraTexto.textContent = `${nombre} · ${formatearCuentaAtras(segRestantes())}`;
  } else if (temp.terminadoEn && Date.now() - temp.terminadoEn < 6000) {
    pildora.classList.remove("oculta");
    pildora.classList.add("pildora-fin");
    pildoraTexto.textContent = "¡Entrenamiento hecho!";
  } else {
    pildora.classList.add("oculta");
  }
}
pildora.addEventListener("click", () => irA("cronometro"));

// ==========================================================
//  Bucle de pintado (10 veces por segundo)
// ==========================================================

function tick() {
  cronoDisplay.textContent = formatearCronometro(cronoMs(), obtenerPref("cronDecimas"));
  if (temp.corriendo || temp.terminadoEn) pintarTemporizador();
  pintarEtiquetaTemp();
  pintarPildora();
  if (document.pictureInPictureElement) dibujarPiP();
}
setInterval(tick, 100);

// Arranque
restaurarEstadoTiempo();
pintarConfig();
pintarEtiquetaTemp();
tick();
