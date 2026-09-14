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

// Barra "Entrenamiento en curso": visible si hay entreno y estás en otra pantalla
// (no en el panel del entreno ni en el detalle de una rutina, que ya tiene su
// propio botón fijo "Empezar entrenamiento").
function actualizarBarraEntreno() {
  if (!barraEntrenoEl) return;
  const hay = !!sesionActiva();
  const seccion = document.querySelector(".seccion:not(.oculta)");
  const enEntrenar = seccion && seccion.dataset.seccion === "entrenar";
  const tapado = enEntrenar && (
    !panelActivo.classList.contains("oculta") ||
    !panelDetalleRutina.classList.contains("oculta")
  );
  barraEntrenoEl.classList.toggle("oculta", !hay || tapado);
}

// ---- Entreno en curso ----

function crearFilaSerie(ejIndice, filaIndice, fila, porTiempo) {
  const div = document.createElement("div");
  // "hecha" ya no es un campo que se marque: se deduce de si hay repeticiones.
  div.className = serieRegistrada(fila) ? "serie-fila serie-hecha" : "serie-fila";

  const num = document.createElement("span");
  num.className = "serie-num";
  num.textContent = filaIndice + 1;

  const peso = document.createElement("input");
  peso.type = "number";
  peso.inputMode = "decimal";
  peso.step = "0.5";
  peso.min = "0";
  peso.value = fila.pesoReal;
  // La unidad va dentro del campo en vez de en una fila de cabeceras aparte:
  // esa cabecera ocupaba tanto como los datos, sobre todo con "registro simple",
  // que deja una sola fila por ejercicio.
  peso.placeholder = "kg";
  peso.setAttribute("aria-label", `Peso de la serie ${filaIndice + 1}`);
  peso.dataset.ej = ejIndice;
  peso.dataset.fila = filaIndice;
  peso.dataset.campo = "pesoReal";

  const reps = document.createElement("input");
  reps.type = "text";
  reps.inputMode = "numeric"; // teclado de números en el móvil
  reps.maxLength = 12;
  reps.value = fila.repsReal;
  reps.placeholder = porTiempo ? "seg" : "reps";
  reps.setAttribute("aria-label",
    `${porTiempo ? "Segundos" : "Repeticiones"} de la serie ${filaIndice + 1}`);
  reps.dataset.ej = ejIndice;
  reps.dataset.fila = filaIndice;
  reps.dataset.campo = "repsReal";

  const quitar = document.createElement("button");
  quitar.className = "icono-boton quitar-serie";
  quitar.innerHTML = icono("cerrar");
  quitar.title = "Quitar serie";
  quitar.setAttribute("aria-label", `Quitar la serie ${filaIndice + 1}`);
  quitar.dataset.quitarFila = ejIndice;
  quitar.dataset.fila = filaIndice;

  div.append(num, peso, reps, quitar);
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
      `${obj.series} × ${textoObjetivo(obj.reps, ej.porTiempo) || "—"}`,
      obj.peso > 0 ? `${obj.peso} kg` : null,
    ].filter(Boolean).join(" · ");

    // El descanso se marca con el reloj en vez de la palabra "descanso". Es mas
    // corto (con la letra del sistema grande, la linea pasaba a dos) y evita una
    // ambiguedad real en los isometricos: "3 x 40 s · 1:30 min" son dos tiempos
    // seguidos y no se sabe cual es cual.
    const objetivoDescanso = obj.descansoSeg > 0
      ? ` · ${icono("tiempo")} ${escaparHtml(formatearDescanso(obj.descansoSeg))}`
      : "";

    const ultimaTexto = textoUltimaSerie(mejorSerieUltimoDia(ej.exerciseId), ej.porTiempo);

    const bloque = document.createElement("div");
    bloque.className = "bloque-ejercicio";
    // "Cambiar ejercicio" va arriba, con el nombre: es una accion sobre EL
    // EJERCICIO. Abajo quedan las dos que actuan sobre las series.
    bloque.innerHTML = `
      <div class="bloque-cabecera">
        <h3>${escaparHtml(ej.exerciseNombre)}</h3>
        <button class="icono-boton accion-ejercicio" data-cambiar="${ejIndice}"
                title="Cambiar ejercicio" aria-label="Cambiar ejercicio">
          ${icono("cambiar")}
        </button>
      </div>
      ${ej.extra ? "" : `<p class="objetivo">objetivo: ${escaparHtml(objetivoTexto)}${objetivoDescanso}</p>`}
      ${ultimaTexto ? `<p class="ultima-vez">${escaparHtml(ultimaTexto)}</p>` : ""}
    `;

    ej.filas.forEach((fila, filaIndice) => {
      bloque.appendChild(crearFilaSerie(ejIndice, filaIndice, fila, ej.porTiempo));
    });

    const pie = document.createElement("div");
    pie.className = "bloque-pie";

    const anadir = document.createElement("button");
    anadir.className = "accion-serie accion-anadir";
    anadir.innerHTML = icono("mas");
    anadir.title = "Añadir serie";
    anadir.setAttribute("aria-label", `Añadir una serie a ${ej.exerciseNombre}`);
    anadir.dataset.anadirFila = ejIndice;

    const temporizador = document.createElement("button");
    temporizador.className = "accion-serie";
    temporizador.innerHTML = icono("tiempo");
    temporizador.title = "Temporizador";
    temporizador.setAttribute("aria-label", `Temporizador para ${ej.exerciseNombre}`);
    temporizador.dataset.temp = JSON.stringify({
      numSeries: obj.series > 0 ? obj.series : null,  // los anadidos no tienen objetivo
      descansoSeg: obj.descansoSeg || 90,
      ejercicio: ej.exerciseNombre,
      reps: obj.reps,
      peso: obj.peso,
      porTiempo: ej.porTiempo,
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
  const estabaRegistrada = serieRegistrada(fila);
  fila[el.dataset.campo] = el.value;

  const ahoraRegistrada = serieRegistrada(fila);
  el.closest(".serie-fila").classList.toggle("serie-hecha", ahoraRegistrada);

  // Que una serie pase a contar (o deje de contar) es un hito: se guarda ya.
  // Mientras solo tecleas, se guarda al parar y no en cada letra.
  if (estabaRegistrada !== ahoraRegistrada) guardarSesionActiva({ inmediato: true });
  else guardarSesionActiva();
}

activoEjerciciosEl.addEventListener("input", alEditarCasilla);

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

  const cambiar = evento.target.closest("[data-cambiar]");
  if (cambiar) {
    abrirCambioEjercicio(Number(cambiar.dataset.cambiar));
    return;
  }

  const anadir = evento.target.closest("[data-anadir-fila]");
  if (anadir) {
    const filas = sesion.ejercicios[anadir.dataset.anadirFila].filas;
    const ultima = filas[filas.length - 1] || { pesoReal: "", repsReal: "" };
    filas.push({ pesoReal: ultima.pesoReal, repsReal: "" });
    guardarSesionActiva({ inmediato: true });
    pintarSesionActiva();
    return;
  }

  const quitar = evento.target.closest("[data-quitar-fila]");
  if (quitar) {
    const filas = sesion.ejercicios[quitar.dataset.quitarFila].filas;
    filas.splice(quitar.dataset.fila, 1);
    guardarSesionActiva({ inmediato: true });
    pintarSesionActiva();
  }
});

