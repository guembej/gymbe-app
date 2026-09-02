// ==========================================================
//  Pestaña "Entrenar" — registrar un entrenamiento
//  - Elegir una rutina y empezar
//  - Ir marcando cada serie (peso y repes reales)
//  - El entreno en curso se guarda: puedes cerrar la app y seguir
// ==========================================================

const panelElegir = document.getElementById("entrenar-elegir");
const panelActivo = document.getElementById("entrenar-activo");
const listaEmpezarEl = document.getElementById("lista-empezar");
const activoNombreEl = document.getElementById("activo-nombre");
const activoDivisionEl = document.getElementById("activo-division");
const activoFechaEl = document.getElementById("activo-fecha");
const activoEjerciciosEl = document.getElementById("activo-ejercicios");

// "12 mar · 18:30"
function formatearFechaHora(iso) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} · ${hora}`;
}

// Muestra el panel correcto según haya o no un entreno en curso
function renderEntrenar() {
  if (sesionActiva()) {
    panelElegir.classList.add("oculta");
    panelActivo.classList.remove("oculta");
    pintarSesionActiva();
  } else {
    panelActivo.classList.add("oculta");
    panelElegir.classList.remove("oculta");
    pintarListaEmpezar();
  }
}

// ---- Elegir rutina ----

function pintarListaEmpezar() {
  const rutinas = listarRutinas();
  listaEmpezarEl.innerHTML = "";

  if (rutinas.length === 0) {
    listaEmpezarEl.innerHTML =
      '<li class="vacio">Crea una rutina en la pestaña «Rutinas».</li>';
    return;
  }

  rutinas.forEach((rutina) => {
    const n = rutina.items.length;
    const li = document.createElement("li");
    li.className = "tarjeta";
    li.innerHTML = `
      <div class="tarjeta-cuerpo">
        <div class="tarjeta-encabezado">
          <span class="tarjeta-titulo">${escaparHtml(rutina.nombre)}</span>
          ${rutina.division
            ? `<span class="etiqueta etiqueta-division">${escaparHtml(rutina.division)}</span>`
            : ""}
        </div>
        <span class="tarjeta-nota">${n === 1 ? "1 ejercicio" : n + " ejercicios"}</span>
      </div>
    `;

    const acciones = document.createElement("div");
    acciones.className = "tarjeta-acciones";
    const boton = document.createElement("button");
    boton.className = "boton-primario";
    boton.textContent = "Empezar";
    if (n === 0) {
      boton.disabled = true;
      boton.title = "Añade ejercicios a la rutina primero";
    } else {
      boton.addEventListener("click", () => {
        empezarSesion(rutina.id);
        renderEntrenar();
      });
    }
    acciones.appendChild(boton);
    li.appendChild(acciones);
    listaEmpezarEl.appendChild(li);
  });
}

// ---- Entreno en curso ----

function crearFilaSerie(ejIndice, filaIndice, fila) {
  const div = document.createElement("div");
  div.className = fila.hecha ? "serie-fila serie-hecha" : "serie-fila";

  const num = document.createElement("span");
  num.className = "serie-num";
  num.textContent = filaIndice + 1;

  const peso = document.createElement("input");
  peso.type = "number";
  peso.inputMode = "decimal";
  peso.step = "0.5";
  peso.min = "0";
  peso.value = fila.pesoReal;
  peso.dataset.ej = ejIndice;
  peso.dataset.fila = filaIndice;
  peso.dataset.campo = "pesoReal";

  const reps = document.createElement("input");
  reps.type = "text";
  reps.maxLength = 12;
  reps.value = fila.repsReal;
  reps.dataset.ej = ejIndice;
  reps.dataset.fila = filaIndice;
  reps.dataset.campo = "repsReal";

  const hecha = document.createElement("input");
  hecha.type = "checkbox";
  hecha.checked = fila.hecha;
  hecha.dataset.ej = ejIndice;
  hecha.dataset.fila = filaIndice;
  hecha.dataset.campo = "hecha";

  const quitar = document.createElement("button");
  quitar.className = "icono-boton";
  quitar.textContent = "✕";
  quitar.title = "Quitar serie";
  quitar.dataset.quitarFila = ejIndice;
  quitar.dataset.fila = filaIndice;

  div.append(num, peso, reps, hecha, quitar);
  return div;
}

function pintarSesionActiva() {
  const sesion = sesionActiva();
  if (!sesion) return renderEntrenar();

  activoNombreEl.textContent = sesion.routineNombre;
  activoDivisionEl.textContent = sesion.division;
  activoDivisionEl.hidden = !sesion.division;
  activoFechaEl.textContent = formatearFechaHora(sesion.inicio);

  activoEjerciciosEl.innerHTML = "";

  sesion.ejercicios.forEach((ej, ejIndice) => {
    const obj = ej.objetivo;
    const objetivoTexto = [
      `${obj.series} × ${obj.reps || "—"}`,
      obj.peso > 0 ? `${obj.peso} kg` : null,
      `descanso ${formatearDescanso(obj.descansoSeg)}`,
    ].filter(Boolean).join(" · ");

    const bloque = document.createElement("div");
    bloque.className = "bloque-ejercicio";
    bloque.innerHTML = `
      <h3>${escaparHtml(ej.exerciseNombre)}</h3>
      <p class="objetivo">objetivo: ${escaparHtml(objetivoTexto)}</p>
      <div class="serie-fila serie-cabecera">
        <span>#</span><span>Peso</span><span>Reps</span><span>✓</span><span></span>
      </div>
    `;

    ej.filas.forEach((fila, filaIndice) => {
      bloque.appendChild(crearFilaSerie(ejIndice, filaIndice, fila));
    });

    const anadir = document.createElement("button");
    anadir.className = "boton-enlace";
    anadir.textContent = "+ serie";
    anadir.dataset.anadirFila = ejIndice;
    bloque.appendChild(anadir);

    activoEjerciciosEl.appendChild(bloque);
  });
}

// Editar una casilla: actualiza la sesión en curso y la guarda (sin repintar)
function alEditarCasilla(evento) {
  const el = evento.target;
  if (!el.dataset.campo) return;
  const sesion = sesionActiva();
  if (!sesion) return;

  const fila = sesion.ejercicios[el.dataset.ej].filas[el.dataset.fila];
  if (el.dataset.campo === "hecha") {
    fila.hecha = el.checked;
    el.closest(".serie-fila").classList.toggle("serie-hecha", el.checked);
  } else {
    fila[el.dataset.campo] = el.value;
  }
  guardarSesionActiva();
}

// Texto y números: al escribir. Casillas de verificación: al cambiar.
// (Así no se guarda dos veces por el mismo cambio.)
activoEjerciciosEl.addEventListener("input", (evento) => {
  if (evento.target.type !== "checkbox") alEditarCasilla(evento);
});
activoEjerciciosEl.addEventListener("change", (evento) => {
  if (evento.target.type === "checkbox") alEditarCasilla(evento);
});

// Añadir / quitar series (sí repinta)
activoEjerciciosEl.addEventListener("click", (evento) => {
  const sesion = sesionActiva();
  if (!sesion) return;

  const anadir = evento.target.closest("[data-anadir-fila]");
  if (anadir) {
    const filas = sesion.ejercicios[anadir.dataset.anadirFila].filas;
    const ultima = filas[filas.length - 1] || { pesoReal: "", repsReal: "" };
    filas.push({ pesoReal: ultima.pesoReal, repsReal: ultima.repsReal, hecha: false });
    guardarSesionActiva();
    pintarSesionActiva();
    return;
  }

  const quitar = evento.target.closest("[data-quitar-fila]");
  if (quitar) {
    const filas = sesion.ejercicios[quitar.dataset.quitarFila].filas;
    filas.splice(quitar.dataset.fila, 1);
    guardarSesionActiva();
    pintarSesionActiva();
  }
});

// ---- Terminar / descartar ----

document.getElementById("btn-descartar").addEventListener("click", () => {
  if (confirm("¿Descartar este entreno? No se guardará nada.")) {
    descartarSesionActiva();
    renderEntrenar();
  }
});

document.getElementById("btn-terminar").addEventListener("click", () => {
  const sesion = sesionActiva();
  if (!sesion) return;

  const hechas = sesion.ejercicios.reduce(
    (total, ej) => total + ej.filas.filter((f) => f.hecha).length,
    0
  );

  const mensaje = hechas === 0
    ? "No has marcado ninguna serie como hecha. ¿Terminar igualmente? Se guardará el entreno sin series."
    : `Se guardarán ${hechas} ${hechas === 1 ? "serie" : "series"}. ¿Terminar?`;

  if (!confirm(mensaje)) return;

  const guardada = terminarSesion();
  alert(`Entrenamiento guardado (${guardada.sets.length} ${guardada.sets.length === 1 ? "serie" : "series"}).`);
  renderEntrenar();
});

// ---- Arranque ----

// Repintar al abrir la pestaña Entrenar (por si hay un entreno a medias)
document.querySelector('[data-ir="entrenar"]').addEventListener("click", renderEntrenar);
renderEntrenar();
