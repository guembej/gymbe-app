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

const pildora = document.getElementById("pildora-descanso");
const pildoraTexto = document.getElementById("pildora-texto");
const seccionTiempo = document.querySelector('.seccion[data-seccion="cronometro"]');
const bloqueTemporizador = document.getElementById("bloque-temporizador");

const NOMBRE_FASE = { prep: "PREPÁRATE", serie: "SERIE", descanso: "DESCANSO" };

// ==========================================================
//  Aviso (sonido + vibración)
// ==========================================================

let _audioCtx = null;
function _tono(frecuencia, cuando, duracion, volumen) {
  const ctx = _audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frecuencia;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t0 = ctx.currentTime + cuando;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volumen, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
  osc.start(t0);
  osc.stop(t0 + duracion + 0.02);
}
function pitido(veces = 1, agudo = false) {
  if (!obtenerPref("sonido")) return;
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    const f = agudo ? 1320 : 880;
    for (let i = 0; i < veces; i++) _tono(f, i * 0.22, 0.15, 0.3);
  } catch (e) {
    /* algunos navegadores no dejan sonar; no pasa nada */
  }
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
  if (document.visibilityState === "visible" && temp.corriendo) pedirWakeLock();
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
});
cronoReset.addEventListener("click", () => {
  crono = { corriendo: false, acumuladoMs: 0, inicioMs: 0 };
  cronoToggle.textContent = "Empezar";
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
  ultimoAviso: -1, // segundo entero en el que sonó el último tic (3-2-1)
  numSeries: 4,
};

function limitar(valor, min, max) {
  return Math.max(min, Math.min(max, valor));
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
function configurarTemporizador({ numSeries, descansoSeg }) {
  const parcial = {};
  if (numSeries != null) parcial.numSeries = limitar(numSeries, 1, 15);
  if (descansoSeg != null) parcial.descansoSeg = limitar(descansoSeg, 5, 600);
  guardarTempConfig(parcial);
  pararTemporizador();
  pintarConfig();
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
  temp.ultimoAviso = -1;
  temp.finMs = Date.now() + temp.segmentos[0].seg * 1000;
  temp.corriendo = true;
  tempConfigEl.classList.add("oculta");
  tempMarchaEl.classList.remove("oculta");
  tempToggle.textContent = "Pausar";
  pedirWakeLock();
  pintarTemporizador();
}

function pararTemporizador() {
  temp.corriendo = false;
  temp.pausaMs = 0;
  temp.indice = 0;
  soltarWakeLock();
  tempMarchaEl.classList.add("oculta");
  tempConfigEl.classList.remove("oculta");
  bloqueTemporizador.dataset.fase = "";
}

function avanzarTramo() {
  temp.indice++;
  temp.ultimoAviso = -1;
  if (temp.indice >= temp.segmentos.length) {
    // Terminado
    temp.corriendo = false;
    temp.terminadoEn = Date.now();
    soltarWakeLock();
    tempFaseEl.textContent = "¡HECHO!";
    tempDisplayEl.textContent = "0:00";
    tempSiguienteEl.textContent = "";
    tempRestantesEl.textContent = "Entrenamiento completado";
    tempToggle.textContent = "Empezar de nuevo";
    bloqueTemporizador.dataset.fase = "fin";
    pitido(3);
    vibrar([300, 120, 300, 120, 300]);
    return;
  }
  temp.finMs = Date.now() + temp.segmentos[temp.indice].seg * 1000;
  pitido(1);
  vibrar([200]);
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

  // Tics 3-2-1
  const entero = Math.ceil(restante);
  if (temp.corriendo && entero <= 3 && entero >= 1 && entero !== temp.ultimoAviso) {
    temp.ultimoAviso = entero;
    pitido(1, true);
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
  }
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
  pintarPildora();
}
setInterval(tick, 100);

// Arranque
pintarConfig();
tick();
