// ==========================================================
//  Buscador de ejercicios (compartido)
//  Lo usan el editor de rutinas y el cambio de ejercicio a mitad de entreno.
//  Conecta un <input> con una <ul>: escribes y van saliendo coincidencias.
// ==========================================================

/**
 * Engancha el buscador a un input y su lista.
 *  - alElegir(ejercicio): han tocado una coincidencia
 *  - alCrear(texto):      han tocado "+ Crear «...»" (si no se pasa, no se ofrece)
 *  - alEscribir():        cada tecla, antes de repintar (para limpiar lo elegido)
 *  - ocultarAlSalir:      esconder la lista al salir del campo (por defecto si).
 *      En el diálogo de cambiar ejercicio la lista ES el contenido, no un
 *      desplegable encima de un formulario, asi que ahi se queda puesta.
 *  - cuandoVacio():       qué enseñar con el campo en blanco. Sin esto, nada.
 *      El cambio de ejercicio lo usa para proponer los del mismo grupo muscular
 *      antes de escribir: cuando la máquina está ocupada no sabes el nombre del
 *      sustituto, quieres ver las opciones.
 */
function conectarBuscadorEjercicios({
  input, lista, alElegir, alCrear, alEscribir, cuandoVacio, ocultarAlSalir = true,
}) {
  function fila(texto, extra, alTocar) {
    const li = document.createElement("li");
    li.className = extra ? `sugerencia ${extra}` : "sugerencia";
    li.innerHTML = texto;
    li.addEventListener("click", alTocar);
    lista.appendChild(li);
  }

  function pintar() {
    const texto = input.value.trim();
    lista.innerHTML = "";

    if (!texto) {
      (cuandoVacio ? cuandoVacio() : []).forEach((ej) => {
        fila(
          `<span>${escaparHtml(ej.nombre)}</span>` +
          `<span class="sugerencia-grupo">${escaparHtml(ej.grupo)}</span>`,
          "", () => alElegir(ej)
        );
      });
      lista.hidden = lista.children.length === 0;
      return;
    }

    const { coincidencias, hayExacto } = filtrarEjercicios(texto);
    coincidencias.forEach((ej) => {
      fila(
        `<span>${escaparHtml(ej.nombre)}</span>` +
        `<span class="sugerencia-grupo">${escaparHtml(ej.grupo)}</span>`,
        "", () => alElegir(ej)
      );
    });
    if (!hayExacto && alCrear) {
      fila(`+ Crear «${escaparHtml(texto)}»`, "sugerencia-crear", () => alCrear(texto));
    }
    lista.hidden = lista.children.length === 0;
  }

  input.addEventListener("input", () => {
    if (alEscribir) alEscribir();
    pintar();
  });
  input.addEventListener("focus", pintar);
  // el retardo deja que el clic en una sugerencia llegue antes de ocultarla
  if (ocultarAlSalir) {
    input.addEventListener("blur", () => {
      setTimeout(() => { lista.hidden = true; }, 150);
    });
  }

  return { pintar, ocultar() { lista.hidden = true; } };
}
