// @ts-check
// ==========================================================
//  Temporizador de series
//  Configuracion guardada, tramos (prepara/serie/descanso) y avisos.
// ==========================================================

function obtenerTempConfig() {
  return { ...DATOS.temporizador };
}

// Guarda solo las claves que se pasen (mezcla con lo que ya hay)
function guardarTempConfig(parcial) {
  DATOS.temporizador = Object.assign(DATOS.temporizador, parcial);
  guardar();
}

// Construye la lista de tramos: prep + (serie, descanso) x numSeries.
// El último descanso se omite. Devuelve [{ fase, seg, serie }].
function construirSegmentos({ prepSeg, serieSeg, descansoSeg, numSeries }) {
  const segmentos = [];
  if (prepSeg > 0) segmentos.push({ fase: "prep", seg: prepSeg, serie: 0 });
  for (let i = 1; i <= numSeries; i++) {
    segmentos.push({ fase: "serie", seg: serieSeg, serie: i });
    if (i < numSeries && descansoSeg > 0) {
      segmentos.push({ fase: "descanso", seg: descansoSeg, serie: i });
    }
  }
  return segmentos;
}

// Cuenta atrás sonora: un tic corto por segundo durante los últimos SEG_CUENTA.
const SEG_CUENTA = 5;

// Final del tramo: tres notas SUBIENDO (la, re, sol). Un patrón se reconoce sin
// mirar el móvil; un pitido más fuerte, no.
const REMATE = [880, 1175, 1568];

// Avisos de sonido de un tramo, como offsets (segundos) desde ahora.
//  - cuenta atrás: un tic flojo por segundo en los últimos 5
//  - al acabar: dos notas si viene otro tramo, las tres si se acabó el entreno
//
// Se programan por adelantado con Web Audio, que cumple la cita aunque el móvil
// esté bloqueado y la app dormida. Por eso NO se usa la voz del sistema para la
// cuenta atrás: hay que pedirsela en el momento, y en ese momento la app puede
// no estar despierta.
//
// "vol" es relativo (0-1) y lo escala el volumen elegido en Ajustes: los tics
// van flojos para que el remate destaque de verdad.
function avisosDelTramo(finEnSeg, hayOtroTramo) {
  const avisos = [];
  for (let k = SEG_CUENTA; k >= 1; k--) {
    if (finEnSeg - k > 0.05) avisos.push({ freq: 1320, enSeg: finEnSeg - k, vol: 0.35, dur: 0.07 });
  }
  if (finEnSeg > 0.05) {
    const notas = hayOtroTramo ? REMATE.slice(0, 2) : REMATE;
    notas.forEach((freq, i) => {
      const ultima = i === notas.length - 1;
      avisos.push({ freq, enSeg: finEnSeg + i * 0.16, vol: 1, dur: ultima ? 0.35 : 0.14 });
    });
  }
  return avisos;
}

// Ajustes -> factor de volumen. "alto" es el de por defecto: en un gimnasio con
// musica, el aviso tiene que ganarle al ruido.
const VOLUMEN_AVISO = { bajo: 0.3, medio: 0.6, alto: 1 };
function factorVolumen(nivel) {
  return VOLUMEN_AVISO[nivel] || VOLUMEN_AVISO.alto;
}
