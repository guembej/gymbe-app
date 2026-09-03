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

// Un color por división, para identificarlas de un vistazo
const COLOR_DIVISION = {
  "Full Body": "#a78bfa",
  "Push": "#ff5722",
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
    ejemplosHistorialHecho: false, // marca interna: ya se metió el historial de ejemplo
    prefs: {
      tema: "sistema",    // "sistema" | "claro" | "oscuro"
      cronDecimas: false, // cronómetro con décimas de segundo
      sonido: true,       // pitido al terminar el descanso
      vibracion: true,    // vibración al terminar el descanso
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

// Escribe la libretita del navegador
function guardar() {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(DATOS));
}

// Deja los datos a cero. Lo usa la página de pruebas antes de cada prueba.
function _reiniciarDatos() {
  DATOS = datosVacios();
  guardar();
}

// Borra TODO (rutinas, ejercicios, historial, entreno en curso). Botón en Ajustes.
// Deja el almacenamiento como recién instalado: al recargar se vuelven a cargar
// los datos de ejemplo.
function borrarTodosLosDatos() {
  DATOS = datosVacios();
  localStorage.removeItem(CLAVE_ALMACEN);
}

// Identificador único para cada ejercicio / rutina / sesión.
// crypto.randomUUID solo existe en contexto seguro (localhost o https); en el móvil
// por red local (http://192.168...) no está, así que hay un plan B sin colisiones.
function nuevoId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

// Evita que un texto con < > & rompa el HTML donde lo insertemos
function escaparHtml(texto) {
  const d = document.createElement("div");
  d.textContent = texto == null ? "" : String(texto);
  return d.innerHTML;
}

// HTML de la etiqueta de división (con su color). "" si no hay división.
function htmlEtiquetaDivision(division) {
  if (!division) return "";
  const d = escaparHtml(division);
  return `<span class="etiqueta etiqueta-division" data-division="${d}">${d}</span>`;
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
}

// ---- Exportar / importar copia ----

const CLAVES_EXPORTABLES = ["ejercicios", "rutinas", "sesiones", "prefs", "temporizador"];

// Devuelve el texto JSON de la copia (todo menos lo interno y el entreno en curso)
function exportarDatos() {
  const salida = { version: "gym.datos.v1", exportado: new Date().toISOString() };
  CLAVES_EXPORTABLES.forEach((clave) => { salida[clave] = DATOS[clave]; });
  return JSON.stringify(salida, null, 2);
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

  const nuevos = datosVacios();
  CLAVES_EXPORTABLES.forEach((clave) => {
    if (obj[clave] !== undefined) nuevos[clave] = obj[clave];
  });
  nuevos.prefs = Object.assign(datosVacios().prefs, nuevos.prefs || {});
  nuevos.temporizador = Object.assign(datosVacios().temporizador, nuevos.temporizador || {});

  DATOS = nuevos;
  guardar();
  return { ok: true };
}

// ---- Formato de tiempo ----

// milisegundos -> "MM:SS" (o "MM:SS.d" con décimas)
function formatearCronometro(ms, conDecimas) {
  const totalSeg = Math.floor(ms / 1000);
  const m = Math.floor(totalSeg / 60);
  const s = totalSeg % 60;
  const base = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (!conDecimas) return base;
  return `${base}.${Math.floor((ms % 1000) / 100)}`;
}

// segundos restantes -> "M:SS" (redondea hacia arriba, nunca por debajo de 0)
function formatearCuentaAtras(seg) {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// El paso "bonito" inmediatamente menor que 'paso' (de la serie 1,2,5,10,20,50...)
function _pasoBonitoMenor(paso) {
  const magnitud = Math.pow(10, Math.floor(Math.log10(paso) - 1e-9));
  const n = paso / magnitud; // ~1, 2, 5 o 10
  if (n > 5) return 5 * magnitud;
  if (n > 2) return 2 * magnitud;
  if (n > 1) return 1 * magnitud;
  return magnitud / 2; // de 1 bajaría a 0.5 (luego se limita a 1)
}

// Marcas del eje Y de una gráfica: al menos 5, todas enteras, paso de 1/2/5 x 10^k,
// cubriendo [datoMin, datoMax]. Devuelve { min, max, marcas: [...] }.
function marcasEjeY(datoMin, datoMax) {
  if (datoMin === datoMax) { datoMin -= 1; datoMax += 1; }
  const OBJETIVO = 5;

  const pasoCrudo = (datoMax - datoMin) / (OBJETIVO - 1);
  const magnitud = Math.pow(10, Math.floor(Math.log10(pasoCrudo)));
  const norm = pasoCrudo / magnitud;
  let paso = magnitud * (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10);
  paso = Math.max(1, paso);

  let min = Math.floor(datoMin / paso) * paso;
  let max = Math.ceil(datoMax / paso) * paso;

  let vueltas = 0;
  while (Math.round((max - min) / paso) + 1 < OBJETIVO && vueltas++ < 20) {
    const menor = Math.max(1, _pasoBonitoMenor(paso));
    if (menor < paso) {
      paso = menor;
    } else {
      max += paso;
      if (Math.round((max - min) / paso) + 1 < OBJETIVO) min -= paso;
    }
    min = Math.floor(min / paso) * paso;
    max = Math.ceil(max / paso) * paso;
  }

  const marcas = [];
  for (let v = min; v <= max + 1e-9; v += paso) marcas.push(Math.round(v));
  return { min, max, marcas };
}

// Índices a etiquetar en un eje X de 'n' puntos: todos si son pocos; si no,
// unos cuantos repartidos de forma pareja, siempre con el primero y el último.
function indicesEtiquetasX(n, maximo) {
  if (n <= maximo) return [...Array(n).keys()];
  const idx = new Set([0, n - 1]);
  const paso = (n - 1) / (maximo - 1);
  for (let j = 1; j < maximo - 1; j++) idx.add(Math.round(j * paso));
  return [...idx].sort((a, b) => a - b);
}

// ---- Temporizador de series ----

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

// Tope de series por ejercicio (evita, p. ej., generar 999 filas al entrenar)
const MAX_SERIES = 30;

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

function obtenerSesion(id) {
  return DATOS.sesiones.find((s) => s.id === id) || null;
}

function borrarSesion(id) {
  DATOS.sesiones = DATOS.sesiones.filter((s) => s.id !== id);
  guardar();
}

// ----------------------------------------------------------
//  Progreso: evolución de un ejercicio a lo largo del historial
//  Devuelve un punto por sesión (orden: de más antigua a más reciente):
//    { fecha, sesionId, pesoMax, volumen, rm }
//  - pesoMax: el peso más alto levantado ese día
//  - volumen: suma de peso x repeticiones
//  - rm: 1RM estimado (Epley) de la mejor serie: peso x (1 + reps/30)
// ----------------------------------------------------------
function progresoDeEjercicio(exerciseId) {
  const puntos = [];

  DATOS.sesiones.forEach((sesion) => {
    const sets = sesion.sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length === 0) return;

    let pesoMax = 0;
    let volumen = 0;
    let rm = 0;
    sets.forEach((set) => {
      const peso = _num(set.pesoReal, 0, 0);
      const reps = parseInt(set.repsReal, 10) || 0;
      if (peso > pesoMax) pesoMax = peso;
      volumen += peso * reps;
      const rmSet = reps > 0 ? peso * (1 + reps / 30) : peso;
      if (rmSet > rm) rm = rmSet;
    });

    puntos.push({
      fecha: sesion.fecha,
      sesionId: sesion.id,
      pesoMax: Math.round(pesoMax * 10) / 10,
      volumen: Math.round(volumen),
      rm: Math.round(rm * 10) / 10,
    });
  });

  return puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
