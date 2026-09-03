// ==========================================================
//  Gym App — navegación general
// ==========================================================

// Títulos que se muestran en la cabecera según la sección
const TITULOS = {
  rutinas: "Rutinas",
  entrenar: "Entrenar",
  historial: "Historial",
  progreso: "Progreso",
  cronometro: "Tiempo",
  ajustes: "Ajustes",
};

// Cambia la sección visible (menú inferior)
function irA(nombreSeccion) {
  document.querySelectorAll(".seccion").forEach((sec) => {
    sec.classList.toggle("oculta", sec.dataset.seccion !== nombreSeccion);
  });

  document.querySelectorAll(".menu-boton").forEach((btn) => {
    btn.classList.toggle("activo", btn.dataset.ir === nombreSeccion);
  });
  document.getElementById("btn-ajustes").classList.toggle("activo", nombreSeccion === "ajustes");

  document.getElementById("titulo-seccion").textContent =
    TITULOS[nombreSeccion] || "Gym App";
}

document.querySelectorAll(".menu-boton").forEach((btn) => {
  btn.addEventListener("click", () => irA(btn.dataset.ir));
});

// Conmutador Rutinas / Ejercicios (dentro de la pestaña "Rutinas")
document.querySelectorAll(".conmutador-boton").forEach((btn) => {
  btn.addEventListener("click", () => {
    const vista = btn.dataset.vista;
    document.querySelectorAll(".conmutador-boton").forEach((b) => {
      b.classList.toggle("activo", b === btn);
    });
    document.querySelectorAll(".vista").forEach((v) => {
      v.classList.toggle("oculta", v.dataset.vista !== vista);
    });
  });
});

// Pulsar el logo Gymbe: recargar la app (vuelve al inicio y refresca todo)
document.getElementById("btn-inicio").addEventListener("click", () => {
  location.reload();
});

// Engranaje de la cabecera: ir a Ajustes
document.getElementById("btn-ajustes").addEventListener("click", () => irA("ajustes"));

// Arrancar en "Rutinas"
irA("rutinas");
