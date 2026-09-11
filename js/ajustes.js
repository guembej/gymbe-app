// ==========================================================
//  Pestaña "Ajustes"
//  Tema, preferencias del entreno, copias (.json) y borrado total.
//  Los datos de ejemplo se cargan solos la primera vez (ver js/ejemplos.js).
// ==========================================================

// Opciones: conectar cada interruptor con su preferencia guardada.
// Por debajo siguen siendo <input type="checkbox">; lo de la pastilla es solo
// el aspecto (ver .aj-switch en styles.css), asi que esto no cambia.
function conectarPref(id, clave) {
  const el = document.getElementById(id);
  el.checked = obtenerPref(clave);
  el.addEventListener("change", () => guardarPref(clave, el.checked));
}
conectarPref("pref-crondecimas", "cronDecimas");
conectarPref("pref-sonido", "sonido");
conectarPref("pref-vibracion", "vibracion");
conectarPref("pref-registrosimple", "registroSimple");

// ---- Volumen del aviso ----
// Al elegir un nivel suena una muestra: es la única forma de decidir sin tener
// que arrancar un temporizador entero.
const botonesVolumen = document.querySelectorAll(".conmutador-volumen [data-volumen]");

function pintarBotonesVolumen() {
  const actual = obtenerPref("volumenAviso") || "alto";
  botonesVolumen.forEach((b) => b.classList.toggle("activo", b.dataset.volumen === actual));
}

botonesVolumen.forEach((boton) => {
  boton.addEventListener("click", () => {
    guardarPref("volumenAviso", boton.dataset.volumen);
    pintarBotonesVolumen();
    if (typeof sonarMuestraAviso === "function") sonarMuestraAviso();
  });
});
pintarBotonesVolumen();

// Versión + buscar actualizaciones
document.getElementById("pie-version").textContent = `versión ${APP_VERSION} · funciona sin conexión`;
document.getElementById("btn-buscar-actualizacion").addEventListener("click", () => buscarActualizacion());

// ---- Tema ----
// Es un conmutador de tres, igual que "Rutinas | Ejercicios": un toque en vez
// de apuntar a un circulito. Antes eran tres <input type="radio">.
const botonesTema = document.querySelectorAll(".conmutador-tema [data-tema]");

function pintarBotonesTema() {
  const actual = obtenerPref("tema") || "sistema";
  botonesTema.forEach((b) => b.classList.toggle("activo", b.dataset.tema === actual));
}

botonesTema.forEach((boton) => {
  boton.addEventListener("click", () => {
    guardarPref("tema", boton.dataset.tema);
    pintarBotonesTema();
    aplicarTema();
  });
});
pintarBotonesTema();
// Si está en "sistema", seguir los cambios de tema del móvil
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if ((obtenerPref("tema") || "sistema") === "sistema") aplicarTema();
  });
}

// ---- Exportar / importar copia ----

document.getElementById("btn-exportar").addEventListener("click", () => {
  const blob = new Blob([exportarDatos()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `gymbe-copia-${new Date().toISOString().slice(0, 10)}.json`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const inputImportar = document.getElementById("input-importar");
document.getElementById("btn-importar").addEventListener("click", () => inputImportar.click());

inputImportar.addEventListener("change", () => {
  const archivo = inputImportar.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = async () => {
    inputImportar.value = ""; // permitir volver a elegir el mismo archivo
    const ok = await confirmar(
      "Esto reemplazará TODOS tus datos actuales (y cualquier entrenamiento en curso) por los de la copia. ¿Continuar?",
      { aceptar: "Reemplazar", peligro: true }
    );
    if (!ok) return;

    const resultado = importarDatos(String(lector.result));
    if (!resultado.ok) {
      await avisar(resultado.error);
      return;
    }
    await avisar("Copia importada. La app se va a recargar.");
    location.reload();
  };
  lector.readAsText(archivo);
});

document.getElementById("btn-borrar-todo").addEventListener("click", async () => {
  const ok = await confirmar(
    "Esto borrará TODAS tus rutinas, ejercicios e historial. No se puede deshacer. ¿Seguro?",
    { aceptar: "Borrar todo", peligro: true }
  );
  if (ok) {
    borrarTodosLosDatos();
    location.reload();
  }
});
