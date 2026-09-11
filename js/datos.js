// @ts-check
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

// Espejo diminuto del tema. El script anti-parpadeo del <head> lo lee para no
// tener que parsear TODO el almacen (que crece con el historial) antes del
// primer pixel. Guarda la PREFERENCIA ("sistema"/"claro"/"oscuro"), no el color
// resuelto, para que "sistema" siga al movil.
const CLAVE_TEMA =
  (typeof window !== "undefined" && window.GYM_CLAVE_ALMACEN)
    ? window.GYM_CLAVE_ALMACEN + ".tema"
    : "gym.tema";

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

// Un color por división, para identificarlas de un vistazo
const COLOR_DIVISION = {
  "Full Body": "#a78bfa",
  "Push": "#f97043",
  "Pull": "#38bdf8",
  "Pierna": "#4ade80",
  "Torso": "#fbbf24",
  "Superior": "#f472b6",
  "Inferior": "#2dd4bf",
  "Otro": "#9ca3af",
};

// Cómo son los datos cuando no hay nada guardado todavía
function datosVacios() {
  return {
    ejercicios: [],
    rutinas: [],
    sesiones: [],       // entrenamientos ya terminados
    sesionActiva: null, // entrenamiento en curso (o null si no hay ninguno)
    prefs: {
      tema: "sistema",         // "sistema" | "claro" | "oscuro"
      cronDecimas: false,      // cronómetro con décimas de segundo
      sonido: true,            // pitido al terminar el descanso
      volumenAviso: "alto",    // "bajo" | "medio" | "alto"
      vibracion: true,         // vibración al terminar el descanso
      registroSimple: false,   // en Entrenar, una sola fila por ejercicio (la mejor serie)
      grupoPorDefecto: "Otro", // grupo preseleccionado al crear un ejercicio al vuelo
    },
    temporizador: {       // última configuración del temporizador de series
      prepSeg: 5,         // cuenta atrás de "prepárate"
      serieSeg: 30,       // duración de cada serie
      descansoSeg: 90,    // descanso entre series
      numSeries: 4,       // número de series
    },
  };
}

// ¿Es la primera vez que se abre la app en este dispositivo?
// (null = nunca se ha guardado nada todavía)
const ES_PRIMERA_VEZ = localStorage.getItem(CLAVE_ALMACEN) === null;

// Copia en memoria mientras la app está abierta
let DATOS = cargar();

// Aplicar el tema cuanto antes (el <head> ya hizo un primer intento sin parpadeo)
if (typeof document !== "undefined") aplicarTema();

// Lee la libretita del navegador
function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE_ALMACEN);
    if (!texto) return datosVacios();
    // Object.assign se asegura de que existan ejercicios/rutinas/sesiones
    // aunque el guardado sea de una versión antigua.
    const cargado = Object.assign(datosVacios(), JSON.parse(texto));
    // objetos anidados: mezclamos para no perder claves nuevas
    cargado.prefs = Object.assign(datosVacios().prefs, cargado.prefs || {});
    cargado.temporizador = Object.assign(datosVacios().temporizador, cargado.temporizador || {});
    return cargado;
  } catch (e) {
    console.error("No se pudieron leer los datos; empiezo de cero.", e);
    return datosVacios();
  }
}

// Tras "Borrar todos mis datos" el almacén queda como recién instalado. Si algo
// guardara antes de que la página se recargue, la clave volvería a existir y al
// recargar ES_PRIMERA_VEZ sería false: no volverían las rutinas iniciales y te
// quedarías sin biblioteca de ejercicios. Por eso bloqueamos el guardado hasta
// la recarga.
let _borradoEsperandoRecarga = false;

// Cuántas veces seguidas ha fallado el guardado (para avisar solo la primera).
let _fallosSeguidosAlGuardar = 0;

// Escribe la libretita del navegador. Devuelve true si lo consiguió.
// Si el almacenamiento está lleno o bloqueado NO revienta la app: avisa una vez
// y sigue funcionando en memoria (los datos siguen ahí hasta cerrar la app).
function guardar() {
  cancelarGuardadoAplazado(); // un guardado explicito deja sin sentido al que espera
  if (_borradoEsperandoRecarga) return false;
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(DATOS));
    _fallosSeguidosAlGuardar = 0;
    return true;
  } catch (e) {
    _fallosSeguidosAlGuardar++;
    console.error("No se pudieron guardar los datos.", e);
    if (_fallosSeguidosAlGuardar === 1 && typeof avisar === "function") {
      avisar(
        "No se han podido guardar los cambios: el almacenamiento del navegador está lleno. " +
        "Exporta una copia desde Ajustes y borra entrenamientos antiguos del Historial."
      );
    }
    return false;
  }
}

// Deja los datos a cero. Lo usa la página de pruebas antes de cada prueba.
function _reiniciarDatos() {
  _borradoEsperandoRecarga = false;
  _fallosSeguidosAlGuardar = 0;
  DATOS = datosVacios();
  guardar();
}

