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
//
// La onda es CUADRADA, no senoidal. Una senoidal es un tono puro, sin armonicos:
// es la forma de onda que menos se oye, y el altavoz de un movil la reproduce
// fatal. En un gimnasio con musica se la tragaba entera. La cuadrada tiene
// armonicos y corta el ruido; se le quita el filo con un filtro paso bajo para
// que no raspe.
function _programarTono(freq, enSeg, dur, vol) {
  const ctx = _audioCtx;
  if (!ctx || enSeg < 0) return;
  const osc = ctx.createOscillator();
  const filtro = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  filtro.type = "lowpass";
  filtro.frequency.value = freq * 3.5;
  osc.connect(filtro);
  filtro.connect(gain);
  gain.connect(ctx.destination);
  const t0 = ctx.currentTime + enSeg;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t0 + 0.01);
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
  const factor = factorVolumen(obtenerPref("volumenAviso"));
  avisosDelTramo(finEnSeg, hayOtro).forEach((a) => {
    _programarTono(a.freq, a.enSeg, a.dur, a.vol * 0.8 * factor);
  });
}

// Muestra del aviso para Ajustes: el remate, al volumen elegido.
function sonarMuestraAviso() {
  if (!_ctxAudio()) return;
  cancelarAvisos();
  const factor = factorVolumen(obtenerPref("volumenAviso"));
  REMATE.forEach((freq, i) => {
    const ultima = i === REMATE.length - 1;
    _programarTono(freq, i * 0.16, ultima ? 0.35 : 0.14, 0.8 * factor);
  });
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
  ajustarBucle();
});
cronoReset.addEventListener("click", () => {
  crono = { corriendo: false, acumuladoMs: 0, inicioMs: 0 };
  cronoToggle.textContent = "Empezar";
  guardarEstadoTiempo();
  ajustarBucle();
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
  ajustarBucle();
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
  ajustarBucle();
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
  ajustarBucle();
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

// Colores de la ventana flotante. El texto siempre va en blanco encima, asi que
// cada uno tiene que dar 4,5:1 con el blanco: la ventanita se mira de lejos y
// con el movil apoyado. Los de antes (#e2551f y #c2740c) daban 3,8 y 3,6.
const COLOR_FASE_PIP = {
  prep: "#ab6309", serie: "#15803d", descanso: "#d1440f", fin: "#d1440f", "": "#17222e",
};

const flotanteDisponible = !!(
  pipVideo &&
  document.pictureInPictureEnabled &&
  HTMLCanvasElement.prototype.captureStream
);

// Tamaño del lienzo. 2,39:1 es lo mas plano que Chrome-Android permite en una
// ventana PiP. Se dibuja a ESCALA_PIP veces el tamaño logico porque Android
// estira la ventana: a 320x134 se veia una imagen pequena ampliada, con los
// bordes blandos. Dibujando a 3x llega nitida.
const ANCHO_PIP = 320;
const ALTO_PIP = 134;
const ESCALA_PIP = 3;

// La familia de letra se LEE del cronometro de la pantalla en vez de repetirla
// aqui a mano: asi las dos no pueden separarse si algun dia cambia el CSS.
function _familiaPiP() {
  try {
    const el = document.querySelector(".tiempo-display");
    const f = el && getComputedStyle(el).fontFamily;
    if (f) return f;
  } catch (e) { /* nada */ }
  return 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
}

// Escribe un numero con todos los digitos en casillas del MISMO ancho.
// El lienzo no tiene "tabular-nums" (el CSS del cronometro si), asi que sin esto
// el 1 es mas estrecho que el 8 y el numero se mueve solo cada segundo.
function _numeroTabular(c, texto, cx, cy) {
  let ancho = 0;
  for (let d = 0; d <= 9; d++) ancho = Math.max(ancho, c.measureText(String(d)).width);
  const anchos = [...texto].map((ch) => (ch >= "0" && ch <= "9" ? ancho : c.measureText(ch).width));
  const total = anchos.reduce((a, b) => a + b, 0);
  const antes = c.textAlign;
  c.textAlign = "center";
  let x = cx - total / 2;
  [...texto].forEach((ch, i) => {
    c.fillText(ch, x + anchos[i] / 2, cy);
    x += anchos[i];
  });
  c.textAlign = antes;
}

// Se pinta sobre el color de la fase, en dos alturas: la fase arriba (versalitas
// espaciadas, algo translúcida) y el tiempo abajo, grande. Android redondea las
// esquinas -> queda como una pastilla.
function dibujarPiP() {
  if (!_pipCtx) return;
  const c = _pipCtx;
  const k = ESCALA_PIP;
  const w = ANCHO_PIP;
  const h = ALTO_PIP;
  const familia = _familiaPiP();
  const tramo = temp.segmentos[temp.indice];
  const fase = temp.terminadoEn ? "fin" : (tramo ? tramo.fase : "");
  const conLS = "letterSpacing" in c;

  c.setTransform(k, 0, 0, k, 0, 0);
  c.fillStyle = COLOR_FASE_PIP[fase] || "#17222e";
  c.fillRect(0, 0, w, h);
  c.textAlign = "center";
  c.textBaseline = "middle";

  if (temp.terminadoEn) {
    c.fillStyle = "#fff";
    c.font = `700 40px ${familia}`;
    c.fillText("¡hecho!", w / 2, h / 2 + 1);
    return;
  }

  let etiqueta = (NOMBRE_FASE[fase] || "").toUpperCase();
  if (fase === "serie" && tramo) etiqueta = `SERIE ${tramo.serie} / ${temp.numSeries}`;
  c.fillStyle = "rgba(255, 255, 255, 0.82)";
  c.font = `600 18px ${familia}`;
  if (conLS) c.letterSpacing = "3px";
  c.fillText(etiqueta, w / 2 + (conLS ? 1.5 : 0), h * 0.30);
  if (conLS) c.letterSpacing = "0px";

  c.fillStyle = "#fff";
  c.font = `700 60px ${familia}`;
  _numeroTabular(c, formatearCuentaAtras(segRestantes()), w / 2, h * 0.66);
}

async function abrirFlotante() {
  if (!flotanteDisponible) return;
  try {
    if (!_pipCanvas) {
      _pipCanvas = document.createElement("canvas");
      _pipCanvas.width = ANCHO_PIP * ESCALA_PIP;
      _pipCanvas.height = ALTO_PIP * ESCALA_PIP;
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

// El bucle solo corre cuando hay algo que pintar. Antes daba 10 vueltas por
// segundo siempre, aunque estuvieras en Historial sin nada en marcha.
let _bucle = null;
let _ajustando = false;
let _ultimoSegundoPiP = null;

function hayQuePintar() {
  return crono.corriendo
    || temp.corriendo
    || (!!temp.terminadoEn && Date.now() - temp.terminadoEn < 7000);
}

function ajustarBucle() {
  if (_ajustando) return;          // tick() nos vuelve a llamar: no reentrar
  _ajustando = true;
  const falta = hayQuePintar();
  if (falta && !_bucle) _bucle = setInterval(tick, 100);
  if (!falta && _bucle) { clearInterval(_bucle); _bucle = null; }
  if (!falta) tick();              // un ultimo pintado para dejarlo coherente
  _ajustando = false;
}

function tick() {
  cronoDisplay.textContent = formatearCronometro(cronoMs(), obtenerPref("cronDecimas"));
  if (temp.corriendo || temp.terminadoEn) pintarTemporizador();
  pintarEtiquetaTemp();
  pintarPildora();

  // La ventana flotante solo se redibuja cuando cambia el segundo que muestra,
  // no diez veces por segundo.
  if (document.pictureInPictureElement) {
    const ahora = temp.terminadoEn ? "fin" : formatearCuentaAtras(segRestantes());
    if (ahora !== _ultimoSegundoPiP) { _ultimoSegundoPiP = ahora; dibujarPiP(); }
  } else {
    _ultimoSegundoPiP = null;
  }

  ajustarBucle();
}

// Arranque
restaurarEstadoTiempo();
pintarConfig();
pintarEtiquetaTemp();
ajustarBucle();   // arranca el bucle solo si hace falta
