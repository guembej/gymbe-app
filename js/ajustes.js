// ==========================================================
//  Pestaña "Ajustes"
//  Por ahora: cargar datos de ejemplo y borrar todo.
//  (Exportar / importar y el tema claro/oscuro llegan en la Fase 7.)
// ==========================================================

document.getElementById("btn-cargar-ejemplo").addEventListener("click", () => {
  const r = cargarDatosEjemplo();
  if (r.rutinasAñadidas === 0) {
    alert("Las rutinas de ejemplo ya estaban cargadas.");
    return;
  }
  alert(
    `Añadidas ${r.rutinasAñadidas} rutinas de ejemplo` +
    (r.ejerciciosAñadidos ? ` y ${r.ejerciciosAñadidos} ejercicios.` : ".")
  );
  location.reload(); // recarga para refrescar todas las pantallas
});

document.getElementById("btn-borrar-todo").addEventListener("click", () => {
  if (confirm("Esto borrará TODAS tus rutinas, ejercicios e historial. No se puede deshacer. ¿Seguro?")) {
    borrarTodosLosDatos();
    location.reload();
  }
});
