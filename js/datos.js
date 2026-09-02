// ==========================================================
//  Capa de datos — todo lo que la app guarda en el dispositivo
//  Se usa localStorage: una "libretita" que vive en el navegador,
//  no necesita internet y sigue ahí al cerrar la app.
// ==========================================================

// Nombre bajo el que se guarda todo. La "v1" nos permite cambiar
// el formato en el futuro sin pisar datos viejos.
const CLAVE_ALMACEN = "gym.datos.v1";

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
  return { ejercicios: [], rutinas: [], sesiones: [] };
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
