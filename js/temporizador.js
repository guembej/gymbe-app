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

// Avisos de sonido de un tramo, como offsets (segundos) desde ahora:
//  - tics agudos 3-2-1 antes de acabar
//  - al acabar: 1 pitido si viene otro tramo, 3 si es el fin del entrenamiento
// Se programan con Web Audio (suenan aunque el móvil esté bloqueado).
function avisosDelTramo(finEnSeg, hayOtroTramo) {
  const avisos = [];
  for (let k = 3; k >= 1; k--) {
    if (finEnSeg - k > 0.05) avisos.push({ freq: 1320, enSeg: finEnSeg - k });
  }
  if (finEnSeg > 0.05) {
    const veces = hayOtroTramo ? 1 : 3;
    for (let i = 0; i < veces; i++) avisos.push({ freq: 880, enSeg: finEnSeg + i * 0.22 });
  }
  return avisos;
}
