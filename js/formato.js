// @ts-check
// ==========================================================
//  Formato y utilidades de texto
//  Funciones puras: no leen ni escriben los datos guardados.
// ==========================================================

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

// Etiqueta del ejercicio para el temporizador: "Press banca - 8-12 reps - 60 kg".
/**
 * @param {{ ejercicio?: string, reps?: string, peso?: number }} [datos]
 * @returns {string}
 */
function construirEtiquetaTemp({ ejercicio, reps, peso } = {}) {
  if (!ejercicio) return "";
  const partes = [ejercicio];
  if (reps) partes.push(`${reps} reps`);
  if (peso > 0) partes.push(`${peso} kg`);
  return partes.join(" · ");
}

// Pasa a minusculas y quita las tildes, para buscar sin que estorben.
// normalize("NFD") separa la letra de su tilde, y \u0300-\u036f es el rango de
// esas marcas sueltas. Se escriben como escapes a proposito: como caracteres
// literales son invisibles en el editor y se pierden si el archivo se reguarda
// con otra codificacion.
function _sinTildes(texto) {
  return (texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Convierte a número; si no vale, usa el valor por defecto. Nunca por debajo de 'min'.
function _num(valor, min, porDefecto) {
  const n = parseFloat(valor);
  if (isNaN(n)) return porDefecto;
  return n < min ? min : n;
}

// Tope de series por ejercicio (evita, p. ej., generar 999 filas al entrenar)
const MAX_SERIES = 30;
