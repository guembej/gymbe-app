// ==========================================================
//  Pestaña "Ajustes"
//  Por ahora: borrar todos los datos.
//  (Exportar / importar y el tema claro/oscuro llegan en la Fase 7.)
//  Los datos de ejemplo se cargan solos la primera vez (ver js/ejemplos.js).
// ==========================================================

document.getElementById("btn-borrar-todo").addEventListener("click", () => {
  if (confirm("Esto borrará TODAS tus rutinas, ejercicios e historial. No se puede deshacer. ¿Seguro?")) {
    borrarTodosLosDatos();
    location.reload();
  }
});
