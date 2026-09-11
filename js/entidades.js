// @ts-check
// ==========================================================
//  Ejercicios, rutinas y entrenamientos
//  Crear, editar, borrar y guardar. Aqui vive el CRUD.
// ==========================================================

// Guardado aplazado: al teclear peso/reps no escribimos en cada letra, sino
// RETARDO_GUARDADO ms después de la última. Ver guardarSesionActiva().
const RETARDO_GUARDADO = 400;

let _guardadoAplazado = null;

function cancelarGuardadoAplazado() {
  if (!_guardadoAplazado) return;
  clearTimeout(_guardadoAplazado);
  _guardadoAplazado = null;
}

// Devuelve los ejercicios ordenados por nombre (A→Z)
function listarEjercicios() {
  return [...DATOS.ejercicios].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );
}

function obtenerEjercicio(id) {
  return DATOS.ejercicios.find((e) => e.id === id) || null;
}

function crearEjercicio({ nombre, grupo, nota, medida }) {
  const ejercicio = {
    id: nuevoId(),
    nombre: (nombre || "").trim(),
    grupo: grupo || "Otro",
    nota: (nota || "").trim(),
    medida: medida === "tiempo" ? "tiempo" : "reps",
  };
  DATOS.ejercicios.push(ejercicio);
  guardar();
  return ejercicio;
}

function editarEjercicio(id, { nombre, grupo, nota, medida }) {
  const ej = obtenerEjercicio(id);
  if (!ej) return;
  ej.nombre = (nombre || "").trim();
  ej.grupo = grupo || "Otro";
  ej.medida = medida === "tiempo" ? "tiempo" : "reps";
  ej.nota = (nota || "").trim();
  guardar();
}

function borrarEjercicio(id) {
  DATOS.ejercicios = DATOS.ejercicios.filter((e) => e.id !== id);
  guardar();
}

// Rutinas en el orden en que se crearon
function listarRutinas() {
  return [...DATOS.rutinas];
}

function obtenerRutina(id) {
  return DATOS.rutinas.find((r) => r.id === id) || null;
}

function crearRutina({ nombre, division }) {
  const rutina = {
    id: nuevoId(),
    nombre: (nombre || "").trim(),
    division: division || "",
    items: [], // los ejercicios de la rutina se añaden en el paso siguiente
  };
  DATOS.rutinas.push(rutina);
  guardar();
  return rutina;
}

function editarRutina(id, { nombre, division }) {
  const rutina = obtenerRutina(id);
  if (!rutina) return;
  rutina.nombre = (nombre || "").trim();
  rutina.division = division || "";
  guardar();
}

function borrarRutina(id) {
  DATOS.rutinas = DATOS.rutinas.filter((r) => r.id !== id);
  guardar();
}

function _normalizarItem({ exerciseId, series, reps, peso, descansoSeg, nota }) {
  return {
    exerciseId: exerciseId || "",
    series: Math.min(MAX_SERIES, Math.round(_num(series, 1, 3))),
    reps: (reps || "").trim(),
    peso: _num(peso, 0, 0),
    descansoSeg: Math.round(_num(descansoSeg, 0, 0)),
    nota: (nota || "").trim(),
  };
}

function añadirItemRutina(rutinaId, datosItem) {
  const rutina = obtenerRutina(rutinaId);
  if (!rutina) return;
  rutina.items.push(_normalizarItem(datosItem));
  guardar();
}

function editarItemRutina(rutinaId, indice, datosItem) {
  const rutina = obtenerRutina(rutinaId);
  if (!rutina || !rutina.items[indice]) return;
  rutina.items[indice] = _normalizarItem(datosItem);
  guardar();
}

function quitarItemRutina(rutinaId, indice) {
  const rutina = obtenerRutina(rutinaId);
  if (!rutina) return;
  rutina.items.splice(indice, 1);
  guardar();
}

// Mueve un item una posición arriba (delta -1) o abajo (delta +1)
function moverItemRutina(rutinaId, indice, delta) {
  const rutina = obtenerRutina(rutinaId);
  if (!rutina) return;
  const destino = indice + delta;
  if (destino < 0 || destino >= rutina.items.length) return;
  const [item] = rutina.items.splice(indice, 1);
  rutina.items.splice(destino, 0, item);
  guardar();
}

