// ==========================================================
//  Pantalla de Rutinas (dentro de la pestaña "Rutinas")
//  Paso 2a: crear / editar / borrar rutinas con su división.
//  (Añadir ejercicios a una rutina llega en el paso siguiente.)
// ==========================================================

const dlgRutina = document.getElementById("dialogo-rutina");
const formRutina = document.getElementById("form-rutina");
const formRutinaTitulo = document.getElementById("form-rutina-titulo");
const selectDivision = formRutina.elements.division;
const listaRutinasEl = document.getElementById("lista-rutinas");

// null = estamos creando; con id = estamos editando esa rutina
let editandoRutinaId = null;

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

// ---- Abrir / cerrar el formulario ----

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

// ---- Eventos del formulario ----

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
  pintarRutinas();
});

document
  .getElementById("form-rutina-cancelar")
  .addEventListener("click", () => dlgRutina.close());

document
  .getElementById("btn-nueva-rutina")
  .addEventListener("click", () => abrirFormRutina(null));

// ---- Pintar la lista ----

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
    li.className = "tarjeta";
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
        <button class="icono-boton" data-accion="editar" title="Editar">✏️</button>
        <button class="icono-boton" data-accion="borrar" title="Borrar">🗑️</button>
      </div>
    `;
    li.querySelector('[data-accion="editar"]')
      .addEventListener("click", () => abrirFormRutina(rutina));
    li.querySelector('[data-accion="borrar"]')
      .addEventListener("click", () => {
        if (confirm(`¿Borrar la rutina "${rutina.nombre}"?`)) {
          borrarRutina(rutina.id);
          pintarRutinas();
        }
      });
    listaRutinasEl.appendChild(li);
  });
}

// Pintar al arrancar
pintarRutinas();
