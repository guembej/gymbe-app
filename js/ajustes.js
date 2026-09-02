// ==========================================================
//  Pestaña "Ajustes"
//  Por ahora: borrar todos los datos.
//  (Exportar / importar y el tema claro/oscuro llegan en la Fase 7.)
//  Los datos de ejemplo se cargan solos la primera vez (ver js/ejemplos.js).
// ==========================================================

// Opciones: conectar cada casilla con su preferencia guardada
function conectarPref(id, clave) {
  const el = document.getElementById(id);
  el.checked = obtenerPref(clave);
  el.addEventListener("change", () => guardarPref(clave, el.checked));
}
conectarPref("pref-crondecimas", "cronDecimas");
conectarPref("pref-sonido", "sonido");
conectarPref("pref-vibracion", "vibracion");

document.getElementById("btn-borrar-todo").addEventListener("click", () => {
  if (confirm("Esto borrará TODAS tus rutinas, ejercicios e historial. No se puede deshacer. ¿Seguro?")) {
    borrarTodosLosDatos();
    location.reload();
  }
});