// Coloca el item que está en 'desde' en la posición 'hasta' (arrastrar y soltar)
function reordenarItem(rutinaId, desde, hasta) {
  const rutina = obtenerRutina(rutinaId);
  if (!rutina) return;
  const n = rutina.items.length;
  if (desde < 0 || desde >= n || hasta < 0 || hasta >= n || desde === hasta) return;
  const [item] = rutina.items.splice(desde, 1);
  rutina.items.splice(hasta, 0, item);
  guardar();
}

function sesionActiva() {
  return DATOS.sesionActiva;
}

// Crea la sesión en curso a partir de una rutina, con las casillas prellenadas
// con el objetivo de cada ejercicio.
function empezarSesion(routineId) {
  const rutina = obtenerRutina(routineId);
  if (!rutina) return null;

  DATOS.sesionActiva = {
    routineId: rutina.id,
    routineNombre: rutina.nombre, // copia, por si luego se edita/borra la rutina
    division: rutina.division,
    inicio: new Date().toISOString(),
    ejercicios: rutina.items.map((item) => {
      const ej = obtenerEjercicio(item.exerciseId);
      // Las filas empiezan en blanco; el objetivo se muestra como referencia.
      // Con "registro simple" activado, una sola fila por ejercicio (la mejor serie).
      const nFilas = DATOS.prefs.registroSimple ? 1 : item.series;
      const filas = [];
      for (let i = 0; i < nFilas; i++) {
        filas.push({ pesoReal: "", repsReal: "" });
      }
      return {
        exerciseId: item.exerciseId,
        exerciseNombre: ej ? ej.nombre : "(ejercicio eliminado)",
        // copia, igual que el nombre: el entreno no cambia si luego editas la ficha
        porTiempo: seMidePorTiempo(ej),
        objetivo: {
          series: item.series,
          reps: item.reps,
          peso: item.peso,
          descansoSeg: item.descansoSeg,
        },
        filas,
      };
    }),
  };
  guardar();
  return DATOS.sesionActiva;
}

// Guarda los cambios del entreno en curso.
// Por defecto ESPERA un poco: al escribir peso/reps se pulsan muchas teclas
// seguidas y serializar todo el almacén en cada una da tirones en el móvil.
// Con { inmediato: true } guarda ya (marcar una serie, añadirla, quitarla...).
function guardarSesionActiva({ inmediato = false } = {}) {
  if (inmediato) return guardar();
  cancelarGuardadoAplazado();
  _guardadoAplazado = setTimeout(() => {
    _guardadoAplazado = null;
    guardar();
  }, RETARDO_GUARDADO);
  return true;
}

// Fuerza el guardado que estuviera esperando (al esconder o cerrar la app).
function _guardarPendienteYa() {
  if (_guardadoAplazado) guardar(); // guardar() ya cancela el temporizador
}

// En el movil "pagehide" no siempre llega; "visibilitychange" a oculto si.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", _guardarPendienteYa);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") _guardarPendienteYa();
  });
}

// Abandona la sesión en curso sin registrarla
function descartarSesionActiva() {
  DATOS.sesionActiva = null;
  guardar();
}

// Cierra la sesión en curso y la registra en el historial.
// Solo se guardan las series con repeticiones anotadas (ver serieRegistrada).
function terminarSesion() {
  const s = DATOS.sesionActiva;
  if (!s) return null;

  const sets = [];
  s.ejercicios.forEach((ej) => {
    ej.filas.forEach((fila, indice) => {
      if (!serieRegistrada(fila)) return;
      sets.push({
        exerciseId: ej.exerciseId,
        exerciseNombre: ej.exerciseNombre,
        serie: indice + 1,
        pesoReal: _num(fila.pesoReal, 0, 0),
        repsReal: (fila.repsReal || "").trim(),
      });
    });
  });

  const sesion = {
    id: nuevoId(),
    routineId: s.routineId,
    routineNombre: s.routineNombre,
    division: s.division,
    inicio: s.inicio,
    fecha: new Date().toISOString(),
    sets,
  };

  DATOS.sesiones.push(sesion);
  DATOS.sesionActiva = null;
  invalidarIndiceSets();
  guardar();
  return sesion;
}

// Entrenamientos terminados, del más reciente al más antiguo
function listarSesiones() {
  return [...DATOS.sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function obtenerSesion(id) {
  return DATOS.sesiones.find((s) => s.id === id) || null;
}

function borrarSesion(id) {
  DATOS.sesiones = DATOS.sesiones.filter((s) => s.id !== id);
  invalidarIndiceSets();
  guardar();
}
