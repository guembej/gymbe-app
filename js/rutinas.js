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
let detalleModoEdicion = false;  // detalle: false = ver + Empezar; true = editar ejercicios

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
        <div class="tarjeta-encabezado">
          <span class="tarjeta-titulo">${escaparHtml(rutina.nombre)}</span>
          ${htmlEtiquetaDivision(rutina.division)}
        </div>
        <span class="tarjeta-nota">${numEjercicios === 1 ? "1 ejercicio" : numEjercicios + " ejercicios"}</span>
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
  detalleModoEdicion = false; // siempre se abre en modo "ver + Empezar"
  panelLista.classList.add("oculta");
  document.getElementById("entrenar-activo").classList.add("oculta");
  panelDetalle.classList.remove("oculta");
  pintarDetalle();
  if (typeof actualizarBarraEntreno === "function") actualizarBarraEntreno();
}

function volverALista() {
  rutinaAbiertaId = null;
  detalleModoEdicion = false;
  panelDetalle.classList.add("oculta");
  panelLista.classList.remove("oculta");
  pintarRutinas();
  if (typeof actualizarBarraEntreno === "function") actualizarBarraEntreno();
}

document.getElementById("btn-volver-rutinas").addEventListener("click", volverALista);

// Enlace "Editar rutina" / "‹ Listo": entra y sale del modo edición
document.getElementById("btn-editar-rutina").addEventListener("click", () => {
  detalleModoEdicion = true;
  pintarDetalle();
});
document.getElementById("btn-fin-editar").addEventListener("click", () => {
  detalleModoEdicion = false;
  pintarDetalle();
});

// ✏️ (solo en modo edición): cambiar nombre / división
document.getElementById("btn-editar-datos-rutina").addEventListener("click", () => {
  const rutina = obtenerRutina(rutinaAbiertaId);
  if (rutina) abrirFormRutina(rutina);
});

document.getElementById("btn-borrar-rutina").addEventListener("click", async () => {
  const rutina = obtenerRutina(rutinaAbiertaId);
  if (rutina && await confirmar(`¿Borrar la rutina "${rutina.nombre}"?`, { aceptar: "Borrar", peligro: true })) {
    borrarRutina(rutina.id);
    volverALista();
  }
});

document.getElementById("btn-anadir-item").addEventListener("click", () => abrirFormItem(null));

// "Empezar entrenamiento" desde el detalle de la rutina
document.getElementById("btn-empezar-entreno").addEventListener("click", empezarDesdeDetalle);