// Borra TODO (rutinas, ejercicios, historial, entreno en curso). Botón en Ajustes.
// Deja el almacenamiento como recién instalado: al recargar se vuelven a cargar
// las rutinas iniciales.
function borrarTodosLosDatos() {
  cancelarGuardadoAplazado();
  DATOS = datosVacios();
  _borradoEsperandoRecarga = true; // que nada lo vuelva a crear antes de recargar
  try {
    localStorage.removeItem(CLAVE_ALMACEN);
    // El temporizador guarda aparte: "borrar todos mis datos" también lo incluye.
    localStorage.removeItem(CLAVE_TEMA);
    if (typeof CLAVE_TIEMPO === "string") localStorage.removeItem(CLAVE_TIEMPO);
  } catch (e) {
    console.error("No se pudo borrar el almacenamiento.", e);
  }
}

// ---- Preferencias (opciones de Ajustes) ----

function obtenerPref(clave) {
  return DATOS.prefs[clave];
}

function guardarPref(clave, valor) {
  DATOS.prefs[clave] = valor;
  guardar();
}

// ---- Tema claro / oscuro ----

// "claro" u "oscuro" según la preferencia (resolviendo "sistema")
function temaEfectivo() {
  const t = DATOS.prefs.tema || "sistema";
  if (t !== "sistema") return t;
  const claro = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-color-scheme: light)").matches;
  return claro ? "claro" : "oscuro";
}

function aplicarTema() {
  document.documentElement.dataset.tema = temaEfectivo();
  try {
    localStorage.setItem(CLAVE_TEMA, DATOS.prefs.tema || "sistema");
  } catch (e) { /* si no se puede, el <head> tira del almacen grande */ }
}

// ---- Exportar / importar copia ----

const CLAVES_EXPORTABLES = ["ejercicios", "rutinas", "sesiones", "prefs", "temporizador"];

// Devuelve el texto JSON de la copia (todo menos lo interno y el entreno en curso)
function exportarDatos() {
  const salida = { version: "gym.datos.v1", exportado: new Date().toISOString() };
  CLAVES_EXPORTABLES.forEach((clave) => { salida[clave] = DATOS[clave]; });
  return JSON.stringify(salida, null, 2);
}

// Revisa por encima que los elementos tengan la forma esperada.
// Devuelve un texto con el problema, o null si todo bien.
function _revisarFormaDeCopia(obj) {
  const esTexto = (v) => typeof v === "string";
  if (!obj.ejercicios.every((e) => e && esTexto(e.id) && esTexto(e.nombre))) {
    return "La copia tiene ejercicios con un formato que no reconozco.";
  }
  if (!obj.rutinas.every((r) => r && esTexto(r.id) && esTexto(r.nombre) && Array.isArray(r.items))) {
    return "La copia tiene rutinas con un formato que no reconozco.";
  }
  if (!obj.sesiones.every((s) => s && esTexto(s.id) && esTexto(s.fecha) && Array.isArray(s.sets))) {
    return "La copia tiene entrenamientos con un formato que no reconozco.";
  }
  return null;
}

// Reemplaza TODOS los datos con los de una copia. { ok } o { ok:false, error }
function importarDatos(texto) {
  let obj;
  try {
    obj = JSON.parse(texto);
  } catch (e) {
    return { ok: false, error: "El archivo no es un JSON válido." };
  }
  const valido = obj && typeof obj === "object"
    && Array.isArray(obj.ejercicios)
    && Array.isArray(obj.rutinas)
    && Array.isArray(obj.sesiones);
  if (!valido) {
    return { ok: false, error: "El archivo no parece una copia de Gymbe." };
  }

  // No basta con que existan las tres listas: si el contenido tiene otra forma,
  // la app se rompe DESPUES, al pintar, y sin saber por que.
  const problema = _revisarFormaDeCopia(obj);
  if (problema) return { ok: false, error: problema };

  const nuevos = datosVacios();
  CLAVES_EXPORTABLES.forEach((clave) => {
    if (obj[clave] !== undefined) nuevos[clave] = obj[clave];
  });
  nuevos.prefs = Object.assign(datosVacios().prefs, nuevos.prefs || {});
  nuevos.temporizador = Object.assign(datosVacios().temporizador, nuevos.temporizador || {});

  DATOS = nuevos;
  if (typeof invalidarIndiceSets === "function") invalidarIndiceSets();
  guardar();
  if (typeof document !== "undefined") aplicarTema(); // refresca el espejo del tema
  return { ok: true };
}

// ---- Formato de tiempo ----

// Etiqueta del ejercicio para el temporizador: "Press banca · 8-12 reps · 60 kg".
// Devuelve "" si no viene ejercicio (temporizador usado suelto).
// ---- Temporizador de series ----

// ----------------------------------------------------------
//  Ejercicios
// ----------------------------------------------------------

// ----------------------------------------------------------
//  Rutinas
// ----------------------------------------------------------

// ----------------------------------------------------------
//  Ejercicios dentro de una rutina (items)
//  Cada item: { exerciseId, series, reps, peso, descansoSeg, nota }
//  - series / descansoSeg: números enteros
//  - peso: número (kg), admite decimales
//  - reps: texto corto, "10" o un rango "8-12"
// ----------------------------------------------------------

// ----------------------------------------------------------
//  Entrenamientos
//  - sesionActiva: el que se está haciendo ahora (se puede cerrar la app y seguir)
//  - sesiones: los ya terminados, con su fecha
// ----------------------------------------------------------
