// ==========================================================
//  Pestaña "Progreso" — evolución de un ejercicio en el tiempo
//  Gráfica de línea dibujada a mano en SVG (sin librerías).
// ==========================================================

const progresoSelect = document.getElementById("progreso-ejercicio");
const progresoGraficaEl = document.getElementById("progreso-grafica");
const progresoPuntoEl = document.getElementById("progreso-punto");
const progresoResumenEl = document.getElementById("progreso-resumen");

let progresoEjId = null;      // ejercicio elegido
let progresoMetrica = "pesoMax"; // pesoMax | volumen | rm

const ETIQUETA_METRICA = { pesoMax: "Peso máximo", volumen: "Volumen", rm: "1RM estimado" };

// "3 sept" (para textos)
function _pgDia(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
}
// "3/9" (compacto, para el eje X)
function _pgDiaCorto(iso) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
// número bonito: 62.5 -> "62,5"  ·  4302 -> "4.302"
function _pgNum(n) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

// ---- Selector de ejercicio ----

function rellenarSelectProgreso() {
  const ejercicios = listarEjercicios();
  progresoSelect.innerHTML = "";
  ejercicios.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.id;
    const n = progresoDeEjercicio(e.id).length;
    opt.textContent = e.nombre + (n > 0 ? "" : "  (sin datos)");
    progresoSelect.appendChild(opt);
  });

  // Si el elegido ya no existe, coger el ejercicio con más cambio de peso (el más interesante)
  if (!progresoEjId || !ejercicios.some((e) => e.id === progresoEjId)) {
    let mejor = ejercicios[0];
    let mejorPuntuacion = -1;
    ejercicios.forEach((e) => {
      const p = progresoDeEjercicio(e.id);
      if (p.length < 2) return;
      const cambio = Math.abs(p[p.length - 1].pesoMax - p[0].pesoMax);
      const puntuacion = cambio * 10 + p.length; // prioriza cambio, luego nº de sesiones
      if (puntuacion > mejorPuntuacion) { mejorPuntuacion = puntuacion; mejor = e; }
    });
    progresoEjId = mejor ? mejor.id : null;
  }
  if (progresoEjId) progresoSelect.value = progresoEjId;
}

progresoSelect.addEventListener("change", () => {
  progresoEjId = progresoSelect.value;
  pintarProgreso();
});

document.getElementById("progreso-metricas").addEventListener("click", (evento) => {
  const btn = evento.target.closest("button[data-metrica]");
  if (!btn) return;
  progresoMetrica = btn.dataset.metrica;
  document.querySelectorAll("#progreso-metricas .conmutador-boton").forEach((b) => {
    b.classList.toggle("activo", b === btn);
  });
  pintarProgreso();
});

// ---- Gráfica SVG ----

function generarGrafica(puntos) {
  const W = 320, H = 190;
  const m = { t: 14, r: 14, b: 34, l: 42 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;

  const vals = puntos.map((p) => p[progresoMetrica]);
  const eje = marcasEjeY(Math.min(...vals), Math.max(...vals));

  const x = (i) => (puntos.length === 1 ? m.l + iw / 2 : m.l + (i / (puntos.length - 1)) * iw);
  const y = (v) => m.t + ih - ((v - eje.min) / (eje.max - eje.min)) * ih;

  const rejilla = eje.marcas
    .map((v) => {
      const yy = y(v).toFixed(1);
      return `<line class="pg-grid" x1="${m.l}" y1="${yy}" x2="${m.l + iw}" y2="${yy}" />
        <text class="pg-eje" x="${m.l - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${v}</text>`;
    })
    .join("");

  const linea = puntos.map((p, i) => `${x(i).toFixed(1)},${y(p[progresoMetrica]).toFixed(1)}`).join(" ");
  const circulos = puntos
    .map((p, i) => `<circle class="pg-punto" cx="${x(i).toFixed(1)}" cy="${y(p[progresoMetrica]).toFixed(1)}" r="5" data-i="${i}" />`)
    .join("");

  // Eje X: fecha bajo cada punto; si hay muchos, se reparten unas cuantas
  const baseY = m.t + ih;
  const indices = indicesEtiquetasX(puntos.length, 6);
  const ejeX = indices
    .map((i) => {
      const px = x(i);
      const anchor = i === 0 ? "start" : i === puntos.length - 1 ? "end" : "middle";
      return `<line class="pg-grid" x1="${px.toFixed(1)}" y1="${baseY}" x2="${px.toFixed(1)}" y2="${baseY + 4}" />
        <text class="pg-eje" x="${px.toFixed(1)}" y="${baseY + 15}" text-anchor="${anchor}">${_pgDiaCorto(puntos[i].fecha)}</text>`;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${W} ${H}" class="pg-svg" role="img" aria-label="Gráfica de evolución">
      ${rejilla}
      <line class="pg-eje-linea" x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${baseY}" />
      <line class="pg-eje-linea" x1="${m.l}" y1="${baseY}" x2="${m.l + iw}" y2="${baseY}" />
      ${ejeX}
      ${puntos.length > 1 ? `<polyline class="pg-linea" points="${linea}" />` : ""}
      ${circulos}
    </svg>`;
}

// ---- Pintado ----

function pintarProgreso() {
  progresoPuntoEl.textContent = "";
  const puntos = progresoEjId ? progresoDeEjercicio(progresoEjId) : [];

  if (puntos.length === 0) {
    progresoGraficaEl.innerHTML = '<p class="vacio">Aún no has entrenado este ejercicio.</p>';
    progresoResumenEl.innerHTML = "";
    return;
  }

  progresoGraficaEl.innerHTML = generarGrafica(puntos);

  // Tocar un punto muestra su valor
  progresoGraficaEl.querySelectorAll(".pg-punto").forEach((c) => {
    c.addEventListener("click", () => {
      const p = puntos[Number(c.dataset.i)];
      progresoPuntoEl.textContent =
        `${_pgDia(p.fecha)}: ${_pgNum(p[progresoMetrica])} kg`;
    });
  });

  // Resumen
  const clave = progresoMetrica;
  const primero = puntos[0];
  let mejor = puntos[0];
  puntos.forEach((p) => { if (p[clave] > mejor[clave]) mejor = p; });
  const ultimo = puntos[puntos.length - 1];
  const dif = ultimo[clave] - primero[clave];
  const signo = dif > 0 ? "+" : "";

  const filas = [
    ["Métrica", ETIQUETA_METRICA[clave]],
    ["Mejor marca", `${_pgNum(mejor[clave])} kg · ${_pgDia(mejor.fecha)}`],
    ["Primera vez", `${_pgNum(primero[clave])} kg · ${_pgDia(primero.fecha)}`],
  ];
  if (puntos.length > 1) {
    filas.push(["Cambio", `${signo}${_pgNum(dif)} kg`]);
  }
  filas.push(["Sesiones", String(puntos.length)]);

  progresoResumenEl.innerHTML =
    '<table class="pg-tabla">' +
    filas.map(([k, v]) => `<tr><td>${k}</td><td>${escaparHtml(v)}</td></tr>`).join("") +
    "</table>" +
    (puntos.length === 1
      ? '<p class="ayuda">Necesitas otra sesión con este ejercicio para ver la evolución.</p>'
      : "");
}

function renderProgreso() {
  rellenarSelectProgreso();
  pintarProgreso();
}

document.querySelector('[data-ir="progreso"]').addEventListener("click", renderProgreso);
renderProgreso();
