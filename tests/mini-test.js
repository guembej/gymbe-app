// ==========================================================
//  Mini-runner de pruebas (sin librerías)
//  Uso:
//    prueba("descripción", () => { ... usa igual() / esVerdad() ... });
//    antesDeCada(() => { ... se ejecuta antes de cada prueba ... });
//  Al cargar la página, ejecuta todas y pinta el resultado.
// ==========================================================

const _pruebas = [];
let _antesDeCada = null;

function prueba(nombre, fn) {
  _pruebas.push({ nombre, fn });
}

function antesDeCada(fn) {
  _antesDeCada = fn;
}

// Comprueba que dos valores son iguales (compara también listas y objetos)
function igual(recibido, esperado, mensaje) {
  const a = JSON.stringify(recibido);
  const b = JSON.stringify(esperado);
  if (a !== b) {
    throw new Error(`${mensaje ? mensaje + ": " : ""}esperaba ${b}, recibí ${a}`);
  }
}

// Comprueba que algo es verdadero
function esVerdad(valor, mensaje) {
  if (!valor) throw new Error(mensaje || "esperaba un valor verdadero");
}

window.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("resultados");
  const resumen = document.getElementById("resumen");
  let pasadas = 0;

  _pruebas.forEach(({ nombre, fn }) => {
    const li = document.createElement("li");
    try {
      if (_antesDeCada) _antesDeCada();
      fn();
      li.className = "ok";
      li.textContent = "✅ " + nombre;
      pasadas++;
    } catch (error) {
      li.className = "fallo";
      li.textContent = "❌ " + nombre + "  —  " + error.message;
    }
    lista.appendChild(li);
  });

  const total = _pruebas.length;
  resumen.textContent = `${pasadas} de ${total} pruebas pasan`;
  resumen.className = pasadas === total ? "ok" : "fallo";

  // Limpiar la libretita de pruebas para no dejar basura
  if (window.GYM_CLAVE_ALMACEN) localStorage.removeItem(window.GYM_CLAVE_ALMACEN);
});
