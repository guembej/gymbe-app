// ==========================================================
//  Pestaña "Historial" — entrenamientos ya realizados
//  - Lista del más reciente al más antiguo
//  - Detalle de una sesión (series por ejercicio)
//  - Borrar una sesión
// ==========================================================

const panelHistLista = document.getElementById("historial-lista");
const panelHistDetalle = document.getElementById("historial-detalle");
const listaSesionesEl = document.getElementById("lista-sesiones");
const sesionRutinaEl = document.getElementById("sesion-rutina");
const sesionDivisionEl = document.getElementById("sesion-division");
const sesionFechaEl = document.getElementById("sesion-fecha");
const sesionMetaEl = document.getElementById("sesion-meta");
const sesionEjerciciosEl = document.getElementById("sesion-ejercicios");

let sesionAbiertaId = null;

// ---- Formato de fechas ----

function _hora(iso) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
function _fechaCorta(iso) {
  const d = new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  return `${d} · ${_hora(iso)}`;
}
function _fechaLarga(iso) {
  const d = new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return d.charAt(0).toUpperCase() + d.slice(1) + ` · ${_hora(iso)}`;
}

// ---- Lista ----

function renderHistorial() {
  sesionAbiertaId = null;
  panelHistDetalle.classList.add("oculta");
  panelHistLista.classList.remove("oculta");
  pintarListaSesiones();
}

function pintarListaSesiones() {
  const sesiones = listarSesiones();
  listaSesionesEl.innerHTML = "";

  if (sesiones.length === 0) {
    listaSesionesEl.innerHTML =
      '<li class="vacio">Aún no has registrado ningún entrenamiento.<br />Ve a «Entrenar» para empezar.</li>';
    return;
  }

  sesiones.forEach((s) => {
    const nEjercicios = new Set(s.sets.map((x) => x.exerciseId)).size;
    const nSeries = s.sets.length;

    const li = document.createElement("li");
    li.className = "tarjeta tarjeta-pulsable";
    li.innerHTML = `
      <div class="tarjeta-cuerpo">
        <span class="tarjeta-nota">${escaparHtml(_fechaCorta(s.fecha))}</span>
        <div class="tarjeta-encabezado">
          <span class="tarjeta-titulo">${escaparHtml(s.routineNombre || "Entrenamiento")}</span>
          ${htmlEtiquetaDivision(s.division)}
        </div>
        <span class="tarjeta-nota">
          ${nEjercicios === 1 ? "1 ejercicio" : nEjercicios + " ejercicios"} ·
          ${nSeries === 1 ? "1 serie" : nSeries + " series"}
        </span>
      </div>
      <div class="tarjeta-acciones"><span class="chevron">›</span></div>
    `;
    li.querySelector(".tarjeta-cuerpo").addEventListener("click", () => abrirSesion(s.id));
    li.querySelector(".chevron").addEventListener("click", () => abrirSesion(s.id));
    listaSesionesEl.appendChild(li);
  });
}

// ---- Detalle ----

function abrirSesion(id) {
  sesionAbiertaId = id;
  panelHistLista.classList.add("oculta");
  panelHistDetalle.classList.remove("oculta");
  pintarDetalleSesion();
}

function pintarDetalleSesion() {
  const s = obtenerSesion(sesionAbiertaId);
  if (!s) return renderHistorial();

  sesionRutinaEl.textContent = s.routineNombre || "Entrenamiento";
  sesionDivisionEl.textContent = s.division || "";
  sesionDivisionEl.dataset.division = s.division || "";
  sesionDivisionEl.hidden = !s.division;
  sesionFechaEl.textContent = _fechaLarga(s.fecha);

  // Línea de resumen: duración · volumen · series
  const partes = [];
  if (s.inicio) {
    const min = Math.round((new Date(s.fecha) - new Date(s.inicio)) / 60000);
    if (min > 0 && min < 600) partes.push(`duración ${min} min`);
  }
  const volumen = s.sets.reduce(
    (total, x) => total + x.pesoReal * (parseInt(x.repsReal, 10) || 0),
    0
  );
  if (volumen > 0) partes.push(`volumen ${Math.round(volumen).toLocaleString("es-ES")} kg`);
  partes.push(s.sets.length === 1 ? "1 serie" : s.sets.length + " series");
  sesionMetaEl.textContent = partes.join(" · ");

  // Agrupar las series por ejercicio, en el orden en que aparecen
  const grupos = [];
  const indicePorEj = {};
  s.sets.forEach((set) => {
    if (indicePorEj[set.exerciseId] == null) {
      indicePorEj[set.exerciseId] = grupos.length;
      grupos.push({ nombre: set.exerciseNombre || "(ejercicio)", sets: [] });
    }
    grupos[indicePorEj[set.exerciseId]].sets.push(set);
  });

  sesionEjerciciosEl.innerHTML = "";
  grupos.forEach((g) => {
    const bloque = document.createElement("div");
    bloque.className = "bloque-ejercicio";
    bloque.innerHTML =
      `<h3>${escaparHtml(g.nombre)}</h3>` +
      g.sets.map((set) => {
        const peso = set.pesoReal > 0 ? `${set.pesoReal} kg` : "sin peso";
        const reps = set.repsReal ? ` × ${escaparHtml(set.repsReal)}` : "";
        return `<p class="serie-linea">Serie ${set.serie}: <b>${peso}${reps}</b></p>`;
      }).join("");
    sesionEjerciciosEl.appendChild(bloque);
  });
}

// ---- Botones ----

document.getElementById("btn-volver-historial").addEventListener("click", renderHistorial);

document.getElementById("btn-borrar-sesion").addEventListener("click", async () => {
  const s = obtenerSesion(sesionAbiertaId);
  if (s && await confirmar("¿Borrar este entrenamiento del historial? No se puede deshacer.", { aceptar: "Borrar", peligro: true })) {
    borrarSesion(s.id);
    renderHistorial();
  }
});

// ---- Arranque ----

document.querySelector('[data-ir="historial"]').addEventListener("click", renderHistorial);
renderHistorial();
