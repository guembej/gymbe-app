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

// Versión + buscar actualizaciones
document.getElementById("pie-version").textContent = `versión ${APP_VERSION} · funciona sin conexión`;
document.getElementById("btn-buscar-actualizacion").addEventListener("click", () => buscarActualizacion());

// ---- Tema ----
const temaActual = obtenerPref("tema") || "sistema";
document.querySelectorAll('input[name="tema"]').forEach((radio) => {
  radio.checked = radio.value === temaActual;
  radio.addEventListener("change", () => {
    if (radio.checked) {
      guardarPref("tema", radio.value);
      aplicarTema();
    }
  });
});
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