// ==========================================================
//  Elegir un ejercicio a mitad de entreno
//  Dos usos, el mismo gesto y el mismo dialogo:
//   - CAMBIAR uno ("la maquina esta ocupada, hago un equivalente")
//   - ANADIR uno suelto al final ("hoy me apetece uno mas")
//  Ninguno de los dos toca la rutina: solo cambian el entreno de HOY.
// ==========================================================

const dlgElegir = document.getElementById("dialogo-elegir");
const elegirBuscaEl = document.getElementById("elegir-busca");
const elegirTituloEl = document.getElementById("elegir-titulo");
const elegirExplicaEl = document.getElementById("elegir-explica");

let _modoElegir = "cambiar";   // "cambiar" | "anadir"
let _cambiandoIndice = null;   // solo en modo "cambiar"

// Aplica la eleccion segun el modo y deja el panel repintado
function aplicarEleccion(exerciseId) {
  const i = _modoElegir === "anadir"
    ? anadirEjercicioASesion(exerciseId)
    : cambiarEjercicioDeSesion(_cambiandoIndice, exerciseId);
  dlgElegir.close();
  if (i < 0) return;
  pintarSesionActiva();
}

// El grupo muscular con el que se crea uno al vuelo. Al CAMBIAR se hereda el del
// que sustituyes (buscas un equivalente, asi que acierta casi siempre); al
// ANADIR no hay de quien heredar, asi que se usa el de por defecto de Ajustes.
function _grupoParaCrear() {
  const sesion = sesionActiva();
  if (_modoElegir === "cambiar" && sesion && _cambiandoIndice != null) {
    const viejo = obtenerEjercicio(sesion.ejercicios[_cambiandoIndice].exerciseId);
    if (viejo) return viejo.grupo;
  }
  return obtenerPref("grupoPorDefecto") || "Otro";
}

