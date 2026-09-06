// ==========================================================
//  Lógica de la actualización de versión.
//  En su propio archivo para poder probarla (tests/tests.js).
// ==========================================================

// ¿Qué hacer cuando el service worker nuevo toma el control de la página?
//   - "nada":     primera instalación (no había SW controlando), o ya hemos
//                 actuado en este ciclo de vida de la página.
//   - "recargar": hay versión nueva y NO hay un entreno a medias -> recargar
//                 directamente para pasar a la versión nueva.
//   - "avisar":   hay versión nueva pero hay un entreno en curso -> mostrar la
//                 barra y dejar que el usuario recargue cuando termine.
function decidirActualizacion({ habiaControlador, hayEntrenoEnCurso, yaHecho }) {
  if (yaHecho || !habiaControlador) return "nada";
  return hayEntrenoEnCurso ? "avisar" : "recargar";
}

// Para Node/otros entornos (las pruebas corren en navegador).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { decidirActualizacion };
}
