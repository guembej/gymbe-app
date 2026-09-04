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

// Registrar el service worker: hace que la app funcione sin conexión.
// (Solo se activa en https o en localhost.)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// Si otra pestaña o ventana cambia los datos, ofrecer recargar
window.addEventListener("storage", async (evento) => {
  if (evento.key !== "gym.datos.v1" || evento.newValue === null) return;
  const recargar = await confirmar(
    "Los datos han cambiado en otra pestaña. ¿Recargar para ver los cambios?",
    { aceptar: "Recargar", cancelar: "Ahora no" }
  );
  if (recargar) location.reload();
});

// Ocultar la pantalla de bienvenida en cuanto la app está lista
const splash = document.getElementById("splash");
if (splash) {
  setTimeout(() => {
    splash.classList.add("oculto");
    setTimeout(() => splash.remove(), 500);
  }, 150);
}
