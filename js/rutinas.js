// ==========================================================
//  Pantalla de Rutinas (dentro de la pestaña "Rutinas")
//  - Lista de rutinas: crear / editar / borrar (con su división)
//  - Detalle de una rutina: añadir / editar / mover / quitar ejercicios
// ==========================================================

// ---- Referencias al HTML ----
const dlgRutina = document.getElementById("dialogo-rutina");
const formRutina = document.getElementById("form-rutina");
const formRutinaTitulo = document.getElementById("form-rutina-titulo");
const selectDivision = formRutina.elements.division;
const listaRutinasEl = document.getElementById("lista-rutinas");

const panelLista = document.getElementById("rutinas-lista-panel");
const panelDetalle = document.getElementById("rutina-detalle");
const detalleNombreEl = document.getElementById("detalle-nombre");
const detalleDivisionEl = document.getElementById("detalle-division");
const listaItemsEl = document.getElementById("lista-items");

const dlgItem = document.getElementById("dialogo-item");
const formItem = document.getElementById("form-item");
const formItemTitulo = document.getElementById("form-item-titulo");
const selectEjercicioItem = formItem.elements.exerciseId;

// ---- Estado de la pantalla ----
let editandoRutinaId = null;     // en el diálogo de rutina: null = creando
let rutinaAbiertaId = null;      // rutina cuyo detalle se está viendo (null = lista)
let editandoItemIndice = null;   // en el diálogo de item: null = añadiendo

// Rellenar el desplegable de divisiones (una sola vez)
const opcionSinDivision = document.createElement("option");
opcionSinDivision.value = "";
opcionSinDivision.textContent = "Sin división";
selectDivision.appendChild(opcionSinDivision);
DIVISIONES.forEach((division) => {
  const opcion = document.createElement("option");
  opcion.value = division;
  opcion.textContent = division;
  selectDivision.appendChild(opcion);
});

// ==========================================================
//  Lista de rutinas
// ==========================================================

function abrirFormRutina(rutina) {
  editandoRutinaId = rutina ? rutina.id : null;
  formRutinaTitulo.textContent = rutina ? "Editar rutina" : "Nueva rutina";
  formRutina.elements.nombre.value = rutina ? rutina.nombre : "";
  formRutina.elements.division.value = rutina ? rutina.division : "";
  dlgRutina.showModal();
  formRutina.elements.nombre.focus();
}

dlgRutina.addEventListener("close", () => {
  editandoRutinaId = null;
});

formRutina.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const valores = {
    nombre: formRutina.elements.nombre.value,
    division: formRutina.elements.division.value,
  };
  if (!valores.nombre.trim()) return;

  if (editandoRutinaId) {
    editarRutina(editandoRutinaId, valores);
  } else {
    crearRutina(valores);
  }
  dlgRutina.close();
  refrescarRutinas();
});

document
  .getElementById("form-rutina-cancelar")
  .addEventListener("click", () => dlgRutina.close());

document
  .getElementById("btn-nueva-rutina")
  .addEventListener("click", () => abrirFormRutina(null));

function pintarRutinas() {
  const rutinas = listarRutinas();
  listaRutinasEl.innerHTML = "";

  if (rutinas.length === 0) {
    listaRutinasEl.innerHTML =
      '<li class="vacio">Aún no has creado ninguna rutina.</li>';
    return;
  }

  rutinas.forEach((rutina) => {
    const numEjercicios = rutina.items.length;
    const li = document.createElement("li");
    li.className = "tarjeta tarjeta-pulsable";
    li.innerHTML = `
      <div class="tarjeta-cuerpo">
        <span class="tarjeta-titulo">${escaparHtml(rutina.nombre)}</span>
        ${rutina.division
          ? `<span class="etiqueta etiqueta-division">${escaparHtml(rutina.division)}</span>`
          : ""}
        <span class="tarjeta-nota">
          ${numEjercicios === 1 ? "1 ejercicio" : numEjercicios + " ejercicios"}
        </span>
      </div>
      <div class="tarjeta-acciones">
        <span class="chevron">›</span>
      </div>
    `;
    li.querySelector(".tarjeta-cuerpo").addEventListener("click", () => abrirDetalle(rutina.id));
    li.querySelector(".chevron").addEventListener("click", () => abrirDetalle(rutina.id));
    listaRutinasEl.appendChild(li);
  });
}

// ==========================================================
//  Detalle de una rutina
// ==========================================================

function abrirDetalle(rutinaId) {
  rutinaAbiertaId = rutinaId;
  panelLista.classList.add("oculta");
  panelDetalle.classList.remove("oculta");
  pintarDetalle();
}

function volverALista() {
  rutinaAbiertaId = null;
  panelDetalle.classList.add("oculta");
  panelLista.classList.remove("oculta");
  pintarRutinas();
}

document.getElementById("btn-volver-rutinas").addEventListener("click", volverALista);

document.getElementById("btn-editar-rutina").addEventListener("click", () => {
  const rutina = obtenerRutina(rutinaAbiertaId);
  if (rutina) abrirFormRutina(rutina);
});

document.getElementById("btn-borrar-rutina").addEventListener("click", () => {
  const rutina = obtenerRutina(rutinaAbiertaId);
  if (rutina && confirm(`¿Borrar la rutina "${rutina.nombre}"?`)) {
    borrarRutina(rutina.id);
    volverALista();
  }
});

document.getElementById("btn-anadir-item").addEventListener("click", () => abrirFormItem(null));

// Muestra "90 s", "2 min", "2:30" o "sin descanso"
function formatearDescanso(segundos) {
  if (!segundos) return "sin descanso";
  if (segundos < 60) return segundos + " s";
  const min = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return resto === 0 ? `${min} min` : `${min}:${String(resto).padStart(2, "0")} min`;
}

