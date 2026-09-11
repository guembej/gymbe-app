// @ts-check
// ==========================================================
//  Consultas derivadas del historial
//  Solo leen: progreso, ultima marca, si una serie se marca sola.
// ==========================================================

// ----------------------------------------------------------
//  Indice de sets por ejercicio
//  Sin el, cada consulta recorria y REORDENABA todo el historial, y eso pasa
//  una vez por ejercicio y por repintado. Se construye a demanda y se tira
//  cuando cambia el historial.
// ----------------------------------------------------------

let _indiceSets = null;

function _indice() {
  if (_indiceSets) return _indiceSets;
  _indiceSets = new Map();
  [...DATOS.sesiones]
    .sort((a, b) => b.fecha.localeCompare(a.fecha)) // de mas reciente a mas antigua
    .forEach((sesion) => {
      sesion.sets.forEach((set) => {
        if (!_indiceSets.has(set.exerciseId)) _indiceSets.set(set.exerciseId, []);
        _indiceSets.get(set.exerciseId).push({ set, fecha: sesion.fecha, sesionId: sesion.id });
      });
    });
  return _indiceSets;
}

// Lo llaman terminarSesion(), borrarSesion() e importarDatos().
function invalidarIndiceSets() {
  _indiceSets = null;
}

// Ejercicios cuyo nombre contiene 'texto' (ignora mayúsculas y tildes).
// Devuelve { coincidencias: [...], hayExacto } — hayExacto = ya existe uno igual.
function filtrarEjercicios(texto, limite = 6) {
  const t = _sinTildes(texto).trim();
  if (!t) return { coincidencias: [], hayExacto: false };
  const todos = listarEjercicios();
  return {
    coincidencias: todos.filter((e) => _sinTildes(e.nombre).includes(t)).slice(0, limite),
    hayExacto: todos.some((e) => _sinTildes(e.nombre).trim() === t),
  };
}

// ----------------------------------------------------------
//  Progreso: evolución de un ejercicio a lo largo del historial
//  Devuelve un punto por sesión (orden: de más antigua a más reciente):
//    { fecha, sesionId, pesoMax, volumen, rm }
//  - pesoMax: el peso más alto levantado ese día
//  - volumen: suma de peso x repeticiones
//  - rm: 1RM estimado (Epley) de la mejor serie: peso x (1 + reps/30)
// ----------------------------------------------------------
// La mejor serie del día más reciente en que se registró este ejercicio.
// "Mejor" = más peso; a igualdad de peso, más repeticiones.
// Devuelve { peso, reps, fecha } o null si no hay ningún registro.
function mejorSerieUltimoDia(exerciseId) {
  const entradas = _indice().get(exerciseId);
  if (!entradas || entradas.length === 0) return null;

  // El indice viene ordenado: la primera entrada marca el dia mas reciente.
  const fecha = entradas[0].fecha;
  let mejor = null;
  for (const e of entradas) {
    if (e.fecha !== fecha) break;
    const peso = _num(e.set.pesoReal, 0, 0);
    const reps = parseInt(e.set.repsReal, 10) || 0;
    if (!mejor || peso > mejor.peso || (peso === mejor.peso && reps > mejor.reps)) {
      mejor = { peso, reps };
    }
  }
  return { peso: mejor.peso, reps: mejor.reps, fecha };
}

// Al pulsar "Empezar entrenamiento" con una rutina, ¿qué relación tiene con el
// entreno que ya haya en curso? "ninguna" | "misma" (misma rutina) | "otra".
function conflictoDeSesion(sesion, rutinaId) {
  if (!sesion) return "ninguna";
  return sesion.routineId === rutinaId ? "misma" : "otra";
}

// ¿Esta serie cuenta como hecha? Sí en cuanto tiene repeticiones.
//
// El peso NO entra en la cuenta a propósito: las repeticiones son lo que dice
// que la serie ha ocurrido; el peso es un dato de esa serie. Si se exigieran los
// dos, los ejercicios de peso corporal (fondos, dominadas, toda la calistenia)
// se perderían en silencio al terminar el entreno.
//
// Antes había ademas una casilla para marcarlas a mano. Se quitó en la v1.8.0:
// si rellenas la fila ya está hecha, y nadie la tocaba nunca.
function serieRegistrada(fila) {
  return String(fila.repsReal == null ? "" : fila.repsReal).trim() !== "";
}

function progresoDeEjercicio(exerciseId) {
  const puntos = [];

  DATOS.sesiones.forEach((sesion) => {
    const sets = sesion.sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length === 0) return;

    let pesoMax = 0;
    let volumen = 0;
    let rm = 0;
    sets.forEach((set) => {
      const peso = _num(set.pesoReal, 0, 0);
      const reps = parseInt(set.repsReal, 10) || 0;
      if (peso > pesoMax) pesoMax = peso;
      volumen += peso * reps;
      const rmSet = reps > 0 ? peso * (1 + reps / 30) : peso;
      if (rmSet > rm) rm = rmSet;
    });

    puntos.push({
      fecha: sesion.fecha,
      sesionId: sesion.id,
      pesoMax: Math.round(pesoMax * 10) / 10,
      volumen: Math.round(volumen),
      rm: Math.round(rm * 10) / 10,
    });
  });

  return puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
