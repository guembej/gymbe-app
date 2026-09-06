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
//  Service worker: offline + aviso de versión nueva
// ==========================================================

let _regSW = null;
let _usuarioPidioActualizar = false;

function mostrarAvisoVersion(swEsperando) {
  const barra = document.getElementById("aviso-version");
  if (!barra || !swEsperando) return;
  barra.hidden = false;
  document.getElementById("aviso-version-actualizar").onclick = () => {
    _usuarioPidioActualizar = true;
    swEsperando.postMessage({ tipo: "actualizar" });
  };
  document.getElementById("aviso-version-cerrar").onclick = () => { barra.hidden = true; };
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw.js");
      _regSW = reg;

      // ¿ya hay una versión nueva esperando de una visita anterior?
      if (reg.waiting && navigator.serviceWorker.controller) {
        mostrarAvisoVersion(reg.waiting);
      }

      // se detecta una versión nueva mientras la app está abierta
      reg.addEventListener("updatefound", () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener("statechange", () => {
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
            mostrarAvisoVersion(nuevo);
          }
        });
      });

      // comprobar al abrir (por si el navegador tarda en mirar)
      reg.update().catch(() => {});

      // cuando el SW nuevo toma el control tras pulsar "Actualizar" -> recargar
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (_usuarioPidioActualizar) location.reload();
      });
    } catch (e) {
      /* sin service worker (p. ej. http sin localhost): la app funciona igual */
    }
  });
}

// Botón "Buscar actualizaciones" (Ajustes) — expuesto para ajustes.js
async function buscarActualizacion() {
  if (!_regSW) {
    avisar("Las actualizaciones se comprueban solas al abrir la app instalada o desde la web.");
    return;
  }
  await _regSW.update().catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
  const hayAviso = _regSW.waiting || !document.getElementById("aviso-version").hidden;
  if (hayAviso) {
    avisar("Hay una versión nueva. Pulsa «Actualizar» en la barra de arriba.");
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