function pintarDetalle() {
  const rutina = obtenerRutina(rutinaAbiertaId);
  if (!rutina) return volverALista();

  detalleNombreEl.textContent = rutina.nombre;
  detalleDivisionEl.textContent = rutina.division;
  detalleDivisionEl.hidden = !rutina.division;

  listaItemsEl.innerHTML = "";

  if (rutina.items.length === 0) {
    listaItemsEl.innerHTML =
      '<li class="vacio">Esta rutina no tiene ejercicios todavía.</li>';
    return;
  }

  rutina.items.forEach((item, indice) => {
    const ejercicio = obtenerEjercicio(item.exerciseId);
    const nombre = ejercicio ? ejercicio.nombre : "(ejercicio eliminado)";
    const resumen = [
      `${item.series} ${item.series === 1 ? "serie" : "series"}`,
      item.reps ? `${item.reps} reps` : null,
      item.peso > 0 ? `${item.peso} kg` : null,
      `descanso ${formatearDescanso(item.descansoSeg)}`,
    ].filter(Boolean).join(" · ");

    const li = document.createElement("li");
    li.className = "tarjeta";
    li.innerHTML = `
      <div class="tarjeta-cuerpo">
        <span class="tarjeta-titulo">${escaparHtml(nombre)}</span>
        <span class="tarjeta-nota">${escaparHtml(resumen)}</span>
        ${item.nota ? `<span class="tarjeta-nota">📝 ${escaparHtml(item.nota)}</span>` : ""}
      </div>
      <div class="tarjeta-acciones">
        <button class="icono-boton" data-accion="subir" title="Subir">▲</button>
        <button class="icono-boton" data-accion="bajar" title="Bajar">▼</button>
        <button class="icono-boton" data-accion="editar" title="Editar">✏️</button>
        <button class="icono-boton" data-accion="borrar" title="Quitar">🗑️</button>
      </div>
    `;
    li.querySelector('[data-accion="subir"]').addEventListener("click", () => {
      moverItemRutina(rutinaAbiertaId, indice, -1);
      pintarDetalle();
    });
    li.querySelector('[data-accion="bajar"]').addEventListener("click", () => {
      moverItemRutina(rutinaAbiertaId, indice, 1);
      pintarDetalle();
    });
    li.querySelector('[data-accion="editar"]').addEventListener("click", () => abrirFormItem(indice));
    li.querySelector('[data-accion="borrar"]').addEventListener("click", () => {
      if (confirm(`¿Quitar "${nombre}" de la rutina?`)) {
        quitarItemRutina(rutinaAbiertaId, indice);
        pintarDetalle();
      }
    });
    listaItemsEl.appendChild(li);
  });
}

// ==========================================================
//  Diálogo de item (ejercicio dentro de una rutina)
// ==========================================================

function rellenarSelectEjercicios(idSeleccionado) {
  selectEjercicioItem.innerHTML = "";
  const ejercicios = listarEjercicios();

  ejercicios.forEach((ej) => {
    const opcion = document.createElement("option");
    opcion.value = ej.id;
    opcion.textContent = `${ej.nombre} (${ej.grupo})`;
    selectEjercicioItem.appendChild(opcion);
  });

  // Si el ejercicio guardado ya no existe, añadimos una opción para no perderlo
  if (idSeleccionado && !obtenerEjercicio(idSeleccionado)) {
    const opcion = document.createElement("option");
    opcion.value = idSeleccionado;
    opcion.textContent = "(ejercicio eliminado)";
    selectEjercicioItem.appendChild(opcion);
  }

  if (idSeleccionado) selectEjercicioItem.value = idSeleccionado;
}

function abrirFormItem(indice) {
  if (listarEjercicios().length === 0) {
    alert("Primero crea algún ejercicio en la pestaña «Ejercicios».");
    return;
  }

  editandoItemIndice = indice;
  const rutina = obtenerRutina(rutinaAbiertaId);
  const item = indice != null ? rutina.items[indice] : null;

  formItemTitulo.textContent = item ? "Editar ejercicio" : "Añadir ejercicio";
  rellenarSelectEjercicios(item ? item.exerciseId : null);
  formItem.elements.series.value = item ? item.series : 3;
  formItem.elements.reps.value = item ? item.reps : "";
  formItem.elements.peso.value = item ? item.peso : 0;
  formItem.elements.descansoSeg.value = item ? item.descansoSeg : 90;
  formItem.elements.nota.value = item ? item.nota : "";

  dlgItem.showModal();
}

dlgItem.addEventListener("close", () => {
  editandoItemIndice = null;
});

// Botones rápidos de descanso
document.getElementById("chips-descanso").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-seg]");
  if (!boton) return;
  formItem.elements.descansoSeg.value = boton.dataset.seg;
});

formItem.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const valores = {
    exerciseId: formItem.elements.exerciseId.value,
    series: formItem.elements.series.value,
    reps: formItem.elements.reps.value,
    peso: formItem.elements.peso.value,
    descansoSeg: formItem.elements.descansoSeg.value,
    nota: formItem.elements.nota.value,
  };
  if (!valores.exerciseId) return;

  if (editandoItemIndice != null) {
    editarItemRutina(rutinaAbiertaId, editandoItemIndice, valores);
  } else {
    añadirItemRutina(rutinaAbiertaId, valores);
  }
  dlgItem.close();
  pintarDetalle();
});

document
  .getElementById("form-item-cancelar")
  .addEventListener("click", () => dlgItem.close());

// ==========================================================
//  Refresco general
// ==========================================================

function refrescarRutinas() {
  pintarRutinas();
  if (rutinaAbiertaId) pintarDetalle();
}

// Pintar al arrancar
pintarRutinas();
