// ==========================================================
//  Pestaña "Tiempo" — cronómetro y temporizador de descanso
//  Ambos se calculan por marca de tiempo (Date.now), así que
//  siguen bien aunque el navegador frene los "ticks" en segundo plano.
// ==========================================================

const cronoDisplay = document.getElementById("crono-display");
const cronoToggle = document.getElementById("crono-toggle");
const cronoReset = document.getElementById("crono-reset");

const descDisplay = document.getElementById("desc-display");
const descToggle = document.getElementById("desc-toggle");
const descReset = document.getElementById("desc-reset");
const descAviso = document.getElementById("desc-aviso");

// ---- Estado ----
let crono = { corriendo: false, acumuladoMs: 0, inicioMs: 0 };
let desc = { corriendo: false, duracionSeg: 90, baseSeg: 90, finMs: 0, avisado: false };

function cronoMs() {
  return crono.acumuladoMs + (crono.corriendo ? Date.now() - crono.inicioMs : 0);
}
function descSegRestantes() {
  if (desc.corriendo) return Math.max(0, (desc.finMs - Date.now()) / 1000);
  if (desc.avisado) return 0; // acaba de terminar: se queda en 0:00 hasta que hagas algo
  return desc.duracionSeg;
}

// ---- Aviso al terminar el descanso ----

let _audioCtx = null;
function pitido() {
  if (!obtenerPref("sonido")) return;
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    [0, 0.22, 0.44].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.start(t0);
      osc.stop(t0 + 0.17);
    });
  } catch (e) {
    /* algunos navegadores no dejan sonar; no pasa nada */
  }
}
function vibrar() {
  try {
    if (obtenerPref("vibracion") && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (e) {
    /* algunos navegadores no permiten vibrar; no pasa nada */
  }
}

// ---- Pintado (se ejecuta 10 veces por segundo) ----

function pintarTiempo() {
  cronoDisplay.textContent = formatearCronometro(cronoMs(), obtenerPref("cronDecimas"));

  const restante = descSegRestantes();
  descDisplay.textContent = formatearCuentaAtras(restante);

  if (desc.corriendo && restante <= 0 && !desc.avisado) {
    desc.avisado = true;
    desc.corriendo = false;
    descToggle.textContent = "Empezar";
    descAviso.classList.remove("oculta");
    pitido();
    vibrar();
  }
}
setInterval(pintarTiempo, 100);

// ---- Cronómetro ----

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
  pintarTiempo();
});

cronoReset.addEventListener("click", () => {
  crono = { corriendo: false, acumuladoMs: 0, inicioMs: 0 };
  cronoToggle.textContent = "Empezar";
  pintarTiempo();
});

// ---- Descanso ----

// Fija la duración y deja el temporizador parado y listo
function ponerDescanso(seg) {
  desc.duracionSeg = Math.max(5, Math.round(seg));
  desc.baseSeg = desc.duracionSeg;
  desc.corriendo = false;
  desc.avisado = false;
  descAviso.classList.add("oculta");
  descToggle.textContent = "Empezar";
  pintarTiempo();
}

document.getElementById("chips-descanso-tiempo").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-seg]");
  if (boton) ponerDescanso(Number(boton.dataset.seg));
});
document.getElementById("desc-menos").addEventListener("click", () => {
  if (!desc.corriendo) ponerDescanso(desc.duracionSeg - 15);
});
document.getElementById("desc-mas").addEventListener("click", () => {
  if (!desc.corriendo) ponerDescanso(desc.duracionSeg + 15);
});

descToggle.addEventListener("click", () => {
  if (desc.corriendo) {
    // pausar: guardamos lo que queda como nueva duración
    desc.duracionSeg = Math.ceil(descSegRestantes());
    desc.corriendo = false;
    descToggle.textContent = "Seguir";
  } else {
    desc.finMs = Date.now() + desc.duracionSeg * 1000;
    desc.corriendo = true;
    desc.avisado = false;
    descAviso.classList.add("oculta");
    descToggle.textContent = "Pausar";
  }
  pintarTiempo();
});

descReset.addEventListener("click", () => ponerDescanso(desc.baseSeg));

// Arranque
pintarTiempo();
