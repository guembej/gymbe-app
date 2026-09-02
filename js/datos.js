// ==========================================================
//  Capa de datos — todo lo que la app guarda en el dispositivo
//  Se usa localStorage: una "libretita" que vive en el navegador,
//  no necesita internet y sigue ahí al cerrar la app.
// ==========================================================

// Nombre bajo el que se guarda todo. La "v1" nos permite cambiar
// el formato en el futuro sin pisar datos viejos.
// La página de pruebas define otra clave para no tocar tus datos reales.
const CLAVE_ALMACEN =
  (typeof window !== "undefined" && window.GYM_CLAVE_ALMACEN) || "gym.datos.v1";

// Grupos musculares disponibles (lista fija)
const GRUPOS_MUSCULARES = [
  "Pecho", "Espalda", "Pierna", "Hombro",
  "Bíceps", "Tríceps", "Core", "Otro",
];

// Divisiones de rutina disponibles (lista fija). "" = sin división.
const DIVISIONES = [
  "Full Body", "Push", "Pull", "Pierna",
  "Torso", "Superior", "Inferior", "Otro",
];

// Cómo son los datos cuando no hay nada guardado todavía
function datosVacios() {
  return {
    ejercicios: [],
    rutinas: [],
    sesiones: [],       // entrenamientos ya terminados
    sesionActiva: null, // entrenamiento en curso (o null si no hay ninguno)
  };
}

// Copia en memoria mientras la app está abierta
let DATOS = cargar();

// Lee la libretita del navegador
function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE_ALMACEN);
    if (!texto) return datosVacios();
    // Object.assign se asegura de que existan ejercicios/rutinas/sesiones
    // aunque el guardado sea de una versión antigua.
    return Object.assign(datosVacios(), JSON.parse(texto));
  } catch (e) {
    console.error("No se pudieron leer los datos; empiezo de cero.", e);
    return datosVacios();
  }
}

// Escribe la libretita del navegador
function guardar() {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(DATOS));
}

// Deja los datos a cero. Lo usa la página de pruebas antes de cada prueba.
function _reiniciarDatos() {
  DATOS = datosVacios();
  guardar();
}

// Identificador único para cada ejercicio / rutina / sesión
function nuevoId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
}

// Evita que un texto con < > & rompa el HTML donde lo insertemos
function escaparHtml(texto) {
  const d = document.createElement("div");
  d.textContent = texto == null ? "" : String(texto);
  return d.innerHTML;
}

// ----------------------------------------------------------
//  Ejercicios
// ----------------------------------------------------------

// Devuelve los ejercicios ordenados por nombre (A→Z)
function listarEjercicios() {
  return [...DATOS.ejercicios].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );
}

function obtenerEjercicio(id) {
  return DATOS.ejercicios.find((e) => e.id === id) || null;
}

function crearEjercicio({ nombre, grupo, nota }) {
  const ejercicio = {
    id: nuevoId(),
    nombre: (nombre || "").trim(),
    grupo: grupo || "Otro",
    nota: (nota || "").trim(),
  };
  DATOS.ejercicios.push(ejercicio);
  guardar();
  return ejercicio;
}

function editarEjercicio(id, { nombre, grupo, nota }) {
  const ej = obtenerEjercicio(id);
  if (!ej) return;
  ej.nombre = (nombre || "").trim();
  ej.grupo = grupo || "Otro";
  ej.nota = (nota || "").trim();
  guardar();
}

function borrarEjercicio(id) {
  DATOS.ejercicios = DATOS.ejercicios.filter((e) => e.id !== id);
  guardar();
}

// ----------------------------------------------------------
//  Rutinas
// ----------------------------------------------------------

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

// ----------------------------------------------------------
//  Ejercicios dentro de una rutina (items)
//  Cada item: { exerciseId, series, reps, peso, descansoSeg, nota }
//  - series / descansoSeg: números enteros
//  - peso: número (kg), admite decimales
//  - reps: texto corto, "10" o un rango "8-12"
// ----------------------------------------------------------

// Convierte a número; si no vale, usa el valor por defecto. Nunca por debajo de 'min'.
function _num(valor, min, porDefecto) {
  const n = parseFloat(valor);
  if (isNaN(n)) return porDefecto;
  return n < min ? min : n;
}

function _normalizarItem({ exerciseId, series, reps, peso, descansoSeg, nota }) {
  return {
    exerciseId: exerciseId || "",
    series: Math.round(_num(series, 1, 3)),
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

// ----------------------------------------------------------
//  Entrenamientos
//  - sesionActiva: el que se está haciendo ahora (se puede cerrar la app y seguir)
//  - sesiones: los ya terminados, con su fecha
// ----------------------------------------------------------

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
      const filas = [];
      for (let i = 0; i < item.series; i++) {
        filas.push({ pesoReal: String(item.peso || ""), repsReal: item.reps, hecha: false });
      }
      return {
        exerciseId: item.exerciseId,
        exerciseNombre: ej ? ej.nombre : "(ejercicio eliminado)",
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

// Guarda cambios en la sesión en curso (lo que se va marcando durante el entreno)
function guardarSesionActiva() {
  guardar();
}

// Abandona la sesión en curso sin registrarla
function descartarSesionActiva() {
  DATOS.sesionActiva = null;
  guardar();
}

// Cierra la sesión en curso y la registra en el historial.
// Solo se guardan las series marcadas como "hecha".
function terminarSesion() {
  const s = DATOS.sesionActiva;
  if (!s) return null;

  const sets = [];
  s.ejercicios.forEach((ej) => {
    ej.filas.forEach((fila, indice) => {
      if (!fila.hecha) return;
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
  guardar();
  return sesion;
}

// Entrenamientos terminados, del más reciente al más antiguo
function listarSesiones() {
  return [...DATOS.sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha));
}
