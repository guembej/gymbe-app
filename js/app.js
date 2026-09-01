// ==========================================================
//  Gym App — lógica principal
//  Fase 1: navegación entre secciones
// ==========================================================

// Títulos que se muestran en la cabecera según la sección
const TITULOS = {
  rutinas: "Rutinas",
  entrenar: "Entrenar",
  progreso: "Progreso",
  cronometro: "Cronómetro y descanso",
  ajustes: "Ajustes",
};

// Cambia la sección visible
function irA(nombreSeccion) {
  // Mostrar solo la sección elegida
  document.querySelectorAll(".seccion").forEach((sec) => {
    const esLaElegida = sec.dataset.seccion === nombreSeccion;
    sec.classList.toggle("oculta", !esLaElegida);
  });

  // Marcar el botón activo en el menú
  document.querySelectorAll(".menu-boton").forEach((btn) => {
    btn.classList.toggle("activo", btn.dataset.ir === nombreSeccion);
  });

  // Actualizar el título de la cabecera
  document.getElementById("titulo-seccion").textContent =
    TITULOS[nombreSeccion] || "Gym App";
}

// Conectar cada botón del menú con su sección
document.querySelectorAll(".menu-boton").forEach((btn) => {
  btn.addEventListener("click", () => irA(btn.dataset.ir));
});

// Arrancar en "Rutinas"
irA("rutinas");
