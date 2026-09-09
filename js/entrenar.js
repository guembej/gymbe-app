// ==========================================================
//  Pestaña "Entrenar" — registrar un entrenamiento
//  La lista de rutinas y su detalle los pinta rutinas.js. Aquí gestionamos
//  el panel del entreno EN CURSO y qué panel se ve dentro de la vista "Rutinas":
//    #rutinas-lista-panel  ·  #rutina-detalle  ·  #entrenar-activo
//  El entreno en curso se guarda: puedes cerrar la app y seguir.
// ==========================================================

const panelActivo = document.getElementById("entrenar-activo");
const panelListaRutinas = document.getElementById("rutinas-lista-panel");
const panelDetalleRutina = document.getElementById("rutina-detalle");
const activoNombreEl = document.getElementById("activo-nombre");
const activoDivisionEl = document.getElementById("activo-division");
const activoFechaEl = document.getElementById("activo-fecha");
const activoEjerciciosEl = document.getElementById("activo-ejercicios");
const barraEntrenoEl = document.getElementById("barra-entreno");

// "12 mar · 18:30"
function formatearFechaHora(iso) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} · ${hora}`;
}

// Asegura que dentro de "Entrenar" se ve la sub-vista "Rutinas" (no "Ejercicios")
function irAVistaRutinas() {
  document.querySelectorAll('.seccion[data-seccion="entrenar"] .vista').forEach((v) => {
    v.classList.toggle("oculta", v.dataset.vista !== "mis-rutinas");
  });
  document.querySelectorAll('.seccion[data-seccion="entrenar"] .conmutador-boton').forEach((b) => {
    b.classList.toggle("activo", b.dataset.vista === "mis-rutinas");
  });
}

// Muestra el panel del entreno en curso (oculta lista y detalle)
function mostrarPanelEntreno() {
  if (!sesionActiva()) return renderEntrenar();
  irAVistaRutinas();
  panelListaRutinas.classList.add("oculta");
  panelDetalleRutina.classList.add("oculta");
  panelActivo.classList.remove("oculta");
  pintarSesionActiva();
  actualizarBarraEntreno();
}

// Vuelve a la lista de rutinas SIN descartar el entreno
function volverAListaDesdeEntreno() {
  panelActivo.classList.add("oculta");
  panelDetalleRutina.classList.add("oculta");
  panelListaRutinas.classList.remove("oculta");
  if (typeof pintarRutinas === "function") pintarRutinas();
  actualizarBarraEntreno();
}

// Al abrir la pestaña "Entrenar": si hay entreno en curso, su panel; si no, la lista
function renderEntrenar() {
  if (sesionActiva()) {
    mostrarPanelEntreno();
  } else {
    panelActivo.classList.add("oculta");
    panelDetalleRutina.classList.add("oculta");
    panelListaRutinas.classList.remove("oculta");
    if (typeof pintarRutinas === "function") pintarRutinas();
    actualizarBarraEntreno();
  }
}

// Barra "Entrenamiento en curso": visible si hay entreno y NO estás viéndolo
function actualizarBarraEntreno() {
  if (!barraEntrenoEl) return;
  const hay = !!sesionActiva();
  const seccion = document.querySelector(".seccion:not(.oculta)");
  const enPanelEntreno = seccion && seccion.dataset.seccion === "entrenar"
    && !panelActivo.classList.contains("oculta");
  barraEntrenoEl.classList.toggle("oculta", !hay || enPanelEntreno);
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
  reps.inputMode = "numeric"; // teclado de números en el móvil
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
  activoDivisionEl.dataset.division = sesion.division || "";
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

    const ultima = mejorSerieUltimoDia(ej.exerciseId);
    const ultimaTexto = ultima
      ? `última: ${String(ultima.peso).replace(".", ",")} kg × ${ultima.reps || "—"}`
      : "";

    const bloque = document.createElement("div");
    bloque.className = "bloque-ejercicio";
    bloque.innerHTML = `
      <h3>${escaparHtml(ej.exerciseNombre)}</h3>
      <p class="objetivo">objetivo: ${escaparHtml(objetivoTexto)}</p>
      ${ultimaTexto ? `<p class="ultima-vez">${escaparHtml(ultimaTexto)}</p>` : ""}
      <div class="serie-fila serie-cabecera">
        <span>#</span><span>Peso</span><span>Reps</span><span>✓</span><span></span>
      </div>
    `;

    ej.filas.forEach((fila, filaIndice) => {
      bloque.appendChild(crearFilaSerie(ejIndice, filaIndice, fila));
    });

    const pie = document.createElement("div");
    pie.className = "bloque-pie";

    const anadir = document.createElement("button");
    anadir.className = "boton-enlace";
    anadir.textContent = "+ serie";
    anadir.dataset.anadirFila = ejIndice;

    const temporizador = document.createElement("button");
    temporizador.className = "boton-secundario btn-temporizador";
    temporizador.textContent = "⏱ Temporizador";
    temporizador.dataset.temp = JSON.stringify({
      numSeries: obj.series,
      descansoSeg: obj.descansoSeg || 90,
      ejercicio: ej.exerciseNombre,
      reps: obj.reps,
      peso: obj.peso,
    });

    pie.append(anadir, temporizador);
    bloque.appendChild(pie);

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
    // Marcar la serie sola cuando ya tiene peso y reps (nunca la desmarca).
    if (debeMarcarSerie(fila)) {
      fila.hecha = true;
      const filaEl = el.closest(".serie-fila");
      filaEl.classList.add("serie-hecha");
      const casilla = filaEl.querySelector('input[type="checkbox"]');
      if (casilla) casilla.checked = true;
    }
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

  const temporizador = evento.target.closest("[data-temp]");
  if (temporizador) {
    configurarTemporizador(JSON.parse(temporizador.dataset.temp));
    irA("cronometro");
    return;
  }

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

document.getElementById("btn-volver-lista-entreno").addEventListener("click", volverAListaDesdeEntreno);

document.getElementById("btn-descartar").addEventListener("click", async () => {
  if (await confirmar("¿Descartar este entreno? No se guardará nada.", { aceptar: "Descartar", peligro: true })) {
    descartarSesionActiva();
    renderEntrenar();
  }
});

document.getElementById("btn-terminar").addEventListener("click", async () => {
  const sesion = sesionActiva();
  if (!sesion) return;

  const hechas = sesion.ejercicios.reduce(
    (total, ej) => total + ej.filas.filter((f) => f.hecha).length,
    0
  );

  const mensaje = hechas === 0
    ? "No has marcado ninguna serie como hecha. ¿Terminar igualmente? Se guardará el entreno sin series."
    : `Se guardarán ${hechas} ${hechas === 1 ? "serie" : "series"}. ¿Terminar?`;

  if (!(await confirmar(mensaje, { aceptar: "Terminar" }))) return;

  const guardada = terminarSesion();
  await avisar(`Entrenamiento guardado (${guardada.sets.length} ${guardada.sets.length === 1 ? "serie" : "series"}).`);
  volverAListaDesdeEntreno();
});

// ---- Arranque ----
// (irA("entrenar") en app.js ya llama a renderEntrenar; aquí solo el primer pintado)
renderEntrenar();
