// ==========================================================
//  Pantalla de Ejercicios (dentro de la pestaña "Rutinas")
// ==========================================================

const dlgEjercicio = document.getElementById("dialogo-ejercicio");
const formEjercicio = document.getElementById("form-ejercicio");
const formEjercicioTitulo = document.getElementById("form-ejercicio-titulo");
const selectGrupo = formEjercicio.elements.grupo;
const listaEjerciciosEl = document.getElementById("lista-ejercicios");

// Guarda qué ejercicio estamos editando (null = estamos creando uno nuevo)
let editandoEjercicioId = null;

// Rellenar el desplegable de grupos musculares (una sola vez)
GRUPOS_MUSCULARES.forEach((grupo) => {
  const opcion = document.createElement("option");
  opcion.value = grupo;
  opcion.textContent = grupo;
  selectGrupo.appendChild(opcion);
});

// ---- Abrir / cerrar el formulario ----

function abrirFormEjercicio(ejercicio) {
  editandoEjercicioId = ejercicio ? ejercicio.id : null;
  formEjercicioTitulo.textContent = ejercicio ? "Editar ejercicio" : "Nuevo ejercicio";
  formEjercicio.elements.nombre.value = ejercicio ? ejercicio.nombre : "";
  formEjercicio.elements.grupo.value = ejercicio ? ejercicio.grupo : "Pecho";
  formEjercicio.elements.nota.value = ejercicio ? ejercicio.nota : "";
  dlgEjercicio.showModal();
  formEjercicio.elements.nombre.focus();
}

function cerrarFormEjercicio() {
  dlgEjercicio.close();
}

// Al cerrar el diálogo (botón, Escape o clic fuera) olvidamos qué editábamos
dlgEjercicio.addEventListener("close", () => {
  editandoEjercicioId = null;
});

// ---- Eventos del formulario ----

formEjercicio.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const valores = {
    nombre: formEjercicio.elements.nombre.value,
    grupo: formEjercicio.elements.grupo.value,
    nota: formEjercicio.elements.nota.value,
  };
  if (!valores.nombre.trim()) return;

  if (editandoEjercicioId) {
    editarEjercicio(editandoEjercicioId, valores);
  } else {
    crearEjercicio(valores);
  }

  cerrarFormEjercicio();
  pintarEjercicios();
});

document
  .getElementById("form-ejercicio-cancelar")
  .addEventListener("click", cerrarFormEjercicio);

document
  .getElementById("btn-nuevo-ejercicio")
  .addEventListener("click", () => abrirFormEjercicio(null));

// ---- Pintar la lista ----

function pintarEjercicios() {
  const ejercicios = listarEjercicios();
  listaEjerciciosEl.innerHTML = "";

  if (ejercicios.length === 0) {
    listaEjerciciosEl.innerHTML =
      '<li class="vacio">Aún no has creado ningún ejercicio.</li>';
    return;
  }

  ejercicios.forEach((ej) => {
    const li = document.createElement("li");
    li.className = "tarjeta";
    li.innerHTML = `
      <div class="tarjeta-cuerpo">
        <span class="tarjeta-titulo">${escaparHtml(ej.nombre)}</span>
        <span class="etiqueta">${escaparHtml(ej.grupo)}</span>
        ${ej.nota ? `<span class="tarjeta-nota">${escaparHtml(ej.nota)}</span>` : ""}
      </div>
      <div class="tarjeta-acciones">
        <button class="icono-boton" data-accion="editar" title="Editar">✏️</button>
        <button class="icono-boton" data-accion="borrar" title="Borrar">🗑️</button>
      </div>
    `;
    li.querySelector('[data-accion="editar"]')
      .addEventListener("click", () => abrirFormEjercicio(ej));
    li.querySelector('[data-accion="borrar"]')
      .addEventListener("click", () => {
        if (confirm(`¿Borrar el ejercicio "${ej.nombre}"?`)) {
          borrarEjercicio(ej.id);
          pintarEjercicios();
        }
      });
    listaEjerciciosEl.appendChild(li);
  });
}

// Evita que un nombre con < > & rompa el HTML de la tarjeta
function escaparHtml(texto) {
  const d = document.createElement("div");
  d.textContent = texto;
  return d.innerHTML;
}

// Pintar al arrancar
pintarEjercicios();
