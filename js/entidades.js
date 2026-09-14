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
// Devuelve las rutinas ordenadas por nombre (A->Z), igual que los ejercicios.
// localeCompare con "es" coloca bien las tildes: "Tirón" va donde toca y no
// al final, que es lo que pasa comparando con < a secas.
// Es solo el ORDEN EN QUE SE LEEN: no reordena lo guardado.
function listarRutinas() {
  return [...DATOS.rutinas].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );
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

// Cambia un ejercicio del entreno EN CURSO por otro (la maquina esta ocupada y
// haces un equivalente). NO toca la rutina: la rutina es lo que quieres hacer,
// el entreno es lo que hiciste. Si cambiara la rutina, la semana que viene
// seguirias con el sustituto por un atasco de un martes.
//
//  - si no habias anotado nada, lo sustituye en el sitio
//  - si ya habias anotado series, las conserva y mete el nuevo justo debajo con
//    las que te quedaban. Reemplazar sin mas te borraria series que SI hiciste,
//    y ademas "hice 2 de press banca y 2 de mancuernas" es lo que paso de
//    verdad: las dos cosas tienen que llegar al historial.
//
// Devuelve el indice del bloque nuevo, o -1 si no se pudo.
function cambiarEjercicioDeSesion(indice, nuevoEjercicioId) {
  const s = DATOS.sesionActiva;
  const ej = s && s.ejercicios[indice];
  const nuevo = obtenerEjercicio(nuevoEjercicioId);
  if (!ej || !nuevo) return -1;

  const hechas = ej.filas.filter(serieRegistrada).length;
  const quedaban = Math.max(1, ej.filas.length - hechas);

  const bloque = {
    exerciseId: nuevo.id,
    exerciseNombre: nuevo.nombre,
    porTiempo: seMidePorTiempo(nuevo),
    objetivo: {
      // series y reps se mantienen: son tu intencion para ese hueco, da igual
      // en que maquina. El peso NO: otra maquina es otra carga, y arrastrar el
      // del ejercicio anterior seria un dato falso. La linea "ultima: ..." del
      // sustituto sale sola de su propio historial, que es lo que necesitas.
      series: ej.objetivo.series,
      reps: ej.objetivo.reps,
      peso: 0,
      descansoSeg: ej.objetivo.descansoSeg,
    },
    filas: [],
  };
  const nFilas = hechas > 0 ? quedaban : ej.filas.length;
  for (let i = 0; i < nFilas; i++) bloque.filas.push({ pesoReal: "", repsReal: "" });

  if (hechas > 0) {
    ej.filas = ej.filas.filter(serieRegistrada); // las vacias no llegaron a pasar
    s.ejercicios.splice(indice + 1, 0, bloque);
  } else {
    s.ejercicios[indice] = bloque;
  }
  guardar();
  return hechas > 0 ? indice + 1 : indice;
}

// Anade al entreno EN CURSO un ejercicio que no estaba en la rutina ("hoy me
// apetece uno mas"). NO toca la rutina, igual que cambiarEjercicioDeSesion.
//
// Empieza SIN objetivo y con UNA sola fila: cuando lo anades sobre la marcha no
// lo has planificado, no sabes si haras dos series o cuatro. Pedir series, reps,
// peso y descanso antes de empezar seria un formulario en mitad del gimnasio
// para rellenar datos inventados. Vas anadiendo filas con el "+".
//
// "extra: true" es lo que hace que no se pinte la linea de objetivo, asi que de
// un vistazo distingues lo que era el plan de lo que te sacaste de la manga.
// Devuelve el indice del bloque nuevo, o -1 si no se pudo.
function anadirEjercicioASesion(exerciseId) {
  const s = DATOS.sesionActiva;
  const ej = obtenerEjercicio(exerciseId);
  if (!s || !ej) return -1;

  s.ejercicios.push({
    exerciseId: ej.id,
    exerciseNombre: ej.nombre,
    porTiempo: seMidePorTiempo(ej),
    extra: true,
    objetivo: {
      series: 0,   // 0 = sin objetivo
      reps: "",
      peso: 0,
      // el ultimo descanso que usaste, que es el que tienes en la cabeza
      descansoSeg: DATOS.temporizador.descansoSeg || 90,
    },
    filas: [{ pesoReal: "", repsReal: "" }],
  });
  guardar();
  return s.ejercicios.length - 1;
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
