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

// ==========================================================
//  Service worker: offline + actualización automática
// ==========================================================
//
//  El service worker nuevo se activa solo (skipWaiting + clients.claim en sw.js).
//  Cuando toma el control de esta página ("controllerchange"):
//   - si NO hay un entreno a medias -> recargamos y ya estamos en la versión nueva.
//   - si SÍ lo hay -> mostramos la barra y el usuario recarga cuando termine.
//  Así la actualización nunca se queda a medias (era el bug de la barra pegada).

let _regSW = null;
let _accionActualizacionHecha = false;

// Muestra la barra "Versión nueva disponible". "Actualizar" recarga (el SW nuevo
// ya está activo a estas alturas); "✕" solo la oculta.
function mostrarAvisoVersion() {
  const barra = document.getElementById("aviso-version");
  if (!barra) return;
  barra.hidden = false;
  document.getElementById("aviso-version-actualizar").onclick = () => location.reload();
  document.getElementById("aviso-version-cerrar").onclick = () => { barra.hidden = true; };
}

// Reacción al evento "controllerchange" (el SW nuevo ha tomado el control).
function alCambiarDeVersion(habiaControlador) {
  const entorno = {
    habiaControlador: !!habiaControlador,
    hayEntrenoEnCurso: typeof sesionActiva === "function" && !!sesionActiva(),
    yaHecho: _accionActualizacionHecha,
  };
  let decision;
  try {
    decision = decidirActualizacion(entorno);
  } catch (e) {
    // Plan B autocontenido si aviso-version.js no estuviera cargado (caché mixta)
    decision = (!entorno.habiaControlador || entorno.yaHecho) ? "nada"
      : entorno.hayEntrenoEnCurso ? "avisar" : "recargar";
  }
  if (decision === "recargar") { _accionActualizacionHecha = true; location.reload(); }
  else if (decision === "avisar") { _accionActualizacionHecha = true; mostrarAvisoVersion(); }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    // Si ya había un SW controlando, un "controllerchange" = versión nueva.
    // Si no lo había, es la primera instalación: no hay que recargar.
    const habiaControlador = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      alCambiarDeVersion(habiaControlador);
    });

    try {
      _regSW = await navigator.serviceWorker.register("sw.js");
      // Por si quedó un SW viejo "esperando" de la versión anterior: darle el empujón.
      if (_regSW.waiting) _regSW.waiting.postMessage({ tipo: "actualizar" });
      _regSW.update().catch(() => {});
    } catch (e) {
      /* sin service worker (p. ej. http sin localhost): la app funciona igual */
    }
  });
}

// Botón "Buscar actualizaciones" (Ajustes) — expuesto para ajustes.js
async function buscarActualizacion() {
  if (!_regSW) _regSW = await navigator.serviceWorker.getRegistration().catch(() => null);
  if (!_regSW) {
    avisar("Las actualizaciones se comprueban solas al abrir la app instalada o desde la web.");
    return;
  }
  await _regSW.update().catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
  if (_regSW.installing || _regSW.waiting) {
    avisar("Descargando una versión nueva… la app se recargará en un momento.");
  } else {
    avisar(`Ya tienes la última versión (${APP_VERSION}).`);
  }
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