async function empezarDesdeDetalle() {
  const rutina = obtenerRutina(rutinaAbiertaId);
  if (!rutina || rutina.items.length === 0) return;

  const rel = conflictoDeSesion(sesionActiva(), rutina.id);
  if (rel === "otra") {
    const ok = await confirmar(
      `Ya tienes un entreno en curso de «${sesionActiva().routineNombre}». ¿Descartarlo y empezar «${rutina.nombre}»?`,
      { aceptar: "Descartar y empezar", peligro: true }
    );
    if (!ok) return;
    descartarSesionActiva();
  }
  if (!sesionActiva()) empezarSesion(rutina.id);
  mostrarPanelEntreno();
}

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

  panelDetalle.classList.toggle("modo-edicion", detalleModoEdicion);

  detalleNombreEl.textContent = rutina.nombre;
  detalleDivisionEl.textContent = rutina.division;
  detalleDivisionEl.dataset.division = rutina.division || "";
  detalleDivisionEl.hidden = !rutina.division;

  const btnEmpezar = document.getElementById("btn-empezar-entreno");
  btnEmpezar.disabled = rutina.items.length === 0;
  btnEmpezar.title = rutina.items.length === 0 ? "Añade ejercicios a la rutina primero" : "";

  listaItemsEl.innerHTML = "";

  if (rutina.items.length === 0) {
    listaItemsEl.innerHTML = detalleModoEdicion
      ? '<li class="vacio">Esta rutina no tiene ejercicios todavía.</li>'
      : '<li class="vacio">Esta rutina no tiene ejercicios.<br />Pulsa ✏️ (arriba) para añadirlos.</li>';
    return;
  }

  rutina.items.forEach((item, indice) => {
    const ejercicio = obtenerEjercicio(item.exerciseId);
    const nombre = ejercicio ? ejercicio.nombre : "(ejercicio eliminado)";
    const resumen = [
      `${item.series} ${item.series === 1 ? "serie" : "series"}`,
      item.reps ? `${item.reps} reps` : null,
      item.peso > 0 ? `${item.peso} kg` : null,
    ].filter(Boolean).join(" · ");

    const li = document.createElement("li");
    li.className = "tarjeta item-rutina";

    if (detalleModoEdicion) {
      li.innerHTML = `
        <span class="item-num">${indice + 1}</span>
        <div class="item-contenido">
          <div class="item-fila-top">
            <span class="tarjeta-titulo">${escaparHtml(nombre)}</span>
            <div class="tarjeta-acciones">
              <button class="icono-boton" data-accion="editar" title="Editar">✏️</button>
              <button class="icono-boton" data-accion="borrar" title="Quitar">🗑️</button>
            </div>
          </div>
          <span class="tarjeta-nota">${escaparHtml(resumen)}</span>
        </div>
      `;
      li.querySelector('[data-accion="editar"]').addEventListener("click", () => abrirFormItem(indice));
      li.querySelector('[data-accion="borrar"]').addEventListener("click", async () => {
        if (await confirmar(`¿Quitar "${nombre}" de la rutina?`, { aceptar: "Quitar", peligro: true })) {
          quitarItemRutina(rutinaAbiertaId, indice);
          pintarDetalle();
        }
      });
      li.addEventListener("pointerdown", (e) => alPunteroAbajoItem(e, li, indice));
    } else {
      // Modo "ver": solo lectura + la mejor marca del último día
      const ultima = mejorSerieUltimoDia(item.exerciseId);
      const ultimaTexto = ultima
        ? `última: ${String(ultima.peso).replace(".", ",")} kg × ${ultima.reps || "—"}`
        : "";
      li.innerHTML = `
        <span class="item-num">${indice + 1}</span>
        <div class="item-contenido">
          <span class="tarjeta-titulo">${escaparHtml(nombre)}</span>
          <span class="tarjeta-nota">${escaparHtml(resumen)}</span>
          ${ultimaTexto ? `<span class="ultima-vez">${escaparHtml(ultimaTexto)}</span>` : ""}
        </div>
      `;
    }

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
    avisar("Primero crea algún ejercicio en la pestaña «Ejercicios».");
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
//  Reordenar ejercicios arrastrando (pulsación larga)
//  Sin librerías: con eventos de puntero (funciona con dedo y con ratón).
//   - pulsas y mantienes ~350 ms  -> el ejercicio se "levanta" y sigue al dedo
//   - si mueves antes de ese tiempo -> es un scroll, no se activa
//   - al soltar, se guarda el nuevo orden
// ==========================================================

let _arrastre = null;
const RETARDO_ARRASTRE = 350; // ms de pulsación larga
const MARGEN_SCROLL = 10;     // px de movimiento que cancelan la pulsación larga

function alPunteroAbajoItem(e, li, indice) {
  if (!detalleModoEdicion || _arrastre) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (e.target.closest("button")) return; // ✏️ / 🗑️ no arrastran

  const inicioX = e.clientX;
  const inicioY = e.clientY;
  const pointerId = e.pointerId;
  let cancelado = false;

  const alMover = (ev) => {
    if (_arrastre) return;
    if (Math.hypot(ev.clientX - inicioX, ev.clientY - inicioY) > MARGEN_SCROLL) limpiar();
  };
  const limpiar = () => {
    if (cancelado) return;
    cancelado = true;
    clearTimeout(temporizador);
    document.removeEventListener("pointermove", alMover);
    document.removeEventListener("pointerup", limpiar);
    document.removeEventListener("pointercancel", limpiar);
  };

  const temporizador = setTimeout(() => {
    limpiar();
    iniciarArrastre(li, indice, inicioY, pointerId);
  }, RETARDO_ARRASTRE);

  document.addEventListener("pointermove", alMover);
  document.addEventListener("pointerup", limpiar);
  document.addEventListener("pointercancel", limpiar);
}

function iniciarArrastre(li, indice, clientY, pointerId) {
  const rect = li.getBoundingClientRect();
  _arrastre = {
    li,
    lista: li.parentElement,
    indiceOrigen: indice,
    agarreY: clientY - rect.top, // dónde agarró el dedo dentro de la tarjeta
    despl: 0,
    pointerId,
  };

  try { navigator.vibrate && navigator.vibrate(15); } catch (er) { /* nada */ }
  try { li.setPointerCapture(pointerId); } catch (er) { /* nada */ }
  li.classList.add("arrastrando");
  document.body.classList.add("reordenando");

  document.addEventListener("pointermove", moverArrastre);
  document.addEventListener("pointerup", soltarArrastre);
  document.addEventListener("pointercancel", soltarArrastre);
  document.addEventListener("touchmove", _prevenirScroll, { passive: false });

  pegarAlDedo(clientY);
}

function _prevenirScroll(e) { e.preventDefault(); }

// Recalcula el transform para que la tarjeta quede pegada al dedo,
// aunque su posición natural haya cambiado tras reordenar en el DOM.
function pegarAlDedo(clientY) {
  const a = _arrastre;
  const rect = a.li.getBoundingClientRect();
  const topNatural = rect.top - a.despl;
  a.despl = (clientY - a.agarreY) - topNatural;
  a.li.style.transform = `translateY(${a.despl}px)`;
}

function moverArrastre(e) {
  if (!_arrastre) return;
  const a = _arrastre;
  const y = e.clientY;

  const hermanos = [...a.lista.children].filter((el) => el !== a.li);
  for (const h of hermanos) {
    const r = h.getBoundingClientRect();
    const medio = r.top + r.height / 2;
    const despues = a.li.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING;
    if ((despues && y > medio) || (!despues && y < medio)) {
      const antes = r.top;
      a.lista.insertBefore(a.li, despues ? h.nextSibling : h);
      // FLIP: el hermano que se ha desplazado se desliza a su nuevo sitio
      const ahora = h.getBoundingClientRect().top;
      h.style.transition = "none";
      h.style.transform = `translateY(${antes - ahora}px)`;
      requestAnimationFrame(() => {
        h.style.transition = "transform 0.16s ease";
        h.style.transform = "";
      });
      break;
    }
  }
  pegarAlDedo(y);
}

function soltarArrastre() {
  const a = _arrastre;
  if (!a) return;
  _arrastre = null;

  document.removeEventListener("pointermove", moverArrastre);
  document.removeEventListener("pointerup", soltarArrastre);
  document.removeEventListener("pointercancel", soltarArrastre);
  document.removeEventListener("touchmove", _prevenirScroll);
  try { a.li.releasePointerCapture(a.pointerId); } catch (er) { /* nada */ }

  a.li.style.transform = "";
  a.li.classList.remove("arrastrando");
  document.body.classList.remove("reordenando");

  const destino = [...a.lista.children].indexOf(a.li);
  if (destino >= 0 && destino !== a.indiceOrigen) {
    reordenarItem(rutinaAbiertaId, a.indiceOrigen, destino);
  }
  pintarDetalle(); // repinta con el orden guardado y listeners limpios
}

// ==========================================================
//  Refresco general
// ==========================================================

function refrescarRutinas() {
  pintarRutinas();
  if (rutinaAbiertaId) pintarDetalle();
}

// Pintar al arrancar
pintarRutinas();