const _buscadorElegir = conectarBuscadorEjercicios({
  input: elegirBuscaEl,
  lista: document.getElementById("elegir-sugerencias"),
  ocultarAlSalir: false,
  alElegir: (ej) => aplicarEleccion(ej.id),
  alCrear: (nombre) => {
    aplicarEleccion(crearEjercicio({ nombre, grupo: _grupoParaCrear() }).id);
  },
  // Con el campo en blanco ya se proponen ejercicios: en el gimnasio no sabes el
  // nombre del que buscas, quieres ver opciones.
  cuandoVacio: () => {
    const sesion = sesionActiva();
    if (!sesion) return [];
    return _modoElegir === "anadir"
      ? ejerciciosParaAnadir(sesion)
      : ejerciciosParecidos(sesion.ejercicios[_cambiandoIndice].exerciseId);
  },
});

function _abrirElegir(modo, titulo, explicacion) {
  _modoElegir = modo;
  elegirTituloEl.textContent = titulo;
  elegirExplicaEl.textContent = explicacion;
  elegirBuscaEl.value = "";
  dlgElegir.showModal();
  _buscadorElegir.pintar();
}

function abrirCambioEjercicio(ejIndice) {
  const sesion = sesionActiva();
  const ej = sesion && sesion.ejercicios[ejIndice];
  if (!ej) return;
  _cambiandoIndice = ejIndice;

  const hechas = ej.filas.filter(serieRegistrada).length;
  _abrirElegir("cambiar", "Cambiar ejercicio", hechas > 0
    ? `Ya has anotado ${hechas} ${hechas === 1 ? "serie" : "series"} de ` +
      `${ej.exerciseNombre}. Se quedan como están y el ejercicio nuevo se añade debajo.`
    : `Con qué sustituyes ${ej.exerciseNombre} en el entreno de hoy. Tu rutina no cambia.`);
}

function abrirAnadirEjercicio() {
  if (!sesionActiva()) return;
  _cambiandoIndice = null;
  _abrirElegir("anadir", "Añadir ejercicio",
    "Se añade al final del entreno de hoy, sin objetivo y con una serie. " +
    "Tu rutina no cambia.");
}

document.getElementById("btn-anadir-ejercicio").addEventListener("click", abrirAnadirEjercicio);
document.getElementById("elegir-cancelar").addEventListener("click", () => dlgElegir.close());
dlgElegir.addEventListener("close", () => { _cambiandoIndice = null; });

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
    (total, ej) => total + ej.filas.filter(serieRegistrada).length,
    0
  );

  // Este recuento es la red de seguridad: si hiciste 19 series y aquí pone 12,
  // es que en 7 filas faltan las repeticiones y no se van a guardar.
  const mensaje = hechas === 0
    ? "No has anotado repeticiones en ninguna serie. ¿Terminar igualmente? Se guardará el entreno sin series."
    : `Se guardarán ${hechas} ${hechas === 1 ? "serie" : "series"}. ¿Terminar?`;

  if (!(await confirmar(mensaje, { aceptar: "Terminar" }))) return;

  const guardada = terminarSesion();
  await avisar(`Entrenamiento guardado (${guardada.sets.length} ${guardada.sets.length === 1 ? "serie" : "series"}).`);
  volverAListaDesdeEntreno();
});

// ---- Arranque ----
// (irA("entrenar") en app.js ya llama a renderEntrenar; aquí solo el primer pintado)
renderEntrenar();
