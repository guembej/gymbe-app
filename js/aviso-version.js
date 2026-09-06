// ==========================================================
//  Lógica de la barra "Versión nueva disponible".
//  Está en su propio archivo para poder probarla (tests/tests.js).
// ==========================================================

// Se llama al pulsar "Actualizar":
//  - oculta la barra al instante (respuesta inmediata para el usuario),
//  - pide al service worker en espera que tome el control,
//  - programa una recarga de seguridad por si el evento 'controllerchange'
//    no llega (pasa en algunos móviles con la app instalada), así la barra
//    no se queda pegada en pantalla.
//
// 'programar' se puede inyectar en las pruebas; por defecto es setTimeout.
function manejarClicActualizar(barra, swEnEspera, recargar, programar) {
  if (barra) barra.hidden = true;
  if (swEnEspera && typeof swEnEspera.postMessage === "function") {
    swEnEspera.postMessage({ tipo: "actualizar" });
  }
  const prog = typeof programar === "function" ? programar : setTimeout;
  prog(() => { if (typeof recargar === "function") recargar(); }, 3000);
}

// Para Node/otros entornos sin ventana (las pruebas corren en navegador).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { manejarClicActualizar };
}
