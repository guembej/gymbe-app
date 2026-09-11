// ==========================================================
//  Iconos — helper para usarlos desde JavaScript
//  Los dibujos estan en index.html (bloque de <symbol id="ico-...">).
//  Aqui solo generamos el trocito de HTML que los coloca.
// ==========================================================

// icono("editar") -> '<svg class="ico" ...><use href="#ico-editar" /></svg>'
// La clase extra sirve para variantes (p. ej. "ico-linea" dentro de un texto).
function icono(nombre, claseExtra = "") {
  const clase = claseExtra ? `ico ${claseExtra}` : "ico";
  return `<svg class="${clase}" aria-hidden="true"><use href="#ico-${nombre}" /></svg>`;
}

// Misma idea pero devolviendo un nodo, para cuando montamos el DOM a mano.
function nodoIcono(nombre, claseExtra = "") {
  const envoltorio = document.createElement("div");
  envoltorio.innerHTML = icono(nombre, claseExtra);
  return envoltorio.firstElementChild;
}
